const configTransduson = {
  user: process.env.SQL_USER,
  password: process.env.SQL_USER_PASSWORD,
  database: process.env.SQL_DATABASE,
  server: process.env.SQL_SERVER,
  options: {
    trustedconnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
  port: parseInt(process.env.SQL_PORT, 10),
};
const configTasy = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_USER_PASSWORD,
  connectString: `${process.env.ORACLE_HOST_NAME}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`,
};

module.exports = {config:configTransduson, configTasy};
