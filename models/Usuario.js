const { conectar } = require('../config/database');
const bcrypt = require('bcrypt');

class Usuario {
    static async autenticar(emailCpf, senha) {
        const conexao = await conectar();
        try {
            // Verifica se o login é por email ou CPF
            const campo = emailCpf.includes('@') ? 'email_usuario' : 'cpf_usuario';
            
            // Busca o usuário
            const [usuarios] = await conexao.execute(
                `SELECT * FROM usuario WHERE ${campo} = ?`,
                [emailCpf]
            );

            if (usuarios.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const usuario = usuarios[0];

            // Verifica a senha
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha_usuario);
            if (!senhaCorreta) {
                throw new Error('Senha incorreta');
            }

            // Remove a senha antes de retornar
            delete usuario.senha_usuario;
            return usuario;

        } catch (erro) {
            console.error('Erro na autenticação:', erro);
            throw erro;
        } finally {
            await conexao.end();
        }
    }

    static async cadastrar(dados) {
        const conexao = await conectar();
        try {
            // Verifica se o email ou CPF já existe
            const [usuariosExistentes] = await conexao.execute(
                'SELECT * FROM usuario WHERE email_usuario = ? OR cpf_usuario = ?',
                [dados.email, dados.cpf]
            );

            if (usuariosExistentes.length > 0) {
                throw new Error('Email ou CPF já cadastrado');
            }

            // Criptografa a senha
            const senhaCriptografada = await bcrypt.hash(dados.senha, 10);

            // Insere o novo usuário
            const [resultado] = await conexao.execute(
                'INSERT INTO usuario (nome_usuario, email_usuario, cpf_usuario, senha_usuario, data_cadastro) VALUES (?, ?, ?, ?, NOW())',
                [dados.nome, dados.email, dados.cpf, senhaCriptografada]
            );

            return {
                id_usuario: resultado.insertId,
                nome_usuario: dados.nome,
                email_usuario: dados.email,
                cpf_usuario: dados.cpf
            };

        } catch (erro) {
            console.error('Erro no cadastro:', erro);
            throw erro;
        } finally {
            await conexao.end();
        }
    }
}

module.exports = Usuario; 