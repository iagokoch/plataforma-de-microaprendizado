const express = require('express');
const path = require('path');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para processar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz - redireciona para a página de login por enquanto
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Rota para login
app.post('/api/login', async (req, res) => {
    try {
        const { emailCpf, senha } = req.body;
        const usuario = await Usuario.autenticar(emailCpf, senha);
        res.json({ sucesso: true, usuario });
    } catch (erro) {
        res.status(401).json({ 
            sucesso: false, 
            mensagem: erro.message || 'Erro na autenticação' 
        });
    }
});

// Rota para cadastro
app.post('/api/cadastro', async (req, res) => {
    try {
        const usuario = await Usuario.cadastrar(req.body);
        res.json({ sucesso: true, usuario });
    } catch (erro) {
        res.status(400).json({ 
            sucesso: false, 
            mensagem: erro.message || 'Erro no cadastro' 
        });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 