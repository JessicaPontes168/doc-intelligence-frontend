import React, { useState, useRef, useCallback } from "react";

// ============================================================
// FATOS DO AMBIENTE — como cada um foi tratado neste front-end
// ============================================================
// (b) nome de arquivo sem padrão (celular) ->
//     TRATADO: nunca usamos filename original como identidade do
//     documento. Após o processamento, sugerimos um nome padronizado
//     (tipo + campo-chave + data) que o atendente confirma ou edita.
//
// (c) reenvio do mesmo documento ->
//     TRATADO (parcial, no cliente): calculamos hash SHA-256 do
//     conteúdo do arquivo antes de subir. Se já existe um doc com o
//     mesmo hash, avisamos e não reprocessamos (economiza chamada
//     paga ao modelo). RISCO CONHECIDO: essa checagem só vale dentro
//     da sessão do navegador — dedupe definitivo tem que existir no
//     back-end (hash + índice), porque dois atendentes em máquinas
//     diferentes não compartilham este estado.
//
// (d) dado pessoal sensível ->
//     TRATADO parcialmente: campos extraídos ficam mascarados por
//     padrão (toggle "mostrar"), e nunca fazemos console.log de
//     `fields`. RISCO CONHECIDO: mascaramento real de PII, criptografia
//     em repouso, controle de acesso e retenção/expurgo são decisão de
//     back-end/infra e não podem ser garantidos só na UI — um usuário
//     mal-intencionado com devtools ainda vê o estado em memória.
//
// (e)/(f) volume/pico de 800 docs/dia e troca de versão do modelo ->
//     REGISTRADO COMO RISCO CONHECIDO, não implementado aqui:
//     - limitamos a CONCURRENCY chamadas simultâneas ao "modelo" no
//       cliente, só para não desenhar uma fila que finge ser infinita;
//       o rate-limit e a fila de verdade (retry/backoff, prioridade)
//       são responsabilidade do back-end.
//     - guardamos `modelVersion`/`promptVersion` em cada documento
//       processado, para que uma futura troca de prompt não misture
//       resultados de versões diferentes sem rastro. A migração/
//       reprocessamento em massa fica fora do escopo desta fatia.
//
// (g) duas pessoas na fila de conferência ao mesmo tempo ->
//     TRATADO: cada doc tem um `version` (lock otimista simulado). Ao
//     abrir para revisão guardamos a versão vista; ao confirmar,
//     comparamos com a versão atual — se mudou, avisamos o atendente
//     em vez de sobrescrever o que a outra pessoa salvou.
// ============================================================

const MODEL_VERSION = "vendor-model-v3";
const PROMPT_VERSION = "2026-06-a";
const MAX_CONCURRENT_CALLS = 3; // simula backpressure em dia de pico

const DOC_TYPES = [
  { type: "RG", fields: ["nome", "filiacao", "dataNascimento", "numero", "orgaoEmissor"], nameKey: "nome" },
  { type: "Comprovante de Residência", fields: ["nome", "endereco", "dataEmissao"], nameKey: "nome" },
  { type: "Contracheque", fields: ["nome", "empresa", "mesReferencia", "salarioBruto"], nameKey: "nome" },
];

async function sha256(file) {
  const buf = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function suggestFilename(type, fields, nameKey, originalExt) {
  const raw = (fields[nameKey] || "documento").toString();
  const slug = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `${type.replace(/\s+/g, "")}_${slug}_${date}.${originalExt}`;
}

function fakeExtract(docType) {
  const confidence = Math.random();
  const fields = {};
  docType.fields.forEach((f) => (fields[f] = `${f}_extraido`));
  return { confidence, fields, needsReview: confidence < 0.75 };
}

// fila com no máximo MAX_CONCURRENT_CALLS chamadas simultâneas ao "modelo"
let running = 0;
const waiting = [];
function scheduleCall(fn) {
  return new Promise((resolve) => {
    const task = () => {
      running++;
      fn().finally(() => {
        running--;
        if (waiting.length) waiting.shift()();
      }).then(resolve);
    };
    if (running < MAX_CONCURRENT_CALLS) task();
    else waiting.push(task);
  });
}

function mockProcessDocument(docType) {
  return scheduleCall(
    () =>
      new Promise((resolve) => {
        const delay = 1500 + Math.random() * 2500;
        setTimeout(() => {
          if (Math.random() < 0.1) {
            resolve({ status: "error" });
            return;
          }
          const result = fakeExtract(docType);
          resolve({
            status: result.needsReview ? "review" : "done",
            type: docType.type,
            confidence: result.confidence,
            fields: result.fields,
            modelVersion: MODEL_VERSION,
            promptVersion: PROMPT_VERSION,
          });
        }, delay);
      })
  );
}

let nextId = 1;

function maskValue(value) {
  if (!value) return value;
  const s = String(value);
  if (s.length <= 4) return "•".repeat(s.length);
  return s.slice(0, 2) + "•".repeat(s.length - 4) + s.slice(-2);
}

// ============================================================
// IDENTIDADE VISUAL — Lamarck Sociedade de Advogados
// Paleta original (não extraída de nenhum ativo real da empresa)
// ============================================================
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const COLORS = {
  navy: "#0f2440",
  navyDeep: "#0a1930",
  surface: "#eef1f4",
  panel: "#ffffff",
  ink: "#132a44",
  line: "#d7dde3",
  muted: "#5c6b7a",
  brass: "#a9812f",
  brassLight: "#c9a24a",
  done: "#2f6b4f",
  review: "#9c6b0c",
  error: "#a8341c",
};

const btnPrimary = {
  padding: "10px 18px",
  borderRadius: 3,
  border: "none",
  background: COLORS.navy,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.2,
};

const btnSecondary = {
  padding: "10px 18px",
  borderRadius: 3,
  border: `1px solid ${COLORS.line}`,
  background: "transparent",
  color: COLORS.ink,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const btnGhost = {
  padding: "3px 9px",
  borderRadius: 2,
  border: `1px solid ${COLORS.line}`,
  background: "transparent",
  color: COLORS.muted,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 500,
};

const inputUnderline = {
  width: "100%",
  padding: "7px 2px",
  border: "none",
  borderBottom: `1px solid ${COLORS.line}`,
  background: "transparent",
  fontFamily: FONT_SANS,
  fontSize: 14,
  color: COLORS.ink,
  boxSizing: "border-box",
};

function badgeStyle(status) {
  const color =
    status === "done" ? COLORS.done :
      status === "review" ? COLORS.review :
        status === "error" ? COLORS.error :
          COLORS.muted;
  return {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 2,
    border: `1px solid ${color}`,
    color,
    fontSize: 11,
    fontWeight: 600,
  };
}

// Monograma original em SVG — substitua por <img src="/logo-lamarck.png" />
// quando tiver o arquivo oficial da marca.
function BrandMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="Lamarck Sociedade de Advogados">
      <rect x="1" y="1" width="38" height="38" rx="3" fill={COLORS.navy} stroke={COLORS.brassLight} strokeWidth="1" />
      <text
        x="20" y="27"
        textAnchor="middle"
        fontFamily={FONT_SERIF}
        fontSize="17"
        fontWeight="700"
        fill={COLORS.brassLight}
      >
        LA
      </text>
    </svg>
  );
}

export default function App() {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [conflict, setConflict] = useState(null);
  const [duplicateNotice, setDuplicateNotice] = useState(null);
  const [openedVersion, setOpenedVersion] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);

    for (const file of files) {
      const hash = await sha256(file);

      // (c) reenvio do mesmo documento — dedupe por conteúdo, não por nome
      const dup = docs.find((d) => d.hash === hash);
      if (dup) {
        setDuplicateNotice(
          `"${file.name}" tem o mesmo conteúdo de um documento já enviado ("${dup.suggestedName || dup.originalName}"). Não foi reenviado ao modelo.`
        );
        continue;
      }

      const id = nextId++;
      const ext = file.name.split(".").pop() || "bin";
      const newDoc = {
        id,
        hash,
        originalName: file.name, // nunca usado como identidade, só exibido
        suggestedName: null,
        status: "processing",
        type: null,
        confidence: null,
        fields: {},
        previewUrl: URL.createObjectURL(file),
        version: 0, // lock otimista — (g)
        modelVersion: null,
        promptVersion: null,
        ext,
      };

      setDocs((prev) => [newDoc, ...prev]);

      const docType = DOC_TYPES[Math.floor(Math.random() * DOC_TYPES.length)];
      mockProcessDocument(docType).then((result) => {
        setDocs((prev) =>
          prev.map((doc) => {
            if (doc.id !== id) return doc;
            if (result.status === "error") {
              return { ...doc, status: "error", version: doc.version + 1 };
            }
            const suggestedName = suggestFilename(
              result.type,
              result.fields,
              docType.nameKey,
              doc.ext
            );
            return {
              ...doc,
              ...result,
              suggestedName,
              version: doc.version + 1,
            };
          })
        );
      });
    }
  }, [docs]);

  function toggleReveal(id, key) {
    setRevealed((prev) => ({ ...prev, [`${id}:${key}`]: !prev[`${id}:${key}`] }));
  }

  function updateField(id, key, value) {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, fields: { ...doc.fields, [key]: value } } : doc
      )
    );
  }

  function updateSuggestedName(id, value) {
    setDocs((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, suggestedName: value } : doc))
    );
  }

  // (g) lock otimista: guarda a versão vista ao abrir a revisão
  function openReview(doc) {
    setSelectedId(doc.id);
    setOpenedVersion(doc.version);
    setConflict(null);
  }
  function confirmReview(id, versionSeenOnOpen) {
    const current = docs.find((d) => d.id === id);
    if (!current) return;
    if (current.version !== versionSeenOnOpen) {
      setConflict(
        "Este documento foi alterado por outra pessoa enquanto você revisava. Recarregue os dados antes de confirmar."
      );
      return;
    }
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status: "done", version: doc.version + 1 } : doc
      )
    );
    setSelectedId(null);
  }

  const filtered = docs.filter(
    (d) =>
      d.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (d.suggestedName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.type || "").toLowerCase().includes(search.toLowerCase())
  );

  const selected = docs.find((d) => d.id === selectedId);

  const statusLabel = {
    processing: "Processando...",
    done: "Pronto",
    review: "Revisão pendente",
    error: "Erro no processamento (tentar novamente)",
  };

  return (
    <div style={{ background: COLORS.surface, minHeight: "100vh", fontFamily: FONT_SANS }}>

      {/* Faixa superior estilo escritório de advocacia */}
      <div style={{ background: COLORS.navy, borderBottom: `3px solid ${COLORS.brass}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <BrandMark size={38} />
          <div>
            <div style={{ fontFamily: FONT_SERIF, fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
              Lamarck Sociedade de Advogados
            </div>
            <div style={{ fontSize: 11, color: COLORS.brassLight, letterSpacing: 0.3 }}>
              Núcleo de Documentação · Direito Previdenciário
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

        <h1 style={{ fontFamily: FONT_SERIF, fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: 0, paddingBottom: 12, borderBottom: `2px solid ${COLORS.navy}` }}>
          DOC Intelligence
        </h1>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, margin: "8px 0 24px", padding: "6px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          modelo {MODEL_VERSION} · prompt {PROMPT_VERSION} · fila de {MAX_CONCURRENT_CALLS} chamadas simultâneas
        </p>

        <div style={{ border: `1.5px dashed ${COLORS.brass}`, background: "rgba(169,129,47,0.05)", padding: 18, marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
            Enviar documento do cliente (RG, comprovante de residência, contracheque)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {duplicateNotice && (
          <div
            style={{ borderLeft: `3px solid ${COLORS.review}`, background: "rgba(156,107,12,0.07)", color: COLORS.ink, padding: "10px 14px", marginBottom: 16, fontSize: 13, cursor: "pointer" }}
            onClick={() => setDuplicateNotice(null)}
          >
            {duplicateNotice} (clique para dispensar)
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Buscar por nome, nome sugerido ou tipo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputUnderline}
          />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.navy}` }}>
              <th style={{ padding: "8px 10px", fontSize: 11, color: COLORS.muted, fontWeight: 600, fontFamily: FONT_MONO }}>Nº</th>
              <th style={{ padding: "8px 10px", fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>Arquivo original</th>
              <th style={{ padding: "8px 10px", fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>Nome sugerido</th>
              <th style={{ padding: "8px 10px", fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>Tipo</th>
              <th style={{ padding: "8px 10px", fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>Status</th>
              <th style={{ padding: "8px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.line}`, background: i % 2 === 1 ? "rgba(15,36,64,0.02)" : "transparent" }}>
                <td style={{ padding: "10px", fontFamily: FONT_MONO, fontSize: 12, color: COLORS.muted }}>
                  {String(d.id).padStart(4, "0")}
                </td>
                <td style={{ padding: "10px", color: COLORS.muted, fontSize: 13 }}>{d.originalName}</td>
                <td style={{ padding: "10px", fontSize: 13, color: COLORS.ink }}>{d.suggestedName || "-"}</td>
                <td style={{ padding: "10px", fontSize: 13, color: COLORS.ink }}>{d.type || "-"}</td>
                <td style={{ padding: "10px" }}>
                  <span style={badgeStyle(d.status)}>{statusLabel[d.status]}</span>
                </td>
                <td style={{ padding: "10px" }}>
                  {(d.status === "review" || d.status === "done") && (
                    <button style={btnSecondary} onClick={() => openReview(d)}>Ver</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: COLORS.muted, fontSize: 13, textAlign: "center" }}>
                  Nenhum documento.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {selected && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(10,25,48,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setSelectedId(null)}
          >
            <div
              style={{
                background: COLORS.panel, borderRadius: 4, padding: 28,
                width: "100%", maxWidth: 860, maxHeight: "85vh", overflowY: "auto",
                display: "flex", gap: 28,
                boxShadow: "0 10px 40px rgba(10,25,48,0.35)",
                borderTop: `3px solid ${COLORS.brass}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ flex: 1, borderRight: `1px solid ${COLORS.line}`, paddingRight: 28 }}>
                {selected.ext?.toLowerCase() === "pdf" ? (
                  <iframe
                    src={selected.previewUrl}
                    title={selected.originalName}
                    style={{ width: "100%", height: "500px", border: `1px solid ${COLORS.line}` }}
                  />
                ) : (
                  <img
                    src={selected.previewUrl}
                    alt={selected.originalName}
                    style={{ maxWidth: "100%", border: `1px solid ${COLORS.line}` }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: FONT_SERIF, fontSize: 19, fontWeight: 700, color: COLORS.ink, margin: "0 0 4px" }}>
                  {selected.type}
                </h3>
                {import.meta.env.DEV && (
                  <button
                    onClick={() => {
                      setDocs(prev => prev.map(d =>
                        d.id === selected.id ? { ...d, version: d.version + 1 } : d
                      ));
                    }}
                    style={{ ...btnGhost, color: COLORS.error, borderColor: COLORS.error, marginBottom: 8 }}
                  >
                    [dev only] simular edição concorrente
                  </button>
                )}
                <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 10 }}>
                  modelo {selected.modelVersion} · prompt {selected.promptVersion} · protocolo {String(selected.id).padStart(4, "0")}
                </p>
                <p style={{ fontSize: 14, marginBottom: 14 }}>
                  Confiança: {(selected.confidence * 100).toFixed(0)}%{" "}
                  {selected.status === "review" && (
                    <span style={badgeStyle("review")}>revisão necessária</span>
                  )}
                </p>

                {conflict && (
                  <div style={{ borderLeft: `3px solid ${COLORS.error}`, background: "rgba(168,52,28,0.07)", color: COLORS.ink, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                    {conflict}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                    Nome padronizado do arquivo
                  </label>
                  <input
                    type="text"
                    value={selected.suggestedName || ""}
                    onChange={(e) => updateSuggestedName(selected.id, e.target.value)}
                    style={inputUnderline}
                  />
                </div>

                {Object.entries(selected.fields).map(([key, value]) => {
                  const isRevealed = revealed[`${selected.id}:${key}`];
                  return (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>
                        {key}
                        <button
                          type="button"
                          onClick={() => toggleReveal(selected.id, key)}
                          style={btnGhost}
                        >
                          {isRevealed ? "ocultar" : "mostrar"}
                        </button>
                      </label>
                      <input
                        type="text"
                        value={isRevealed ? value : maskValue(value)}
                        onChange={(e) => updateField(selected.id, key, e.target.value)}
                        disabled={!isRevealed}
                        style={{ ...inputUnderline, color: isRevealed ? COLORS.ink : COLORS.muted }}
                      />
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button style={btnPrimary} onClick={() => confirmReview(selected.id, openedVersion)}>
                    Confirmar e concluir
                  </button>
                  <button style={btnSecondary} onClick={() => setSelectedId(null)}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}