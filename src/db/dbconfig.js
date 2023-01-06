const config = {
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
module.exports = config;
