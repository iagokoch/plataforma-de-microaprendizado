const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");

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
router.post("/login", async (req, res) => {
  try {
    const { emailCpf, senha } = req.body;

    // Buscar usuário por email ou CPF
    const [users] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ? OR cpf = ?",
      [emailCpf, emailCpf]
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ sucesso: false, mensagem: "Usuário não encontrado" });
    }

    const user = users[0];

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res
        .status(401)
        .json({ sucesso: false, mensagem: "Senha incorreta" });
    }

    // Remove a senha antes de enviar
    delete user.senha;

    // Aqui você pode adicionar a geração de token JWT se desejar
    res.json({
      sucesso: true,
      usuario: user,
      redirectTo: "/dashboard", // Adicionando redirecionamento para o dashboard
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao fazer login" });
  }
});

module.exports = router;
