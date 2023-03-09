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

_Port=""_

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

Configurando o PDF24:

Após baixar e instalar o PDF24, abra o programa, clique no botão "definições", clique na aba "Impressora PDF" na aba a esquerda das configurações, na aba da "Impressora PDF" selecione "Salvar documentos automaticamente após imprimir" abaixo de "Ferramenta Impressora PDF", deixe "Abrir arquivos PDF criados no editor se estiver aberto" não selecionado, na parte de "Salvamento Automático" o diretório de saída deve ser a pasta de arquivos temporários do windows (depende do computador de cada cliente, normalmente se parece com isso: C:\Users\NomeDeUsuário\AppData\Local\Temp), o nome do arquivo deve ser somente : "$fileName", e abaixo de perfil, só selecione as seguintes opções:

"Mostrar progresso enquanto salva" e "Executar o seguinte comando após salvar"

No espaço para o comando preencha com: "pdf24-docTool.exe -upload -url "http://127.0.0.1:3333/pdf24" -namedFile2 "${file}" "${fileName}.1" "file" -nopreview"

_ATENÇÃO:_ No comando acima troque o número 3333 da url: "http://127.0.0.1:3333/pdf24", pela porta da aplicação escolhida no .env.

Clique em aplicar e OK, e a configuração do PDF24 estará feita.

Imprimindo arquivos pelo PDFCREATOR ou PDF24:

Quando for fazer uma impressão, selecione como destino a impressora digital "PDFCreator" ou "PDF24" dependendo de qual aplicativo você tiver instalado, e mande salvar/imprimir.
Caso o salvamento automático do PDFCREATOR não estiver configurado, uma tela de impressão do PDFCREATOR vai se abrir, clique em salvar e espere a conversão.

_O arquivo .env deve estar atualizado com os parametros do cliente na pasta onde o executável estiver, a cada atualização do env, o aplicativo deve ser fechado e reaberto._

Os seguintes domínios também devem ser liberados pelo firewall do cliente para que a aplicação funcione normalmente:

- https://github.com/vitor93gs/NoPaperAPIUpdater
- https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css
- https://$$$$.nopaper.link (domínio nopaper do cliente)

Assim como o acesso as portas localhost devem estar liberadas.
