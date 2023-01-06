const config = require("./dbconfig");
const sql = require("mssql");

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

    let result = {};
    result.pacreg = res.recordsets[0][0].OSM_PAC;
    result.convenio = res2.recordsets[0][0].CNV_NOME;
    return result;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getdata: getdata,
  pacreg: pacreg,
};
