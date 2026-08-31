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
