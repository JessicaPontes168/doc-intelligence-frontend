# Registro de Decisões de Arquitetura (ADR)

## ADR-01 — Mock de API embutido no cliente, sem servidor separado

**Decisão:** simular o backend com uma função em memória (`mockProcessDocument`)
dentro do próprio bundle React, em vez de subir um servidor mock separado.

**Alternativas consideradas:**
- MSW (Mock Service Worker) — intercepta fetch/XHR de forma transparente,
  deixando o código de produção "limpo" (chamadas reais de fetch). Descartado
  por tempo: exige configurar service worker e handlers; para uma fatia
  vertical de avaliação, o ganho não compensou o setup.
- `json-server` — precisa de um processo Node separado rodando ao lado do
  Vite. Descartado pelo mesmo motivo, e por acoplar a entrega a duas portas/dois
  processos para quem for rodar o projeto.

**Consequência:** o contrato de API fica documentado em `ESPECIFICACAO.md` e
implícito no formato dos objetos que o mock devolve, mas não existe uma camada
`fetch` real hoje — trocar o mock por chamadas HTTP é o próximo passo óbvio e
está registrado como risco/pendência.

## ADR-02 — Dedupe por hash SHA-256 do conteúdo, calculado no cliente

**Decisão:** usar `crypto.subtle.digest` sobre o arquivo antes do upload para
identificar reenvios do mesmo documento.

**Alternativas consideradas:**
- Comparar por nome de arquivo — descartado porque o fato (b) do enunciado
  já invalida isso: o nome vem sem padrão nenhum do celular.
- Comparar por tamanho do arquivo — descartado por gerar falsos positivos
  (dois documentos diferentes podem ter o mesmo tamanho em bytes).
- Deixar o dedupe inteiramente para o back-end — descartado como única
  solução porque significaria gastar uma chamada paga ao modelo antes de
  descobrir que era duplicata; ainda assim, o back-end precisa fazer a mesma
  checagem (ver risco em ESPECIFICACAO.md), porque o hash local só enxerga o
  que passou por aquele navegador.

**Consequência:** dedupe funciona dentro de uma sessão de upload, mas não
substitui um índice de hashes no servidor.

## ADR-03 — Lock otimista simulado com campo `version`

**Decisão:** cada documento carrega um contador `version`; a tela de revisão
guarda a versão vista ao abrir e recusa confirmar se a versão mudou.

**Alternativas consideradas:**
- Lock pessimista (travar o documento para outros atendentes ao abrir) —
  descartado: exigiria um mecanismo de "liberar trava" em caso de aba fechada
  sem confirmar, o que é mais estado para gerenciar do que o problema pede
  numa fatia vertical.
- Ignorar o problema (fato g) — descartado porque o enunciado cita
  explicitamente duas pessoas abrindo a fila ao mesmo tempo como fato do
  ambiente; ignorá-lo é o tipo de omissão que o desafio diz que vai procurar.

**Consequência:** colisão vira aviso explícito para o atendente, não
sobrescrita silenciosa. Falta (fora do escopo desta fatia): reconciliação
assistida, mostrando o que a outra pessoa mudou.

## ADR-04 — Mascaramento de campos sensíveis só na apresentação

**Decisão:** os valores extraídos ficam mascarados na tela por padrão, com
toggle "mostrar" por campo; nunca logamos `fields` no console.

**Alternativas consideradas:**
- Não mascarar nada, confiando em controle de acesso da rede interna —
  descartado: o enunciado marca explicitamente (d) dado pessoal sensível como
  fato do ambiente, então tratar isso só na camada de rede é insuficiente
  quando a própria tela expõe o dado por padrão.
- Mascaramento "de verdade" (criptografia ponta a ponta, campo nunca sai em
  claro do servidor) — descartado nesta fatia por ser decisão de back-end/infra,
  fora do que o front-end pode garantir sozinho; registrado como risco em
  ESPECIFICACAO.md.

**Consequência:** reduz exposição em compartilhamento de tela / print
acidental, mas não é controle de segurança real — é mitigação de UI.

## ADR-05 — Sem biblioteca de estado global (Redux/Zustand)

**Decisão:** todo o estado vive em `useState` no componente `App`.

**Alternativas consideradas:**
- Context API / Redux — descartado por escala: uma tela, um componente,
  sem necessidade de compartilhar estado entre partes distantes da árvore.
  Introduzir uma lib de estado global aqui seria complexidade sem benefício
  correspondente, o oposto do que a fatia vertical pede.

**Consequência:** se a interface crescer para múltiplas telas (fila, busca,
detalhe como rotas separadas), essa decisão precisa ser revisitada.
