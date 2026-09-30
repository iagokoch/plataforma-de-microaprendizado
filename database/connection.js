const mysql = require("mysql2");
const dbConfig = require("../config/db-config");

// Pool em vez de uma conexão única: se uma conexão cair (ex.: erro fatal numa query),
// o pool descarta ela e abre outra, em vez de o app inteiro parar de acessar o banco.
// A API de callback (db.query(sql, params, cb)) é a mesma, então as rotas não mudam.
const db = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testa a conexão na inicialização, só para dar feedback no terminal
db.getConnection((err, conn) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados MySQL:", err.message);
  } else {
    console.log("Conectado ao banco de dados MySQL.");
    conn.release();
  }
});

module.exports = db;
