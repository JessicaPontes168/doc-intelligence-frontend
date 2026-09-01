# AGENTS.md — como o agente de IA foi usado nesta entrega

## Ferramenta

Claude (Anthropic), via chat, sem subagentes, skills customizadas, hooks ou
servidor MCP configurado além do ambiente padrão de execução de código do
próprio produto. Nenhuma configuração de projeto (`.claude/`, comandos
customizados) foi usada.

## Como o trabalho foi conduzido

1. Colei o enunciado completo do desafio e pedi a trilha front-end.
2. Pedi deliberadamente "só o código, o mais básico que funcione" primeiro,
   para ver a fatia vertical rodando antes de gastar tempo em documentação.
3. Perguntei explicitamente "o que faltou para o desafio completo" — o agente
   listou as lacunas (repositório, especificação, ADR, tratamento dos fatos do
   ambiente, README, registro de IA, carta de fechamento) em vez de inventar
   que a entrega já estava completa.
4. Apontei que os fatos do ambiente (b, c, d, e, f, g) não tinham sido
   tratados no primeiro código e pedi correção — o agente reescreveu o
   `App.jsx` tratando cada um (ou registrando como risco conhecido) e deixou
   isso documentado em comentário no topo do arquivo.
5. Pedi uma versão HTML autônoma (sem build) para visualizar rápido, além do
   projeto Vite "de verdade" para o repositório.
6. Pedi a estrutura completa do repositório (este conjunto de arquivos).

## Onde o agente errou, e o que foi feito a respeito

- Na primeira entrega de código, o agente ignorou quase todos os fatos do
  ambiente (b–g) mesmo eles estando explícitos no enunciado — entregou só o
  fluxo feliz (upload, processamento mockado, revisão, busca). Isso só foi
  corrigido porque foi cobrado explicitamente ("TRATE ISSO"). Isso é uma falha
  real do processo: o agente deveria ter sinalizado essas lacunas por conta
  própria na primeira entrega, já que o próprio enunciado pede exatamente isso.
- Ao gerar o arquivo com `create_file` pela primeira vez nesta rodada, houve
  um erro de parâmetros na chamada da ferramenta (faltou o campo `path`) que
  precisou ser refeito.
- O código gerado não foi executado de fato em um ambiente Node com
  `npm install` (o ambiente do agente não tem acesso à rede/npm) — ou seja,
  não há garantia de que `npm run dev` funcione sem ajuste; isso precisa ser
  validado por quem for rodar o projeto, e é uma limitação que deve constar na
  carta de fechamento.
- O histórico de commits deste repositório foi criado pelo agente de uma vez,
  organizados em commits separados por assunto para não ferir a exigência de
  "não um único commit chamado initial" — mas isso não substitui um histórico
  real de desenvolvimento incremental feito por uma pessoa. Isso deveria ser
  mencionado com transparência a quem for avaliar, ou refeito com commits que
  reflitam o processo real de quem for adaptar este material.

## Segunda fase — revisão e correção conduzida em conversa

Depois da entrega inicial do agente, revisei o repositório em uma sessão
separada de chat, também com Claude, agora no papel de revisor/orientador em
vez de gerador de código. Essa fase envolveu:

* Pedi que o agente avaliasse se a implementação resolvia o desafio — ele
  apontou lacunas reais no código (bug de preview de PDF, dedupe falhando
  dentro do mesmo lote de upload, botão de retry sem handler) e lacunas no
  pacote de entrega (contrato de API não formalizado).
* Ao tentar sincronizar o repositório local com um remoto criado pela
  interface do GitHub, o agente me orientou a resolver um conflito de
  históricos não relacionados, identificando corretamente que o histórico
  local (11 commits, criados como descrito acima) deveria prevalecer sobre os
  2 commits triviais do GitHub.
* Ao editar `prompts/prompts.md`, substitui acidentalmente o conteúdo real
  por um placeholder ("teste"), pretendendo preencher depois — o agente
  identificou o problema antes do commit, explicando por que isso contradiz a
  exigência do enunciado de registrar prompts como foram escritos, não
  reescritos depois. Revertido antes de commitar.
* Troquei o setup de Next.js para Vite+React no meio do processo (por
  familiaridade e prazo). O agente identificou que essa mudança precisava
  virar uma entrada de ADR nova (ADR-06), não uma edição silenciosa do
  código, e sinalizou uma inconsistência quando eu ia colar essa decisão
  sobre um ADR que na verdade não existia ainda no arquivo real.
* Identifiquei um `package-lock.json` órfão no repositório; o agente ajudou a
  rastrear a origem (setup Vite anterior) e decidir se deveria ser mantido ou
  descartado, dado que o repositório tinha dois setups coexistindo (Vite e
  HTML standalone) sem o README deixar claro qual era o de referência.

Essa fase mostra o uso do agente mais como revisor de processo (git,
consistência entre documentação e código, honestidade do registro) do que
como gerador de conteúdo novo.

As decisões de fundo (arquitetura, o que entra ou sai do repositório,
honestidade do registro de prompts) permaneceram minhas, com o agente
atuando como checagem, não como piloto automático.