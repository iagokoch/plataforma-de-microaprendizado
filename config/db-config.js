// Configuração única de conexão com o MySQL, lida do .env.
// Usada por config/database.js, database/connection.js, adminServer.js e setup-database.js,
// para que as credenciais fiquem em um só lugar e fora do código.
require("dotenv").config();

module.exports = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "microlearn",
};
