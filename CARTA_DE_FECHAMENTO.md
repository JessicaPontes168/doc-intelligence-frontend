
Carta de Fechamento — DOC Intelligence

1. O que ficou de fora, e por quê?
A implementação foi deliberadamente limitada a uma fatia vertical da Trilha B — Front-end, priorizando um fluxo completo e funcional sobre a tentativa de cobrir todo o produto.
Ficaram fora da implementação: autenticação real, integração com uma API e um serviço de processamento reais, persistência em banco de dados, paginação server-side, upload resiliente para arquivos grandes ou conexões instáveis, testes automatizados, deploy e parte das funcionalidades complementares de consulta e gestão de documentos.
A API foi tratada como contrato e o front-end utiliza uma implementação mock para representar o comportamento esperado do serviço. O processamento por IA também é simulado, incluindo o estado de processamento antes de o documento chegar à fila de conferência.
Essa escolha foi intencional. O enunciado estabelece que uma fatia vertical estreita e honesta é preferível a várias funcionalidades implementadas pela metade. Por isso, priorizei o fluxo central do atendimento:

 envio → processamento → identificação de documentos que exigem conferência → visualização do documento original e dos dados extraídos → correção → confirmação.

Durante o projeto, também procurei não tratar os fatos do ambiente apenas como requisitos funcionais. O comportamento de documentos duplicados, a sensibilidade dos dados, a latência e indisponibilidade do modelo, o pico de volume, a evolução do fornecedor de IA e a possibilidade de dois atendentes atuarem sobre a mesma fila foram considerados na especificação e nas decisões arquiteturais. Quando não foi possível implementar uma solução completa dentro do recorte, o ponto foi registrado como risco ou evolução futura, em vez de ser ocultado.






2. O que quebra primeiro se o volume for multiplicado por dez

O cenário atual considera uma média de 150 documentos por dia, com picos superiores a 800 documentos concentrados em um curto intervalo. Multiplicando esse volume por dez, o primeiro ponto de ruptura seria o processamento assíncrono e o controle de concorrência com o provedor de IA.
Na implementação entregue, esse comportamento é apenas simulado no cliente. Em produção, o controle precisaria existir no back-end, com uma fila de processamento e um limite centralizado de concorrência. Isso evitaria que múltiplos atendentes gerassem uma quantidade excessiva de chamadas simultâneas ao fornecedor, especialmente considerando que cada chamada pode levar de 5 a 40 segundos, possui custo e pode falhar ou sofrer timeout.
O segundo ponto seria a deduplicação. O sistema precisa evitar que o mesmo documento seja processado repetidamente, principalmente porque o próprio cenário informa que reenvios são frequentes. Em uma implementação real, essa proteção deveria ser persistida e compartilhada entre as instâncias do serviço, utilizando uma identificação baseada no conteúdo do arquivo, como hash SHA-256, associada ao estado do processamento.
Por fim, a consulta dos documentos precisaria evoluir para paginação, filtros e busca no servidor. Com aproximadamente 8.000 documentos por dia nesse cenário de 10x, manter uma listagem crescente sem paginação e sem processamento server-side se tornaria rapidamente inadequado.
Portanto, o principal ponto de evolução não seria simplesmente aumentar a capacidade do front-end, mas transformar o processamento em uma arquitetura distribuída e assíncrona, com fila, persistência, controle de concorrência, de impotência e observabilidade.






3. Qual das suas decisões você menos defenderia hoje?

A decisão que menos defenderia hoje é ter considerado como resolvido, em uma primeira versão, o controle de concorrência da fila de conferência antes de validá-lo completamente em um cenário de edição simultânea.
Durante a validação manual, identifiquei dois problemas na implementação do lock otimista. O primeiro fazia com que o modal de revisão fosse fechado antes que a mensagem de conflito pudesse ser apresentada corretamente ao usuário. O segundo estava relacionado à forma como a versão do documento era obtida: ela estava sendo recalculada durante a renderização, em vez de representar efetivamente a versão observada no momento em que a conferência era iniciada.
Corrigi ambos os problemas e repeti o cenário manualmente para verificar o comportamento esperado.
Essa experiência reforçou uma decisão importante para o projeto: uma preocupação arquitetural só deve ser considerada efetivamente tratada depois de ser validada no comportamento da aplicação. O conceito de lock otimista continua sendo uma escolha que considero adequada para o cenário, mas hoje eu seria mais rigorosa em separar, na documentação, aquilo que foi projetado daquilo que foi efetivamente implementado e validado.
Também considero essa uma das principais lições do uso de IA no desenvolvimento: o agente pode produzir uma implementação tecnicamente plausível e ainda assim deixar passar um problema de comportamento. A responsabilidade pela validação e pelas decisões continua sendo do desenvolvedor.






4. Quanto tempo isso tudo levou?
O trabalho levou aproximadamente 11 horas.
Esse tempo foi distribuído entre a leitura e decomposição do problema, definição do recorte da Trilha B, elaboração da especificação, definição da arquitetura e dos contratos, implementação da fatia vertical, revisão crítica do código produzido com auxílio de IA, documentação das decisões, preparação do registro de uso da IA e testes manuais.
A etapa de validação foi especialmente importante porque permitiu identificar problemas que não eram evidentes apenas pela leitura do código, incluindo os problemas relacionados ao controle de concorrência e à visualização de documentos.
O objetivo da entrega não foi demonstrar um produto finalizado, mas demonstrar como eu conduziria a construção de um sistema desse tipo: começando pelo problema, explicitando as restrições, fazendo escolhas conscientes de escopo, documentando os trade-offs, utilizando IA como ferramenta de engenharia e validando criticamente aquilo que foi produzido.
O que foi entregue representa, portanto, uma fatia funcional do produto-alvo e, principalmente, uma proposta de como evoluí-la para um serviço de produção.

