const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 4000;

// Configuração do banco (ajuste para suas credenciais)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'microlearn',
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/admin'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'admin.sid',
  secret: 'admin_super_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware de proteção
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/login');
}

// Login admin (usuário e senha fixos)
app.get('/login', (req, res) => res.render('login', { erro: null }));
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  if (usuario === 'admin' && senha === 'admin') {
    req.session.isAdmin = true;
    return res.redirect('/conteudo');
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