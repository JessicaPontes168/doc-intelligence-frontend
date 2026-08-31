# Especificação — DOC Intelligence (Trilha B, Front-end)

## Escopo escolhido

Trilha B: interface do atendimento. A API não existe — este documento define o
contrato que a interface espera, e o front consome um mock que respeita esse
contrato, para que a troca por uma API real não exija reescrever a tela.

## Fatia vertical entregue

Uma tela única cobrindo: envio de vários arquivos de uma vez → acompanhamento do
status de processamento → fila de revisão (documento original ao lado dos campos
extraídos) → correção de campo → confirmação → busca nos documentos já
processados.

Fora da fatia (não implementado nesta entrega, mas endereçado na seção de riscos
e no ADR): autenticação, paginação real, múltiplas telas/rotas, upload
resumível, testes automatizados, deploy.

## Contrato de API assumido (o mock respeita este contrato)

```
POST /documents
  body: multipart/form-data { file }
  resposta: { id, status: "processing" }

GET /documents?search=&status=
  resposta: [{
    id, originalName, suggestedName, status, type,
    confidence, fields, version, modelVersion, promptVersion
  }]

GET /documents/:id
  resposta: detalhe completo do item acima, incluindo previewUrl

PATCH /documents/:id
  body: { fields, suggestedName, status, expectedVersion }
  regra: se expectedVersion != version atual no servidor -> 409 Conflict
  resposta: item atualizado com version incrementada
```

O `expectedVersion`/`version` é o mecanismo de lock otimista (ver fato g). No
mock, isso é simulado em memória no cliente; numa API real, `version` mora no
banco.

## Estados de um documento

`processing -> done` (confiança alta, segue direto)
`processing -> review -> done` (confiança baixa, precisa de correção humana)
`processing -> error` (falha do modelo de terceiro; ver fato a)

## Fatos do ambiente e como cada um foi endereçado

- **(a) latência/erro do modelo de terceiro (5–40s, falha ocasional):**
  a UI trata cada documento como assíncrono desde o upload — a lista mostra
  "Processando..." e atualiza sozinha quando o resultado chega (ou dá erro).
  Não há polling bloqueante nem tela travada esperando resposta.
- **(b) nome de arquivo sem padrão:** o nome original nunca é usado como
  identidade do documento; a UI propõe um nome padronizado após a extração, que
  o atendente confirma ou edita antes de concluir.
- **(c) reenvio do mesmo documento:** hash do conteúdo do arquivo calculado no
  cliente antes do upload; duplicata é sinalizada e não reprocessada. Registrado
  como risco: dedupe definitivo exige o mesmo hash no back-end, porque dois
  atendentes em máquinas diferentes não compartilham estado do navegador.
- **(d) dado pessoal sensível:** campos extraídos aparecem mascarados por
  padrão, com opção explícita de revelar; nada de sensível vai para
  `console.log`. Registrado como risco: mascaramento de UI não substitui
  controle de acesso, criptografia em repouso e política de retenção, que são
  decisão de back-end/infra.
- **(e)/(f) volume/pico e troca de versão do modelo:** a fila de chamadas ao
  mock limita a concorrência no cliente (evita desenhar uma fila "infinita"),
  e cada documento processado carrega `modelVersion`/`promptVersion`, para que
  uma futura troca de prompt seja rastreável. Registrado como risco: rate
  limit, retry/backoff e migração em massa de documentos já processados são
  responsabilidade do back-end, fora desta fatia.
- **(g) duas pessoas na fila ao mesmo tempo:** lock otimista via `version` —
  se o documento mudou entre abrir e confirmar a revisão, a UI avisa em vez de
  sobrescrever silenciosamente.

## O que foi testado, e por quê

Nenhum teste automatizado foi escrito nesta entrega — o tempo foi priorizado
para cobrir a fatia ponta-a-ponta e tratar os fatos do ambiente acima, que
pareceram o critério mais explícito do enunciado. Validação foi manual: upload
múltiplo, duplicata, conflito de edição simultânea (duas abas) e mensagens de
erro do "modelo".
