const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Rota de registro
router.post('/register', async (req, res) => {
    try {
        const { nome, email, cpf, senha } = req.body;
        
        // Hash da senha
        const hashedSenha = await bcrypt.hash(senha, 10);
        
        // Inserir usuário no banco
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nome, email, cpf, senha) VALUES (?, ?, ?, ?)',
            [nome, email, cpf, hashedSenha]
        );
        
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Buscar usuário
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        
        const user = users[0];
        
        // Verificar senha
        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        
        // Aqui você pode gerar um token JWT se desejar
        res.json({ message: 'Login realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

module.exports = router; 