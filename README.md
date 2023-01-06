O aplicativo só deve ser aberto uma vez, caso ele seja aberto mais de uma vez haverá um erro com a porta, feche todos as instancias do executável e abra o executável novamente.

Configurando o .env:

_SQL_USER=""_

A chave SQL_USER deve ser o usuário habilitado no MS SQL Server para ler a database que contém a table "pac", exemplo: SQL_USER:"usuario_teste".

_SQL_USER_PASSWORD=""_

A chave SQL_USER_PASSWORD deve ser a senha do usuário habilitado no MS SQL Server para ler a database que contém a table "pac", exemplo: SQL_USER_PASSWORD:"senha_exemplo_123".

_SQL_DATABASE=""_

A chave SQL_DATABASE deve ser o nome da database que contém a table "pac", exemplo: SQL_DATABASE:"DB_QUE_CONTÉM_A_TABELA_PAC".

_SQL_SERVER=""_

A chave SQL_SERVER deve ser o nome do server MS SQL SERVER que contém a database que contém table "pac", exemplo: SQL_DATABASE:"DESKTOP-UI2LHOP".

_SQL_PORT=""_

A chave SQL_PORT deve ser a porta do server MS SQL SERVER, exemplo: SQL_DATABASE:"1244".

_PORT=""_

A chave PORT deve ser a porta na qual o executável vai escutar as requisições no host local, essa porta vai ser a porta que deve ser configurada no PDFCreator para mandar as requisições HTTP, exemplo: PORT:"8000".

_CHANNEL_NAME=""_

A chave CHANNEL_NAME deve ser uma chave específica para cada Tablet do usuário do executável, exemplo: CHANNEL_NAME="tablet_1".

_NOPAPER_URL=""_

A chave NOPAPER_URL deve ser a URL para a qual as requisições HTTP POST com os dados do paciente e o arquivo impresso vâo ser mandadas, exemplo: NOPAPER_URL="https://nopaper.com/post_nova_impressao".

Configurando o PDFCREATOR:

Após baixar o PDFCREATOR abra o programa, abra a aba "Perfis" no canto superior esquerdo.
Na aba Perfis abra a caixa "Salvar", no popup da opção Salvar, selecione a opção só salvar arquivos temporariamente, deselecione a última opção (de mostrar ações depois da conversão do arquivo), cole o seguinte texto: "<Title>.1" (sem as aspas) no input "Nome do Arquivo" (ou "filename" caso a aplicação esteja em inglês), depois clique em "OK" e volte para a aba Perfis.
Novamente na aba Perfis, delete todas as ações, depois de deletar todas as ações, crie uma nova ação no botão "Adicionar ação +".
No popup de adicionar ação escolha HTTP (fica na coluna "Enviar"), depois crie uma nova conta HTTP, clicando no botão "+" ao lado direito da área de "Selecionar conta HTTP". Na criação de conta HTTP coloque na URL o seguinte: http://127.0.0.1:PORT/pdf, onde _PORT_ é a chave PORT do .env. Clique em salvar, depois OK.
Salve as mudanças feitas na aba Perfis e a configuração do PDFCREATOR está feita.

Imprimindo arquivos pelo PDFCREATOR

Quando for fazer uma impressão, selecione como destino a impressora digital "PDFCreator", e mande salvar imprimir.
Uma tela de impressão do PDFCREATOR vai se abrir, clique em salvar e espere a conversão.

O arquivo .env deve estar atualizado com os parametros do cliente na pasta onde o executável estiver, a cada atualização do env, o aplicativo deve ser reaberto.
