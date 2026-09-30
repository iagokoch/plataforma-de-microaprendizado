-- Primeiro, apagar o banco de dados se existir
DROP DATABASE IF EXISTS microlearn;

-- Criar o banco de dados
CREATE DATABASE microlearn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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

-- Tabela de matérias
CREATE TABLE materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de perguntas
-- Guarda dois tipos de pergunta, como o código usa:
--   * dúvidas da comunidade (fórum): usuario_id preenchido, materia_id NULL
--   * perguntas do quiz de uma matéria: materia_id preenchido
CREATE TABLE perguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    usuario_id INT,
    materia_id INT DEFAULT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);

-- Alternativas das perguntas do quiz (uma marcada como correta)
CREATE TABLE alternativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pergunta_id INT NOT NULL,
    texto VARCHAR(255) NOT NULL,
    correta BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE
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
    status ENUM('em_andamento', 'concluida') NOT NULL DEFAULT 'em_andamento',
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
-- (os nomes precisam bater com as rotas em routes/index.js: /matematica, /ciencias, /lingua-portuguesa...)
INSERT INTO materias (nome) VALUES 
('Matemática'),
('Língua Portuguesa'),
('História'),
('Geografia'),
('Física'),
('Química'),
('Biologia'),
('Filosofia'),
('Sociologia'),
('Arte'),
('Ciências');

-- Inserir algumas aulas de exemplo
INSERT INTO aulas (titulo, video_url, materia_id) VALUES 
('Introdução à Álgebra', 'https://www.youtube.com/embed/example1', 1),
('Gramática Básica', 'https://www.youtube.com/embed/example2', 2),
('História do Brasil', 'https://www.youtube.com/embed/example3', 3);

-- Perguntas de quiz de exemplo (materia_id: 1 = Matemática, 2 = Língua Portuguesa, 3 = História)
INSERT INTO perguntas (texto, materia_id) VALUES
('Qual o valor de x na equação 2x + 4 = 10?', 1),
('Qual destas palavras é um substantivo?', 2),
('Em que ano foi proclamada a Independência do Brasil?', 3);

INSERT INTO alternativas (pergunta_id, texto, correta) VALUES
(1, 'x = 2', FALSE), (1, 'x = 3', TRUE), (1, 'x = 7', FALSE),
(2, 'Correr', FALSE), (2, 'Bonito', FALSE), (2, 'Casa', TRUE),
(3, '1500', FALSE), (3, '1822', TRUE), (3, '1889', FALSE);
