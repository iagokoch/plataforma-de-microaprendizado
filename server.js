const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("./database/connection"); // Importar a conexão com o banco
const bcrypt = require("bcrypt"); // Para comparar senhas
const dotenv = require("dotenv"); // Importar dotenv

dotenv.config(); // Carregar variáveis de ambiente do .env

// Importar rotas
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar EJS como view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware para processar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar middleware de sessão
app.use(
  session({
    name: 'user.sid',
    secret: "seu_segredo_muito_secreto", // Substitua por uma string aleatória forte
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 horas
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurar estratégia local do Passport
passport.use(
  new LocalStrategy(
    {
      usernameField: "emailCpf",
      passwordField: "senha",
      passReqToCallback: true,
    }, // Campos usados para login
    async (req, emailCpf, senha, done) => {
      try {
        console.log("Attempting login for:", emailCpf);
        console.log("Provided password (plain):", senha); // CUIDADO: APENAS PARA DEBUG
        const sql = "SELECT * FROM usuarios WHERE email = ? OR cpf = ?";
        db.query(sql, [emailCpf, emailCpf], async (err, results) => {
          if (err) {
            console.error("Database error during login:", err);
            return done(err);
          }
          if (results.length === 0) {
            console.log("User not found for:", emailCpf);
            return done(null, false, { message: "Usuário não encontrado" });
          }

          const user = results[0];
          console.log("User found:", user.email || user.cpf);
          console.log("Stored hashed password:", user.senha); // CUIDADO: APENAS PARA DEBUG
          const senhaCorreta = await bcrypt.compare(senha, user.senha);

          if (!senhaCorreta) {
            console.log("Incorrect password for:", user.email || user.cpf);
            return done(null, false, { message: "Senha incorreta" });
          }

          console.log("Authentication successful for:", user.email || user.cpf);
          return done(null, user); // Sucesso na autenticação
        });
      } catch (error) {
        console.error("Error in Passport local strategy:", error);
        return done(error);
      }
    }
  )
);

// Configurar serialização e desserialização do usuário
passport.serializeUser((user, done) => {
  done(null, user.id); // Salva o ID do usuário na sessão
});

passport.deserializeUser((id, done) => {
  const sql = "SELECT id, nome, email, theme, foto_perfil FROM usuarios WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return done(err);
    }
    done(null, results[0]); // Anexa o objeto do usuário à req.user
  });
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Usar rotas
app.use("/", indexRouter);
app.use("/api/users", usersRouter);
app.use("/api/perguntas", require("./routes/api/perguntas"));
app.use("/api/aulas", require("./routes/api/aulas"));
app.use("/api/materias", require("./routes/api/materias"));

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
