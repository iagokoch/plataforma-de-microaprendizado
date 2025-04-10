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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 