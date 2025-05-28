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

// Usar rotas
app.use("/api/users", userRoutes);

// Rotas de visualização
app.get("/", (req, res) => {
  res.render("home", { title: "Home", user: null });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login", user: null });
});

app.get("/cadastro", (req, res) => {
  res.render("cadastro", { title: "Cadastro", user: null });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "Dashboard", user: null });
});

// Outras rotas aqui...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
