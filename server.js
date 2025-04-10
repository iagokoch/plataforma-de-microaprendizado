const express = require("express");
const path = require("path");

// Importar rotas
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar EJS como view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware para processar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Usar rotas
app.use("/", indexRouter);
app.use("/api/users", usersRouter);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
