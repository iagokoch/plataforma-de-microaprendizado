const express = require("express");
const router = express.Router();

// Middleware para verificar se o usuário está logado
const requireLogin = (req, res, next) => {
  // **TODO: Implement actual authentication check**
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Example check (adjust based on your auth setup)
    next();
  } else {
    res.redirect("/login");
  }
};

// Página inicial (dashboard)
router.get("/", (req, res) => {
  res.render("dashboard", { user: req.user });
});

// Página de login
router.get("/login", (req, res) => {
  res.render("login", { user: null });
});

// Página de cadastro
router.get("/cadastro", (req, res) => {
  res.render("cadastro", { user: null });
});

// Página de dashboard
router.get("/dashboard", (req, res) => {
  res.render("dashboard", { user: null });
});

// Página de perguntas
router.get("/perguntas", (req, res) => {
  res.render("perguntas");
});

// Rota para a página da aula
router.get("/aula/:id", (req, res) => {
  const aulaId = req.params.id;
  // Aqui você buscaria os dados da aula do banco de dados com base no aulaId
  // Por enquanto, apenas renderizamos a página com um ID de exemplo
  res.render("aula", { aulaId: aulaId, title: "Aula Detalhes" });
});

// Rota para a página de perfil
router.get("/profile", requireLogin, (req, res) => {
  // Aqui você buscaria os dados do usuário logado para preencher a página
  // Por enquanto, apenas renderizamos a página
  res.render("profile", { title: "Meu Perfil", user: req.user }); // Passe o objeto de usuário real aqui
});

// Rota para a página de segurança do perfil
router.get("/profile/security", requireLogin, (req, res) => {
  res.render("profile-security", {
    title: "Segurança do Perfil",
    user: req.user,
  }); // Passe o objeto de usuário real aqui
});

// Rota para a página de tema do perfil
router.get("/profile/theme", requireLogin, (req, res) => {
  res.render("profile-theme", {
    title: "Configurações de Tema",
    user: req.user,
  }); // Passe o objeto de usuário real aqui
});

// Nova rota para a página de recuperação de senha
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { title: "Recuperar Senha" });
});

// Nova rota para a página de redefinição de senha (com token)
router.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  // Aqui você pode opcionalmente verificar a validade do token antes de renderizar a página
  res.render("reset-password", { title: "Redefinir Senha", token: token });
});

module.exports = router;
module.exports.requireLogin = requireLogin;
