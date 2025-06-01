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
        r.id AS resposta_id,
        r.texto AS resposta_texto,
        r.data_criacao AS resposta_data
    FROM perguntas p
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
          respostas: [],
        };
      }
      if (row.resposta_id) {
        questions[row.pergunta_id].respostas.push({
          id: row.resposta_id,
          texto: row.resposta_texto,
          data_criacao: row.data_criacao,
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

module.exports = router;
