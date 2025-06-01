const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const passport = require("passport");
const { requireLogin } = require("./index"); // Importar o middleware requireLogin
const crypto = require("crypto");
const nodemailer = require("nodemailer"); // Importar Nodemailer

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
    const userId = req.user.id;
    const { theme } = req.body;

    console.log("User ID from req.user:", userId);
    console.log("Theme received in body:", theme);

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

// Rota para solicitar recuperação de senha
router.post("/forgot-password-request", async (req, res) => {
  try {
    const { emailCpf } = req.body;

    if (!emailCpf) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Por favor, insira seu email ou CPF.",
      });
    }

    // Buscar usuário por email ou CPF
    const [users] = await pool.execute(
      "SELECT id, email FROM usuarios WHERE email = ? OR cpf = ?",
      [emailCpf, emailCpf]
    );

    const user = users[0];

    // Se o usuário não for encontrado, ainda retornamos sucesso para evitar enumeração de usuários
    if (!user) {
      console.log(
        `Tentativa de recuperação de senha para email/cpf não encontrado: ${emailCpf}`
      );
      return res.json({
        sucesso: true,
        mensagem:
          "Se sua conta existir, um link de recuperação foi enviado para o seu email.",
      });
    }

    // === Gerar e salvar token ===
    const token = crypto.randomBytes(20).toString("hex"); // Token simples
    const expiresAt = new Date(Date.now() + 3600000); // Token válido por 1 hora

    // Remover tokens antigos para este usuário (opcional, mas boa prática)
    await pool.execute(
      "DELETE FROM password_reset_tokens WHERE usuario_id = ?",
      [user.id]
    );

    // Salvar o novo token no banco
    await pool.execute(
      "INSERT INTO password_reset_tokens (usuario_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, token, expiresAt]
    );

    // === Enviar email com o link (Usando Nodemailer) ===
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.ethereal.email", // Use seu host SMTP ou um serviço
      port: process.env.EMAIL_PORT || 587, // Porta SMTP
      secure: process.env.EMAIL_SECURE === "true", // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER, // Seu email (variável de ambiente)
        pass: process.env.EMAIL_PASS, // Sua senha de email (variável de ambiente)
      },
    });

    const resetLink = `http://localhost:3001/reset-password/${token}`; // Substitua localhost:3001 pela URL do seu site em produção

    const mailOptions = {
      from: process.env.EMAIL_USER, // Remetente
      to: user.email, // Destinatário (email do usuário do banco)
      subject: "Recuperação de Senha MicroLearn",
      text: `Você solicitou a recuperação de senha. Clique no link para redefinir:\n\n${resetLink}\n\nEste link expira em 1 hora.`,
      html: `<p>Você solicitou a recuperação de senha.</p><p>Clique no link para redefinir:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Este link expira em 1 hora.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        // Em produção, talvez você não queira retornar um erro aqui para não revelar a existência do email
      } else {
        console.log("Email de recuperação enviado:", info.response);
      }
    });

    res.json({
      sucesso: true,
      mensagem:
        "Se sua conta existir, um link de recuperação foi enviado para o seu email.",
    });
  } catch (error) {
    console.error("Erro ao solicitar recuperação de senha:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Ocorreu um erro ao solicitar a recuperação de senha.",
    });
  }
});

// Rota para redefinir a senha usando um token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Token e nova senha são necessários.",
      });
    }

    // Buscar o token no banco de dados, verificar validade e se não foi usado
    const [tokens] = await pool.execute(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE",
      [token]
    );

    const resetToken = tokens[0];

    if (!resetToken) {
      return res
        .status(400)
        .json({ sucesso: false, mensagem: "Token inválido ou expirado." });
    }

    // Encontrar o usuário associado ao token
    const [users] = await pool.execute("SELECT id FROM usuarios WHERE id = ?", [
      resetToken.usuario_id,
    ]);
    const user = users[0];

    if (!user) {
      // Isso não deve acontecer se o foreign key onDelete Cascade estiver configurado, mas é uma boa verificação
      console.error(
        `Usuário associado ao token de reset ${token} não encontrado.`
      );
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }

    // Hash da nova senha
    const hashedNovaSenha = await bcrypt.hash(novaSenha, 10);

    // Atualizar a senha do usuário
    await pool.execute("UPDATE usuarios SET senha = ? WHERE id = ?", [
      hashedNovaSenha,
      user.id,
    ]);

    // Marcar o token como usado
    await pool.execute(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
      [resetToken.id]
    );

    res.json({ sucesso: true, mensagem: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Ocorreu um erro ao redefinir a senha.",
    });
  }
});

module.exports = router;
module.exports.requireLogin = requireLogin;
