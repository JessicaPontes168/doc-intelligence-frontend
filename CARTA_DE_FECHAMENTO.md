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

Não é bem uma decisão de arquitetura, é uma falha de execução que só
descobri testando manualmente: a lógica do lock otimista tinha dois bugs
reais. Primeiro, o código fechava o modal de revisão antes de conseguir
mostrar o aviso de conflito, escondendo o próprio aviso que deveria
proteger o atendente. Segundo, a versão "vista na abertura" do documento
nunca era de fato fixada,  era recalculada a cada render, então a
comparação de conflito nunca dava diferente. Corrigi os dois e validei
manualmente simulando uma edição concorrente. Isso me deixa desconfiada
do resto do código que não testei manualmente da mesma forma  é a
decisão que eu menos defenderia hoje não pelo design em si (a intenção do
lock otimista está certa), mas por ter escrito "TRATADO" no comentário
antes de validar que realmente funcionava.

## 4. Quanto tempo isso tudo levou

## 4. Quanto tempo isso tudo levou

Cerca de 11 horas no total: leitura do enunciado e escolha da trilha,
geração da fatia vertical inicial com o agente, revisão crítica do que
foi entregue (identificação de lacunas nos fatos do ambiente e no pacote
de documentação), escrita/revisão da especificação, ADR e AGENTS.md, e a
sessão final de teste manual que revelou e corrigiu os dois bugs do lock
otimista e o bug de preview de PDF.