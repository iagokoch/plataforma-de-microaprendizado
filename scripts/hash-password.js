// Gera o hash bcrypt de uma senha para usar em ADMIN_PASSWORD_HASH no .env.
// Uso: npm run hash-password -- "minha-senha-forte"
const bcrypt = require("bcrypt");

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: npm run hash-password -- "sua-senha"');
  process.exit(1);
}

bcrypt.hash(senha, 10).then((hash) => console.log(hash));
