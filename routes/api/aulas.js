const express = require("express");
const router = express.Router();

// Importar a conexão com o banco de dados
const db = require("../../database/connection");

// GET list of aulas, optionally filtered by materia_id or fetch 2 per subject
router.get("/", (req, res) => {
  const materiaId = req.query.materia_id;
  let sql;
  let params = [];

  if (materiaId) {
    // Fetch ALL aulas filtered by materia_id
    sql = "SELECT id, titulo, video_url FROM aulas WHERE materia_id = ?";
    params = [materiaId];
  } else {
    // Fetch 2 aulas per subject
    // Requires MySQL 8.0+ for ROW_NUMBER(). For older versions, a different approach is needed.
    sql = `
      SELECT id, titulo, video_url, materia_id
      FROM (
          SELECT
              id, titulo, video_url, materia_id,
              ROW_NUMBER() OVER (PARTITION BY materia_id ORDER BY created_at) as rn
          FROM aulas
      ) as ranked_aulas
      WHERE rn <= 2
      ORDER BY materia_id, rn;
    `;
    params = [];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching aulas:", err);
      // If ROW_NUMBER() is not supported, the error will likely happen here.
      // Provide a specific error message or fallback.
      if (
        err.code === "ER_PARSE_ERROR" ||
        err.message.includes("window function")
      ) {
        console.error(
          "ROW_NUMBER() not supported in your MySQL version. Please use MySQL 8.0+ or implement a fallback query."
        );
        // Fallback: maybe just fetch a few random ones or error out clearly
        return res
          .status(500)
          .json({
            error:
              "Database query error: Window functions (ROW_NUMBER) not supported. Requires MySQL 8.0+",
          });
      }
      return res.status(500).json({ error: "Error fetching aulas" });
    }
    res.json(results);
  });
});

// GET data for a specific lesson (aula), including its questions and options
router.get("/:id", (req, res) => {
  const aulaId = req.params.id;

  // SQL to fetch aula data, its question, and options
  // Assuming one question per aula for simplicity based on the image layout
  const sql = `
    SELECT 
        a.id AS aula_id,
        a.titulo AS aula_titulo,
        a.video_url AS aula_video_url,
        ap.id AS pergunta_id,
        ap.texto_pergunta AS pergunta_texto,
        aro.id AS opcao_id,
        aro.texto_opcao AS opcao_texto,
        aro.is_correta AS opcao_is_correta
    FROM aulas a
    LEFT JOIN aulas_perguntas ap ON a.id = ap.aula_id
    LEFT JOIN aulas_opcoes_resposta aro ON ap.id = aro.aula_pergunta_id
    WHERE a.id = ?
    ORDER BY aro.id ASC -- Or a specific order column if you add one
  `;

  db.query(sql, [aulaId], (err, results) => {
    if (err) {
      console.error("Error fetching aula data:", err);
      return res.status(500).json({ error: "Error fetching aula data" });
    }

    if (results.length === 0) {
      // Check if the aula itself exists even if there are no questions
      const checkAulaSql =
        "SELECT id, titulo, video_url FROM aulas WHERE id = ?";
      db.query(checkAulaSql, [aulaId], (checkErr, aulaResults) => {
        if (checkErr) {
          console.error("Error checking aula existence:", checkErr);
          return res
            .status(500)
            .json({ error: "Error checking aula existence" });
        }
        if (aulaResults.length === 0) {
          return res.status(404).json({ error: "Aula not found" });
        } else {
          // Aula exists but has no questions/options
          return res.json({
            id: aulaResults[0].id,
            titulo: aulaResults[0].titulo,
            video_url: aulaResults[0].video_url,
            pergunta: null, // Or an empty object/array depending on desired structure
          });
        }
      });
      return; // Exit the outer callback
    }

    // Assuming one question per aula for simplicity, process the results
    const aulaData = {
      id: results[0].aula_id,
      titulo: results[0].aula_titulo,
      video_url: results[0].aula_video_url,
      pergunta: null,
    };

    // Process question and options if they exist
    if (results[0].pergunta_id) {
      aulaData.pergunta = {
        id: results[0].pergunta_id,
        texto: results[0].pergunta_texto,
        opcoes: [],
      };

      results.forEach((row) => {
        if (row.opcao_id) {
          aulaData.pergunta.opcoes.push({
            id: row.opcao_id,
            texto: row.opcao_texto,
            is_correta: row.opcao_is_correta,
          });
        }
      });
    }

    res.json(aulaData);
  });
});

// You might add POST routes here later for submitting answers, etc.

module.exports = router;
