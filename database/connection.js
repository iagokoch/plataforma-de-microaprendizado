const mysql = require("mysql2");
const dbConfig = require("../config/db-config");

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados MySQL:", err.message);
    // Em uma aplicação real, você pode querer parar o servidor ou ter um tratamento de erro melhor
    // process.exit(1); // Exemplo: encerrar se não conectar
  } else {
    console.log("Conectado ao banco de dados MySQL.");
  }
});

module.exports = db;
