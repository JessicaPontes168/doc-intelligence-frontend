# DOC Intelligence — Trilha B (Front-end)

Interface do time de atendimento para um serviço de inteligência documental. A aplicação recebe documentos em imagem ou PDF, acompanha o processamento por IA e envia para conferência humana os casos com baixa confiança.

## Funcionalidades

* Upload de múltiplos documentos.
* Acompanhamento do processamento por status.
* Fila de revisão e correção dos campos extraídos.
* Sugestão de nome padronizado para os arquivos.
* Deduplicação por hash **SHA-256**.
* Mascaramento de dados sensíveis.
* Lock otimista para evitar conflitos entre atendentes.
* Busca por nome ou tipo de documento.
* API mock local seguindo o contrato definido em `docs/ESPECIFICACAO.md`.

## Tecnologias

* React
* Vite
* JavaScript
* HTML e CSS
* Web Crypto API
* React via CDN na versão alternativa

## Como rodar

```bash
npm install
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

Também existe o `index_standalone.html`, que pode ser aberto diretamente no navegador para uma visualização rápida.

## Validação

A aplicação foi testada manualmente com upload de múltiplos arquivos, deduplicação, revisão de documentos, conflito entre duas abas, mascaramento de dados e simulação de erros do modelo.

## Fora do escopo

Autenticação, API real, persistência definitiva, paginação, testes automatizados, deploy e recursos de escala como fila, rate limit e retry.

## Documentação

O projeto inclui a especificação, decisões de arquitetura, registro do uso de IA e carta de fechamento.
