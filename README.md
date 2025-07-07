# Plataforma de Microaprendizado - MicroLearn

Uma plataforma web para microaprendizado, onde alunos podem assistir aulas, responder quizzes, acompanhar seu progresso e interagir com perguntas da comunidade.

## Funcionalidades

- Cadastro e login de usuários
- Dashboard com listagem de aulas por matéria
- Visualização de vídeo-aula com quiz interativo
- Sistema de perguntas e respostas por matéria
- Página "Minhas Tarefas" para acompanhar aulas em andamento e concluídas
- Perfil do usuário com foto e configurações
- Painel administrativo para cadastro e gestão de conteúdo (aulas, perguntas, etc.)

## Tecnologias Utilizadas

- Node.js + Express
- EJS (views)
- MySQL (banco de dados)
- CSS customizado
- Autenticação de usuários

## Instalação

1. **Clone o repositório:**
   ```
   git clone <url-do-repo>
   cd plataforma-de-microaprendizado
   ```

2. **Instale as dependências:**
   ```
   npm install
   ```

3. **Configure o banco de dados:**
   - Importe o arquivo `database/microlearn.sql` no seu MySQL (phpMyAdmin ou linha de comando).
   - Ajuste as configurações de conexão em `config/database.js` se necessário.

4. **Inicie o servidor:**
   ```
   npm start
   ```
   Ou:
   ```
   node server.js
   ```

5. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## Usuário Administrador

Para acessar como administrador no ambiente local (localhost:4000), utilize:

- **Usuário:** `admin`
- **Senha:** `admin`

> O painel administrativo estará disponível em `http://localhost:4000`.

## Estrutura do Projeto

```
plataforma-de-microaprendizado/
├── app.js
├── server.js
├── config/
├── database/
├── models/
├── public/
├── routes/
├── views/
└── ...
```

## Observações

- O sistema diferencia aulas concluídas e em andamento automaticamente.
- Aulas só aparecem em "Minhas Tarefas" após o usuário clicar em "ver aula".
- O status muda para "concluída" ao finalizar o quiz e clicar em "Concluído". 