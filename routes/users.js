const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const passport = require("passport");
const { requireLogin } = require("./index"); // Importar o middleware requireLogin

// Rota de registro
router.post("/register", async (req, res) => {
  try {
    const { nome, email, cpf, senha, anoEscolar } = req.body;

    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir usuário no banco
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, email, cpf, senha, ano_escolar) VALUES (?, ?, ?, ?, ?)",
      [nome, email, cpf, hashedSenha, anoEscolar]
    );

    res
      .status(201)
      .json({ sucesso: true, mensagem: "Usuário criado com sucesso!" });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao criar usuário" });
  }
});

// Rota de login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ sucesso: false, mensagem: info.message });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      // Autenticação bem-sucedida, redirecionar ou enviar sucesso
      return res.json({
        sucesso: true,
        mensagem: "Login bem-sucedido!",
        redirectTo: "/",
      });
    });
  })(req, res, next);
});

// Rota para atualizar o tema do usuário
router.post("/theme", requireLogin, async (req, res) => {
  try {
    console.log("POST /api/users/theme accessed");
    const userId = req.user.id; // Agora req.user deve estar populado
    const { theme } = req.body;

    console.log("User ID:", userId);
    console.log("Theme received:", theme);

    if (!userId) {
      return res
        .status(401)
        .json({ sucesso: false, mensagem: "Usuário não autenticado." });
    }

    if (!theme) {
      return res
        .status(400)
        .json({ sucesso: false, mensagem: "Tema não fornecido." });
    }

    // Update the user's theme in the database
    const [result] = await pool.execute(
      "UPDATE usuarios SET theme = ? WHERE id = ?",
      [theme, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }

    res.json({ sucesso: true, mensagem: "Tema atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar o tema do usuário:", error);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao atualizar o tema." });
  }
});

module.exports = router;
