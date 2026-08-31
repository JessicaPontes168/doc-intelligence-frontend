# Carta de Fechamento

**Nota:** os itens marcados com [PREENCHER] só você pode responder de
verdade — são sobre seu próprio tempo e sua própria avaliação, não algo que
um agente de IA deveria preencher por você. O resto é um rascunho técnico
que reflete o que foi de fato construído.

## 1. O que ficou de fora, e por quê

Ficaram de fora: autenticação real, a API funcionando como servidor (o
contrato está especificado em `docs/ESPECIFICACAO.md`, mas o front-end
consome um mock em memória), paginação de verdade na listagem, upload
resumível para arquivos grandes/conexão instável, múltiplas rotas/telas
(hoje é uma tela só com modal), testes automatizados, e deploy.

A prioridade foi cobrir a fatia vertical ponta-a-ponta e tratar
explicitamente os fatos do ambiente citados no enunciado (nome de arquivo
sem padrão, reenvio de documento, dado sensível, pico de volume, troca de
versão do modelo, edição concorrente) — porque o próprio enunciado deixa
claro que ignorá-los é o principal jeito de errar o desafio, e cobrir cinco
funcionalidades pela metade valeria menos do que uma fatia estreita e
honesta.

## 2. O que quebra primeiro se o volume for multiplicado por dez

Hoje o volume de pico é ~800 documentos/dia, concentrados entre 9h e 11h.
Multiplicando por dez, o primeiro ponto de ruptura é a fila de concorrência
com o modelo: o limite de chamadas simultâneas (`MAX_CONCURRENT_CALLS`) está
implementado no cliente, por documento aberto no navegador de cada
atendente — isso não coordena nada entre atendentes diferentes, então o
back-end real receberia rajadas sem nenhum controle central de rate limit.
Em segundo lugar, o dedupe por hash SHA-256 hoje só existe em memória no
cliente: em volume alto, com múltiplos atendentes enviando ao mesmo tempo,
duplicatas entre sessões diferentes passariam despercebidas e gerariam
chamadas pagas ao modelo desnecessárias. Terceiro: a lista de documentos
processados não pagina — com 8.000 documentos/dia ela ficaria pesada rápido
sem uma API que suporte busca/paginação no servidor.

## 3. Qual decisão você menos defenderia hoje

[PREENCHER — mas um candidato honesto: o lock otimista faz o atendente
perder o trabalho de revisão feito na aba quando há conflito, em vez de
tentar mesclar ou mostrar o que mudou. Para o volume e a frequência de
conflito descritos (só duas pessoas na fila), provavelmente é aceitável,
mas é a decisão mais fácil de questionar se o time de atendimento crescer.]

## 4. Quanto tempo isso tudo levou

[PREENCHER — este é o único item que descreve seu processo real, não o do
agente. Inclua tempo lendo o enunciado, decidindo a trilha, revisando e
ajustando o que o agente produziu, e validando manualmente.]
