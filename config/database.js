const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root', // Altere para seu usuário do MySQL
    password: '', // Altere para sua senha do MySQL
    database: 'microaprendizado'
};

async function conectar() {
    try {
        const conexao = await mysql.createConnection(dbConfig);
        console.log('Conectado ao MySQL com sucesso!');
        return conexao;
    } catch (erro) {
        console.error('Erro ao conectar ao MySQL:', erro);
        throw erro;
    }
}

module.exports = { conectar }; 