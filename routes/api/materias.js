const express = require("express");
const router = express.Router();

// Importar a conexão com o banco de dados
const db = require("../../database/connection");

// Rota para listar todas as matérias
router.get("/", (req, res) => {
  db.query("SELECT id, nome FROM materias", (err, results) => {
    if (err) {
      console.error("Erro ao buscar matérias:", err);
      return res.status(500).json({ erro: "Erro ao buscar matérias" });
    }
    res.json(results);
  });
});

// You might add other subject-related routes here later

module.exports = router;
