const express = require("express");
const router = express.Router();

// Importar a conexão com o banco de dados
const db = require("../../database/connection");

router.get("/", (req, res) => {
  const sql = `
    SELECT 
        p.id AS pergunta_id,
        p.texto AS pergunta_texto,
        p.data_criacao AS pergunta_data,
        u.nome AS autor_nome,
        u.foto_perfil AS autor_foto,
        r.id AS resposta_id,
        r.texto AS resposta_texto,
        r.data_criacao AS resposta_data
    FROM perguntas p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN respostas r ON p.id = r.pergunta_id
    ORDER BY p.data_criacao DESC, r.data_criacao ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching questions and answers:", err);
      return res.status(500).json({ error: "Error fetching data" });
    }

    const questions = {};
    results.forEach((row) => {
      if (!questions[row.pergunta_id]) {
        questions[row.pergunta_id] = {
          id: row.pergunta_id,
          texto: row.pergunta_texto,
          data_criacao: row.pergunta_data,
          autor_nome: row.autor_nome,
          autor_foto: row.autor_foto,
          respostas: [],
        };
      }
      if (row.resposta_id) {
        questions[row.pergunta_id].respostas.push({
          id: row.resposta_id,
          texto: row.resposta_texto,
          data_criacao: row.resposta_data,
        });
      }
    });

    res.json(Object.values(questions));
  });
});

router.post("/", (req, res) => {
  const { texto, usuario_id } = req.body;
  if (!texto) {
    return res.status(400).json({ error: "Question text is required" });
  }

  const sql = "INSERT INTO perguntas (texto, usuario_id) VALUES (?, ?)";
  db.query(sql, [texto, usuario_id || null], (err, result) => {
    if (err) {
      console.error("Error inserting question:", err);
      return res.status(500).json({ error: "Error saving question" });
    }
    res.status(201).json({
      id: result.insertId,
      texto,
      usuario_id,
      data_criacao: new Date(),
    });
  });
});

router.post("/:perguntaId/respostas", (req, res) => {
  const { perguntaId } = req.params;
  const { texto, usuario_id } = req.body;
  if (!texto) {
    return res.status(400).json({ error: "Answer text is required" });
  }

  const sql =
    "INSERT INTO respostas (pergunta_id, texto, usuario_id) VALUES (?, ?, ?)";
  db.query(sql, [perguntaId, texto, usuario_id || null], (err, result) => {
    if (err) {
      console.error("Error inserting answer:", err);
      return res.status(500).json({ error: "Error saving answer" });
    }
    res.status(201).json({
      id: result.insertId,
      pergunta_id: parseInt(perguntaId),
      texto,
      usuario_id,
      data_criacao: new Date(),
    });
  });
});

// Rota para deletar uma pergunta (apenas pelo autor)
router.delete('/:id', (req, res) => {
  const perguntaId = req.params.id;
  const usuarioId = req.body.usuario_id;
  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  // Verifica se a pergunta pertence ao usuário
  const sqlCheck = 'SELECT usuario_id FROM perguntas WHERE id = ?';
  db.query(sqlCheck, [perguntaId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar pergunta' });
    if (!results.length || results[0].usuario_id != usuarioId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir esta pergunta' });
    }
    // Exclui a pergunta
    const sqlDelete = 'DELETE FROM perguntas WHERE id = ?';
    db.query(sqlDelete, [perguntaId], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erro ao excluir pergunta' });
      res.json({ sucesso: true });
    });
  });
});

module.exports = router;
