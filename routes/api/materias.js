const express = require("express");
const router = express.Router();

// Importar a conexão com o banco de dados
const db = require("../../database/connection");

// GET list of all subjects
router.get("/", (req, res) => {
  const sql = "SELECT id, nome FROM materias ORDER BY nome";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching subjects:", err);
      return res.status(500).json({ error: "Error fetching subjects" });
    }
    res.json(results);
  });
});

// You might add other subject-related routes here later

module.exports = router;
