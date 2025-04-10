const express = require("express");
const router = express.Router();

// Middleware para verificar se o usuário está logado
const requireLogin = (req, res, next) => {
  // Aqui você deve implementar sua lógica de verificação de autenticação
  // Por enquanto, vamos deixar passar direto para teste
  next();
};

// Página inicial (dashboard)
router.get("/", requireLogin, (req, res) => {
  res.render("dashboard");
});

// Página de login
router.get("/login", (req, res) => {
  res.render("index");
});

// Página de cadastro
router.get("/cadastro", (req, res) => {
  res.render("cadastro");
});

module.exports = router;
