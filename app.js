const express = require("express");
const path = require("path");
const app = express();

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const userRoutes = require("./routes/users");
const perguntasRoutes = require("./routes/api/perguntas");
const materiasRoutes = require("./routes/api/materias");

// Usar rotas
app.use("/api/users", userRoutes);
app.use("/api/perguntas", perguntasRoutes);
app.use("/api/materias", materiasRoutes);

// Outras configurações e middlewares aqui...

module.exports = app;
