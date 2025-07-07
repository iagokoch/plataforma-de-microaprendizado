class Validador {
    constructor() {
        this.regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.mensagens = {
            emailInvalido: 'Por favor, insira um email válido',
            cpfInvalido: 'Por favor, insira um CPF válido',
            campoObrigatorio: 'Este campo é obrigatório'
        };
    }

    validarEmail(email) {
        return this.regexEmail.test(email);
    }

    validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        try {
            const digitos = cpf.split('').map(Number);
            const calcularDigito = (slice) => {
                const soma = slice.reduce((acc, val, idx) => acc + val * (slice.length + 1 - idx), 0);
                const resto = soma % 11;
                return resto < 2 ? 0 : 11 - resto;
            };

            const digito1 = calcularDigito(digitos.slice(0, 9));
            if (digitos[9] !== digito1) return false;

            const digito2 = calcularDigito(digitos.slice(0, 10));
            if (digitos[10] !== digito2) return false;

            return true;
        } catch (erro) {
            return false;
        }
    }

    formatarCPF(cpf) {
        const numeros = cpf.replace(/[^\d]/g, '');
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
}

class FeedbackUI {
    constructor() {
        this.classes = {
            erro: 'text-red-500 text-sm mt-1',
            sucesso: 'text-green-500 text-sm mt-1',
            inputErro: 'border-red-500',
            inputSucesso: 'border-green-500'
        };
    }

    mostrarErro(input, mensagem) {
        this.limparFeedback(input);
        const divPai = input.parentElement;
        const mensagemErro = document.createElement('div');
        
        mensagemErro.className = `mensagem-erro ${this.classes.erro}`;
        mensagemErro.textContent = mensagem;
        
        input.classList.add(this.classes.inputErro);
        divPai.appendChild(mensagemErro);
    }

    mostrarSucesso(input) {
        this.limparFeedback(input);
        input.classList.add(this.classes.inputSucesso);
    }

    limparFeedback(input) {
        const divPai = input.parentElement;
        const mensagens = divPai.querySelectorAll('.mensagem-erro, .mensagem-sucesso');
        mensagens.forEach(msg => msg.remove());
        
        input.classList.remove(
            this.classes.inputErro,
            this.classes.inputSucesso
        );
    }
}

class FormularioLogin {
    constructor() {
        this.validador = new Validador();
        this.feedback = new FeedbackUI();
        this.form = document.getElementById('loginForm');
        this.emailCpfInput = document.getElementById('emailCpf');
        this.senhaInput = document.getElementById('senha');
        
        this.inicializar();
    }

    inicializar() {
        if (!this.form || !this.emailCpfInput || !this.senhaInput) {
            console.error('Elementos do formulário não encontrados');
            return;
        }

        // Formata o CPF se for digitado
        this.emailCpfInput.addEventListener('input', (e) => {
            const valor = e.target.value.trim();
            if (!valor.includes('@') && valor.length <= 14) {
                e.target.value = this.validador.formatarCPF(valor);
            }
        });

        // Validação em tempo real
        this.emailCpfInput.addEventListener('blur', () => this.validarEmailCpf());
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validarEmailCpf() {
        const valor = this.emailCpfInput.value.trim();
        
        if (!valor) {
            this.feedback.mostrarErro(this.emailCpfInput, this.validador.mensagens.campoObrigatorio);
            return false;
        }

        if (valor.includes('@')) {
            if (!this.validador.validarEmail(valor)) {
                this.feedback.mostrarErro(this.emailCpfInput, this.validador.mensagens.emailInvalido);
                return false;
            }
        } else {
            if (!this.validador.validarCPF(valor)) {
                this.feedback.mostrarErro(this.emailCpfInput, this.validador.mensagens.cpfInvalido);
                return false;
            }
        }

        this.feedback.mostrarSucesso(this.emailCpfInput);
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validarEmailCpf()) return;
        
        const senha = this.senhaInput.value;
        if (!senha) {
            this.feedback.mostrarErro(this.senhaInput, this.validador.mensagens.campoObrigatorio);
            return;
        }

        try {
            const dados = {
                emailCpf: this.emailCpfInput.value.trim(),
                senha: senha
            };

            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });

            const resultado = await response.json();

            if (!resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            // Redireciona para a página principal após o login
            window.location.href = '/dashboard.html';
            
        } catch (erro) {
            console.error('Erro no login:', erro);
            alert(erro.message || 'Erro ao fazer login. Tente novamente.');
        }
    }
}

// Inicializa o formulário quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => new FormularioLogin()); 