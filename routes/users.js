const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const passport = require("passport");
const { requireLogin } = require("./index"); // Importar o middleware requireLogin
const crypto = require("crypto");
const nodemailer = require("nodemailer"); // Importar Nodemailer
const multer = require('multer');
const path = require('path');

// Configuração do multer para salvar em public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'user_' + req.user.id + '_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Rota de registro
router.post("/register", async (req, res) => {
  try {
    const { nome, email, cpf, senha, confirmarSenha } = req.body;

    if (senha !== confirmarSenha) {
      return res
        .status(400)
        .json({ sucesso: false, mensagem: "As senhas não coincidem." });
    }

    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir usuário no banco
    const [result] = await pool.execute(
      "INSERT INTO usuarios (nome, email, cpf, senha) VALUES (?, ?, ?, ?)",
      [nome, email, cpf, hashedSenha]
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

    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      // Registrar acesso do usuário (um por dia)
      try {
        await pool.execute(
          "INSERT INTO acessos (usuario_id, data_acesso) VALUES (?, CURDATE()) ON DUPLICATE KEY UPDATE data_acesso = data_acesso",
          [user.id]
        );
      } catch (e) {
        console.error("Erro ao registrar acesso:", e);
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

// Rota para buscar acessos do usuário na última semana
router.get("/acessos/semana", requireLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT data_acesso FROM acessos WHERE usuario_id = ? AND data_acesso >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar acessos:", error);
    res.status(500).json({ erro: "Erro ao buscar acessos" });
  }
});

// Rota para buscar progresso do usuário
router.get("/progresso", requireLogin, async (req, res) => {
  try {
    const userId = req.user.id;
    // Total de vídeos assistidos
    const [aulasAssistidas] = await pool.execute(
      `SELECT COUNT(*) as total FROM aulas_assistidas WHERE usuario_id = ?`,
      [userId]
    );
    // Total de tarefas concluídas
    const [tarefasConcluidas] = await pool.execute(
      `SELECT COUNT(*) as total FROM tarefas WHERE usuario_id = ? AND concluida = TRUE`,
      [userId]
    );
    // Progresso por matéria
    const [materias] = await pool.execute(`SELECT id, nome FROM materias`);
    let progressoMaterias = [];
    for (const materia of materias) {
      // Total de aulas na matéria
      const [totalAulas] = await pool.execute(
        `SELECT COUNT(*) as total FROM aulas WHERE materia_id = ?`,
        [materia.id]
      );
      // Aulas assistidas na matéria
      const [assistidas] = await pool.execute(
        `SELECT COUNT(*) as total FROM aulas_assistidas aa
         JOIN aulas a ON aa.aula_id = a.id
         WHERE aa.usuario_id = ? AND a.materia_id = ?`,
        [userId, materia.id]
      );
      progressoMaterias.push({
        materia: materia.nome,
        porcentagem: totalAulas[0].total > 0 ? Math.round((assistidas[0].total / totalAulas[0].total) * 100) : 0
      });
    }
    res.json({
      videosAssistidos: aulasAssistidas[0].total,
      tarefasConcluidas: tarefasConcluidas[0].total,
      progressoMaterias
    });
  } catch (error) {
    console.error("Erro ao buscar progresso do usuário:", error);
    res.status(500).json({ erro: "Erro ao buscar progresso" });
  }
});

// Rota para logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return res.status(500).send('Erro ao sair da conta'); }
    req.session.destroy(() => {
      res.redirect('/login');
    });
  });
});

// Rota para upload de foto de perfil
router.post('/upload-foto', requireLogin, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nenhum arquivo enviado.' });
    }
    const fotoPath = '/uploads/' + req.file.filename;
    await pool.execute('UPDATE usuarios SET foto_perfil = ? WHERE id = ?', [fotoPath, req.user.id]);
    res.json({ sucesso: true, foto_perfil: fotoPath });
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao fazer upload da foto.' });
  }
});

// Rota para atualizar dados pessoais e foto de perfil
router.post('/atualizar-perfil', requireLogin, upload.single('foto'), async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    let query = 'UPDATE usuarios SET nome = ?, email = ?, telefone = ?';
    let params = [nome, email, telefone, req.user.id];
    if (req.file) {
      query = 'UPDATE usuarios SET nome = ?, email = ?, telefone = ?, foto_perfil = ? WHERE id = ?';
      params = [nome, email, telefone, '/uploads/' + req.file.filename, req.user.id];
    } else {
      query += ' WHERE id = ?';
    }
    await pool.execute(query, params);
    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar perfil.' });
  }
});

module.exports = router;
module.exports.requireLogin = requireLogin;
