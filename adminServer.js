require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dbConfig = require('./config/db-config');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;

// Credenciais do admin vêm do .env; a senha é guardada só como hash bcrypt
// (gere com: npm run hash-password -- "sua-senha").
const { ADMIN_USER, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET } = process.env;
if (!ADMIN_USER || !ADMIN_PASSWORD_HASH || !ADMIN_SESSION_SECRET) {
  console.error('Defina ADMIN_USER, ADMIN_PASSWORD_HASH e ADMIN_SESSION_SECRET no .env (veja .env.example).');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/admin'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'admin.sid',
  secret: ADMIN_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware de proteção
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/login');
}

// Login admin (credenciais definidas no .env)
app.get('/login', (req, res) => res.render('login', { erro: null }));
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;
  // Sempre roda o bcrypt.compare, mesmo com usuário errado, para não revelar pelo tempo de resposta qual campo falhou
  const senhaOk = await bcrypt.compare(String(senha || ''), ADMIN_PASSWORD_HASH);
  if (usuario === ADMIN_USER && senhaOk) {
    return req.session.regenerate(() => {
      req.session.isAdmin = true;
      res.redirect('/conteudo');
    });
  }
  res.render('login', { erro: 'Usuário ou senha inválidos' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Redirecionar '/' para dashboard se autenticado, senão para login
app.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Redirecionar /dashboard para /conteudo
app.get('/dashboard', (req, res) => res.redirect('/conteudo'));

// Página de Conteúdo
app.get('/conteudo', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.redirect('/login');
  }
  let aulas = [];
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT a.id, a.titulo, a.video_url, m.nome as materia
      FROM aulas a
      LEFT JOIN materias m ON a.materia_id = m.id
      ORDER BY a.id DESC
    `);
    aulas = rows;
    await conn.end();
  } catch (e) {
    console.error('Erro ao buscar conteúdos:', e);
  }
  res.render('conteudo', { aulas });
});

app.listen(PORT, () => {
  console.log(`Admin rodando em http://localhost:${PORT}`);
}); 