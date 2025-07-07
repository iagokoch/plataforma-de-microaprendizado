-- Primeiro, apagar o banco de dados se existir
DROP DATABASE IF EXISTS microlearn;

-- Criar o banco de dados
CREATE DATABASE microlearn;
USE microlearn;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ano_escolar ENUM('1º ano Ensino Médio', '2º ano Ensino Médio', '3º ano Ensino Médio') NOT NULL,
    theme VARCHAR(50) DEFAULT 'light',
    foto_perfil VARCHAR(255) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de perguntas da comunidade
CREATE TABLE perguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    usuario_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabela de respostas para as perguntas
CREATE TABLE respostas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pergunta_id INT NOT NULL,
    texto TEXT NOT NULL,
    usuario_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Nova Tabela de matérias
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de aulas
CREATE TABLE aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    video_url VARCHAR(255) NOT NULL, -- URL ou caminho para o vídeo da aula
    materia_id INT, -- Adicionado campo para vincular à matéria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE SET NULL -- Chave estrangeira para materias
);

-- Tabela de aulas assistidas pelos usuários
CREATE TABLE aulas_assistidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    aula_id INT NOT NULL,
    data_assistida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_aula (usuario_id, aula_id)
);

-- Tabela de acessos dos usuários
CREATE TABLE acessos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_acesso DATE NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_data (usuario_id, data_acesso)
);

-- Tabela de tokens para reset de senha
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Inserir algumas matérias de exemplo
INSERT INTO materias (nome) VALUES 
('Matemática'),
('Português'),
('História'),
('Geografia'),
('Física'),
('Química'),
('Biologia'),
('Filosofia'),
('Sociologia'),
('Arte');

-- Inserir algumas aulas de exemplo
INSERT INTO aulas (titulo, video_url, materia_id) VALUES 
('Introdução à Álgebra', 'https://www.youtube.com/embed/example1', 1),
('Gramática Básica', 'https://www.youtube.com/embed/example2', 2),
('História do Brasil', 'https://www.youtube.com/embed/example3', 3); 