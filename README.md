# DOC Intelligence — Trilha B (Front-end)

Interface do atendimento para o serviço de inteligência documental descrito no
desafio. Cobre a fatia vertical: enviar vários documentos, acompanhar o
processamento, revisar/corrigir os que ficaram com baixa confiança, e buscar
o que já foi processado — tudo contra um mock local que respeita o contrato
de API descrito em `docs/ESPECIFICACAO.md`.

Leia também:
- `docs/ESPECIFICACAO.md` — o que foi decidido antes de programar
- `docs/ADR.md` — decisões de arquitetura e alternativas descartadas
- `AGENTS.md` e `prompts/prompts.md` — registro do uso de IA nesta entrega
- `CARTA_DE_FECHAMENTO.pdf` — as quatro perguntas de fechamento do desafio

## Como rodar

Pré-requisito: Node.js 18+ instalado.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Alternativa sem instalar nada: existe também um `index_standalone.html`
(não fica no `src/`) que carrega React via CDN e roda direto no navegador,
com duplo clique — útil só para visualização rápida, não é o entregável
principal.

## O que foi testado, e por quê

Não há testes automatizados nesta entrega. O tempo disponível foi priorizado
para cobrir a fatia ponta-a-ponta e tratar os fatos do ambiente do enunciado
(dedupe, nome de arquivo, dado sensível, lock otimista, versão de modelo),
que pareciam o critério mais explícito de avaliação. A validação foi manual:
upload de múltiplos arquivos, reenvio do mesmo arquivo (dedupe), duas abas
abrindo o mesmo documento em revisão (conflito de versão), e simulação de
erro do "modelo" (10% das chamadas falham de propósito no mock).

## O que ficou de fora

Ver a carta de fechamento (`CARTA_DE_FECHAMENTO.pdf`) para a resposta
completa. Resumo: autenticação, API real (o contrato está especificado mas
não implementado como servidor), paginação, testes automatizados e deploy.

## Estado deste repositório

Este projeto foi montado com apoio de um agente de IA (ver `AGENTS.md`) a
partir de uma conversa de chat, e o histórico de commits foi criado de uma
vez por esse agente — não reflete um desenvolvimento incremental real feito
por uma pessoa ao longo do tempo. Isso está registrado com transparência
aqui e em `AGENTS.md`. Antes de submeter como se fosse seu trabalho, revise
cada arquivo, ajuste o que não reflete suas próprias decisões, e principalmente
reescreva `CARTA_DE_FECHAMENTO.md` com suas respostas reais — em especial
"quanto tempo isso levou" e "qual decisão você menos defenderia hoje", que
só você pode responder de verdade.
