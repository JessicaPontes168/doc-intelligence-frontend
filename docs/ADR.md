# Registro de Decisões de Arquitetura (ADR)

## ADR-01 — Simulação da API dentro do próprio projeto

**Decisão:**
Decidi simular o back-end dentro do próprio projeto React usando a função `mockProcessDocument`. Assim, não precisei criar e manter um servidor separado só para testar a aplicação.

**Outras opções que considerei:**

* **MSW:** permitiria simular uma API de forma mais parecida com uma API real, mas exigiria mais configurações. Para o tamanho deste projeto, achei desnecessário.
* **json-server:** também funcionaria, mas precisaria de outro processo rodando junto com o projeto, deixando a execução mais complicada.

**Resultado:**
A estrutura da API está descrita em `ESPECIFICACAO.md` e o mock segue esse formato. Se futuramente houver um back-end real, essa parte poderá ser substituída pelas chamadas para a API.

## ADR-02 — Identificação de arquivos repetidos

**Decisão:**
Usei o SHA-256 para criar uma identificação baseada no conteúdo do arquivo. Antes de processar um documento, verifico se aquele mesmo conteúdo já foi enviado anteriormente.

**Outras opções que considerei:**

* **Comparar pelo nome do arquivo:** não seria confiável, porque arquivos vindos do celular ou WhatsApp podem ter nomes diferentes ou sem padrão.
* **Comparar pelo tamanho:** também não seria suficiente, porque dois arquivos diferentes podem ter o mesmo tamanho.
* **Deixar somente para o back-end:** não seria ideal como única solução, pois o sistema poderia processar novamente um documento que já foi enviado.

**Resultado:**
A verificação funciona durante a sessão atual do navegador. Para funcionar entre diferentes computadores e atendentes, essa verificação também precisará existir no back-end.

## ADR-03 — Evitar que duas pessoas alterem o mesmo documento ao mesmo tempo

**Decisão:**
Cada documento possui uma `version`. Quando alguém abre um documento, o sistema guarda a versão que estava disponível naquele momento. Na hora de salvar, ele verifica se o documento continua com a mesma versão.

Se outra pessoa tiver alterado o documento antes disso, o sistema percebe a diferença e mostra um aviso, evitando que uma alteração apague a outra.

**Outras opções que considerei:**

* **Bloquear o documento:** poderia impedir que outra pessoa abrisse o mesmo documento, mas seria necessário controlar também quando esse bloqueio deveria ser liberado.
* **Não fazer nenhuma verificação:** descartei porque o desafio considera justamente a possibilidade de duas pessoas trabalharem no mesmo documento.

**Resultado:**
Quando acontece uma alteração ao mesmo tempo, o sistema avisa o atendente em vez de apagar silenciosamente o trabalho da outra pessoa.

## ADR-04 — Esconder dados sensíveis na tela

**Decisão:**
Os dados extraídos dos documentos ficam escondidos por padrão. O atendente pode clicar em **"mostrar"** quando precisar visualizar a informação. Também evitei deixar esses dados aparecendo no console do navegador.

**Outras opções que considerei:**

* **Deixar os dados sempre visíveis:** não achei adequado porque os documentos podem conter informações pessoais.
* **Fazer toda a proteção no front-end:** não seria suficiente. Proteções como criptografia, controle de acesso e armazenamento seguro precisam ser feitas no back-end e na infraestrutura.

**Resultado:**
O sistema diminui a exposição dos dados na própria tela, mas esse recurso não substitui as medidas de segurança que devem existir no sistema completo.

## ADR-05 — Não usar uma biblioteca para controlar os dados da aplicação

**Decisão:**
Usei os recursos próprios do React, principalmente `useState`, para controlar os dados da aplicação. Não utilizei Redux, Zustand ou outra biblioteca semelhante.

**Outras opções que considerei:**

* **Redux, Zustand ou Context API:** seriam úteis em uma aplicação muito maior, com várias telas e muitas partes compartilhando os mesmos dados. Para este projeto, achei que adicionariam complexidade sem necessidade.

**Resultado:**
A estrutura ficou mais simples para o tamanho atual do projeto. Se a aplicação crescer bastante e passar a ter várias telas e funcionalidades, essa decisão pode ser revista.
