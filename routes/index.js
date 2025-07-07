const express = require("express");
const router = express.Router();
const db = require('../database/connection');

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
  db.query(
    `SELECT a.id, a.titulo, a.video_url, m.nome as materia FROM aulas a LEFT JOIN materias m ON a.materia_id = m.id ORDER BY a.id DESC`,
    (err, aulas) => {
      if (err) {
        console.error('Erro ao buscar aulas:', err);
        return res.render("dashboard", { user: req.user || null, aulas: [] });
      }
      res.render("dashboard", { user: req.user || null, aulas });
    }
  );
});

// Página de login
router.get("/login", (req, res) => {
  res.render("login", { user: req.user || null });
});

// Página de cadastro
router.get("/cadastro", (req, res) => {
  res.render("cadastro", { user: req.user || null });
});

// Página de dashboard
router.get("/dashboard", (req, res) => {
  db.query(
    `SELECT a.id, a.titulo, a.video_url, m.nome as materia FROM aulas a LEFT JOIN materias m ON a.materia_id = m.id ORDER BY a.id DESC`,
    (err, aulas) => {
      if (err) {
        console.error('Erro ao buscar aulas:', err);
        return res.render("dashboard", { user: req.user || null, aulas: [] });
      }
      res.render("dashboard", { user: req.user || null, aulas });
    }
  );
});

// Página de perguntas
router.get("/perguntas", (req, res) => {
  res.render("perguntas", { user: req.user || null });
});

// Rota para a página da aula
router.get("/aula/:id", (req, res) => {
  const aulaId = req.params.id;
  const userId = req.user ? req.user.id : null;

  // Adiciona ou atualiza a tarefa como 'em_andamento' ao acessar a aula
  if (userId) {
    db.query(
      `INSERT INTO aulas_assistidas (usuario_id, aula_id, status)
       VALUES (?, ?, 'em_andamento')
       ON DUPLICATE KEY UPDATE status = 'em_andamento', data_assistida = CURRENT_TIMESTAMP`,
      [userId, aulaId]
    );
  }

  db.query(
    `SELECT a.id, a.titulo, a.video_url, m.nome as materia, m.id as materia_id FROM aulas a LEFT JOIN materias m ON a.materia_id = m.id WHERE a.id = ?`,
    [aulaId],
    (err, results) => {
      if (err || results.length === 0) {
        return res.render("aula", {
          aula: null,
          perguntas: [],
          alternativas: {},
          title: "Erro ao carregar Aula",
          user: req.user || null,
        });
      }
      const aula = results[0];
      // Buscar perguntas relacionadas à matéria da aula
      db.query(
        `SELECT * FROM perguntas WHERE materia_id = ?`,
        [aula.materia_id],
        (err2, perguntas) => {
          if (err2) perguntas = [];
          if (!perguntas.length) {
            return res.render("aula", {
              aula,
              perguntas,
              alternativas: {},
              title: aula.titulo,
              user: req.user || null,
            });
          }
          // Buscar alternativas para todas as perguntas
          const perguntaIds = perguntas.map(p => p.id);
          db.query(
            `SELECT * FROM alternativas WHERE pergunta_id IN (?)`,
            [perguntaIds],
            (err3, alternativasRows) => {
              const alternativas = {};
              if (!err3 && alternativasRows) {
                alternativasRows.forEach(alt => {
                  if (!alternativas[alt.pergunta_id]) alternativas[alt.pergunta_id] = [];
                  alternativas[alt.pergunta_id].push(alt);
                });
              }
              res.render("aula", {
                aula,
                perguntas,
                alternativas,
                title: aula.titulo,
                user: req.user || null,
              });
            }
          );
        }
      );
    }
  );
});

// Marcar aula como concluída
router.post('/aula/:id/concluir', requireLogin, (req, res) => {
  const aulaId = req.params.id;
  const userId = req.user.id;
  db.query(
    `UPDATE aulas_assistidas SET status = 'concluida', data_assistida = CURRENT_TIMESTAMP WHERE usuario_id = ? AND aula_id = ?`,
    [userId, aulaId],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

// Rota para a página de perfil
router.get("/profile", requireLogin, (req, res) => {
  res.render("profile", { title: "Meu Perfil", user: req.user || null });
});

// Rota para a página de segurança do perfil
router.get("/profile/security", requireLogin, (req, res) => {
  res.render("profile-security", {
    title: "Segurança do Perfil",
    user: req.user || null,
  });
});

// Rota para a página de tema do perfil
router.get("/profile/theme", requireLogin, (req, res) => {
  res.render("profile-theme", {
    title: "Configurações de Tema",
    user: req.user || null,
  });
});

// Nova rota para a página de recuperação de senha
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    title: "Recuperar Senha",
    user: req.user || null,
  });
});

// Nova rota para a página de redefinição de senha (com token)
router.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  res.render("reset-password", {
    title: "Redefinir Senha",
    token: token,
    user: req.user || null,
  });
});

// Página de vídeos por matéria
const materiasRotas = [
  { rota: '/matematica', nome: 'Matemática' },
  { rota: '/ciencias', nome: 'Ciências' },
  { rota: '/lingua-portuguesa', nome: 'Língua Portuguesa' },
  { rota: '/geografia', nome: 'Geografia' },
  { rota: '/filosofia', nome: 'Filosofia' },
  { rota: '/historia', nome: 'História' }
];
materiasRotas.forEach(({ rota, nome }) => {
  router.get(rota, (req, res) => {
    db.query(
      `SELECT a.id, a.titulo, a.video_url, m.nome as materia FROM aulas a LEFT JOIN materias m ON a.materia_id = m.id WHERE m.nome = ? ORDER BY a.id DESC`,
      [nome],
      (err, aulas) => {
        if (err) {
          console.error('Erro ao buscar aulas:', err);
          return res.render("dashboard", { user: req.user || null, aulas: [] });
        }
        res.render("dashboard", { user: req.user || null, aulas });
      }
    );
  });
});

// Página Minhas Tarefas
router.get('/minhas-tarefas', requireLogin, (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT aa.*, a.titulo, a.video_url, m.nome as materia
     FROM aulas_assistidas aa
     JOIN aulas a ON aa.aula_id = a.id
     LEFT JOIN materias m ON a.materia_id = m.id
     WHERE aa.usuario_id = ?
     ORDER BY aa.data_assistida DESC`,
    [userId],
    (err, tarefas) => {
      if (err) tarefas = [];
      res.render('minhas-tarefas', { user: req.user, tarefas });
    }
  );
});

module.exports = router;
module.exports.requireLogin = requireLogin;
