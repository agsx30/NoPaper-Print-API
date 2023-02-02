const { config, configTasy } = require("./dbconfig");
const sql = require("mssql");
const oracledb = require("oracledb");

async function getdata(PAC_REG) {
  try {
    let pool = await sql.connect(config);
    console.log("sql server conectado.");
    let res = await pool
      .request()
      .query(
        `SELECT PAC_NOME, PAC_NASC, PAC_NUMCPF, PAC_IND_CPF_PROPRIO, PAC_EMAIL FROM pac where PAC_REG = ${PAC_REG}`
      );

    let response = {};
    response.nome = res.recordsets[0][0].PAC_NOME.trim();
    response.data_nascimento = res.recordsets[0][0].PAC_NASC;
    response.cpf = res.recordsets[0][0].PAC_NUMCPF;
    response.cpf_proprio = res.recordsets[0][0].PAC_IND_CPF_PROPRIO;
    response.email = res.recordsets[0][0].PAC_EMAIL;

    response.data_nascimento = response.data_nascimento
      .toISOString()
      .split("T")[0];

    pool.close();
    return response;
  } catch (error) {
    return false;
  }
}

async function pacreg(osm1, osm2) {
  try {
    let pool = await sql.connect(config);
    console.log("sql server conectado.");

    let res = await pool
      .request()
      .query(
        `SELECT OSM_PAC, OSM_CNV FROM osm WHERE OSM_SERIE = ${osm1} and OSM_NUM = ${osm2}`
      );

    let res2 = await pool
      .request()
      .query(
        `SELECT CNV_NOME FROM cnv WHERE CNV_COD = '${res.recordsets[0][0].OSM_CNV}'`
      );

    let res3 = await pool.request().query(
      `SELECT PSV.PSV_EMAIL
      FROM SMM
      INNER JOIN PSV ON SMM.SMM_MED = PSV.PSV_COD
      WHERE SMM.SMM_OSM_SERIE = ${osm1} AND SMM.SMM_OSM = ${osm2}`
    );

    let result = {};
    result.pacreg = res.recordsets[0][0].OSM_PAC;
    result.convenio = res2.recordsets[0][0].CNV_NOME;
    result.email_med = res3.recordsets[0][0].PSV_EMAIL;
    pool.close();

    return result;
  } catch (error) {
    return false;
  }
}

async function getData_tasy(cd, store) {
  try {
    // Connect to the database
    const connection = await oracledb.getConnection(configTasy);

    console.log("Conexão bem sucedida!");

    let res = await connection.execute(
      `SELECT CD_PESSOA_FISICA,DS_CONVENIO,DT_NASCIMENTO,EMAIL,NM_PACIENTE,NR_CPF_RESP,NR_CPF FROM ATENDIMENTO_PACIENTE_NP WHERE NR_ATENDIMENTO = ${cd}`
    );

    console.log(res);
    let response = {};
    response.nome = res.rows[0][4].trim();
    // var dateArr = res.rows[0][2].split("-");
    response.data_nascimento = res.rows[0][2].toISOString().split("T")[0];
    // response.data_nascimento = dateArr[2] + "-" + dateArr[1] + "-" + dateArr[0];
    response.cpf = res.rows[0][6];
    if (res.rows[0][5] != null) {
      response.cpf_proprio = "T";
      response.cpf = res.rows[0][5];
    } else {
      response.cpf_proprio = null;
    }
    response.email = res.rows[0][3];
    store.set("convenio", res.rows[0][1]);

    // Release the connection
    await connection.close();

    return response;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function testDBConnection(client) {
  if (client === "Tasy") {
    try {
      const connection = await oracledb.getConnection(configTasy);
      console.log("Conexão bem sucedida!");
      await connection.close();
      return "ok";
    } catch (error) {
      return error;
    }
  }
  if (client === "Smart") {
    try {
      let pool = await sql.connect(config);
      console.log("sql server conectado.");
      pool.close();
      return "ok";
    } catch (error) {
      return error;
    }
  }
}

module.exports = {
  getdata,
  pacreg,
  getData_tasy,
  testDBConnection,
};
