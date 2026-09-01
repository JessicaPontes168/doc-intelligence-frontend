Especificação — DOC Intelligence (Trilha B, Front-end)
Escopo escolhido

Escolhi a Trilha B, focada na interface do time de atendimento.

Como a API ainda não existe, criei neste documento o formato que a interface espera receber. No projeto, uso uma API simulada (mock) seguindo esse formato. Dessa forma, futuramente será possível trocar o mock por uma API real sem precisar refazer toda a interface.

Cenário considerado

O ambiente descrito prevê uma média de 150 documentos por dia, com picos superiores a 800 documentos concentrados em um curto intervalo. Esses números guiaram decisões como o limite de processamento simultâneo no front-end e a forma como o controle de deduplicação foi pensado — mesmo sabendo que, no recorte entregue, parte dessa proteção só é válida durante a sessão do navegador (ver item "c" abaixo).

O que foi desenvolvido

A aplicação reúne em uma única tela o fluxo principal:

envio de vários arquivos → acompanhamento do processamento → revisão dos documentos → correção dos campos → confirmação → busca dos documentos processados.

Ficaram fora desta entrega itens como autenticação, paginação real, várias telas, upload que possa ser retomado, testes automatizados e deploy.

Formato da API

O mock segue o seguinte formato:

text
POST /documents
Envia um documento e retorna seu ID e o status de processamento.

GET /documents?search=&status=
Busca os documentos já processados, podendo filtrar por nome ou status.

GET /documents/:id
Busca os detalhes de um documento específico.

PATCH /documents/:id
Atualiza os campos, o nome sugerido e o status do documento.
Também verifica se a versão do documento ainda é a mesma antes de salvar.

Cada documento possui informações como:

ID
Nome original
Nome sugerido
Status
Tipo
Nível de confiança
Campos extraídos
Versão do documento
Versão do modelo
Versão do prompt

A informação version é usada para evitar que duas pessoas alterem o mesmo documento ao mesmo tempo. No mock, essa verificação acontece na memória do navegador. Em uma API real, essa informação ficaria salva no banco de dados.

Estados do documento

O documento pode seguir diferentes caminhos:

text
processing → done

Quando a extração tem boa confiança, o documento é concluído diretamente.

text
processing → review → done

Quando a confiança é baixa, o documento vai para revisão e precisa ser conferido por uma pessoa.

text
processing → error

Quando acontece algum erro durante o processamento.

Critério de confiança: o corte usado para decidir entre conclusão direta e envio à revisão é um valor fixo (threshold), definido no mock para simular o comportamento esperado do serviço de IA. Em uma implementação real, esse valor deveria ser configurável e possivelmente diferente por tipo de documento, já que a confiabilidade da extração varia conforme o tipo.

Como tratei os fatos do ambiente

(a) Demora ou erro no processamento: Cada documento é tratado separadamente. Enquanto o modelo processa, a tela mostra "Processando..." e depois atualiza para o resultado ou para erro. A interface não fica travada esperando todos os documentos terminarem.

(b) Nome de arquivo sem padrão: Não uso o nome original como identificação do documento. Depois do processamento, o sistema sugere um nome organizado, que pode ser confirmado ou alterado pelo atendente.

(c) Documento enviado novamente: Calculo o hash SHA-256 do arquivo antes do processamento. Se o mesmo documento já tiver sido enviado na sessão, o sistema avisa e evita processá-lo novamente.

Essa proteção tem um limite importante: ela existe apenas na memória do navegador durante a sessão atual. Se a aba for fechada, se o atendente usar outro computador, ou se outro atendente enviar o mesmo documento em paralelo, o reenvio não é detectado. Para funcionar de forma confiável entre sessões e entre atendentes diferentes, essa verificação precisa ser persistida e compartilhada no back-end, associando o hash ao estado de processamento do documento.

(d) Dados pessoais sensíveis: Os campos extraídos ficam escondidos por padrão e podem ser revelados quando necessário. Também não envio esses dados para o console.log. A proteção completa dos dados, como controle de acesso e criptografia, fica como responsabilidade do back-end.

(e)/(f) Grande quantidade de documentos e mudanças no modelo: Considerando o volume esperado (até ~800 documentos em picos), limitei a quantidade de documentos processados ao mesmo tempo no front-end, para simular o comportamento de um sistema com controle de concorrência. Também registro a versão do modelo e do prompt usada em cada documento, permitindo rastrear qual configuração gerou cada extração. Controle de fila real, limite de requisições, novas tentativas e processamento em grande escala ficam para o back-end.

(g) Duas pessoas revisando o mesmo documento: Uso a version do documento para identificar se ele foi alterado enquanto estava sendo revisado. Se isso acontecer, a aplicação mostra um aviso e impede que uma pessoa apague a alteração feita pela outra.

O que foi testado

Não foram criados testes automatizados nesta entrega. A validação foi feita manualmente, priorizando o funcionamento completo da aplicação e os principais pontos do desafio.

Foram testados:

Upload de vários arquivos.
Processamento e mudança de status.
Reenvio do mesmo documento (dentro da mesma sessão).
Revisão e correção dos campos.
Conflito entre duas abas editando o mesmo documento.
Mascaramento dos dados.
Simulação de erros no processamento.
Busca dos documentos já processados.