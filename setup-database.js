const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Conectar sem especificar database para poder criar
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    console.log('Conectado ao MySQL...');

    // Ler o arquivo SQL
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database', 'microlearn.sql'), 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sqlFile.split(';').filter(cmd => cmd.trim().length > 0);

    // Executar cada comando
    for (let command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log('Comando executado com sucesso');
        } catch (error) {
          console.error('Erro ao executar comando:', error.message);
        }
      }
    }

    console.log('Banco de dados configurado com sucesso!');
    await connection.end();

  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
}

setupDatabase(); 