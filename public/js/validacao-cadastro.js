class ValidadorCadastro {
    constructor() {
        this.regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.mensagens = {
            emailInvalido: 'Por favor, insira um email válido',
            cpfInvalido: 'Por favor, insira um CPF válido',
            campoObrigatorio: 'Este campo é obrigatório',
            senhasNaoCoincidem: 'As senhas não coincidem',
            senhaMuitoCurta: 'A senha deve ter pelo menos 6 caracteres'
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

class FormularioCadastro {
    constructor() {
        this.validador = new ValidadorCadastro();
        this.feedback = new FeedbackUI();
        this.form = document.getElementById('cadastroForm');
        this.campos = {
            nome: document.getElementById('nome'),
            email: document.getElementById('email'),
            cpf: document.getElementById('cpf'),
            senha: document.getElementById('senha'),
            confirmarSenha: document.getElementById('confirmarSenha')
        };
        
        this.inicializar();
    }

    inicializar() {
        if (!this.form || !Object.values(this.campos).every(campo => campo)) {
            console.error('Elementos do formulário não encontrados');
            return;
        }

        // Formata o CPF enquanto digita
        this.campos.cpf.addEventListener('input', (e) => {
            let cpf = e.target.value.replace(/[^\d]/g, '');
            if (cpf.length <= 11) {
                e.target.value = this.validador.formatarCPF(cpf);
            }
        });

        // Validações em tempo real
        this.campos.email.addEventListener('blur', () => this.validarCampo('email'));
        this.campos.cpf.addEventListener('blur', () => this.validarCampo('cpf'));
        this.campos.senha.addEventListener('input', () => this.validarCampo('senha'));
        this.campos.confirmarSenha.addEventListener('input', () => this.validarCampo('confirmarSenha'));

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validarCampo(campo) {
        const valor = this.campos[campo].value.trim();
        
        if (!valor) {
            this.feedback.mostrarErro(this.campos[campo], this.validador.mensagens.campoObrigatorio);
            return false;
        }

        switch (campo) {
            case 'email':
                if (!this.validador.validarEmail(valor)) {
                    this.feedback.mostrarErro(this.campos.email, this.validador.mensagens.emailInvalido);
                    return false;
                }
                break;
            
            case 'cpf':
                if (!this.validador.validarCPF(valor)) {
                    this.feedback.mostrarErro(this.campos.cpf, this.validador.mensagens.cpfInvalido);
                    return false;
                }
                break;
            
            case 'senha':
                if (valor.length < 6) {
                    this.feedback.mostrarErro(this.campos.senha, this.validador.mensagens.senhaMuitoCurta);
                    return false;
                }
                if (this.campos.confirmarSenha.value) {
                    this.validarCampo('confirmarSenha');
                }
                break;
            
            case 'confirmarSenha':
                if (valor !== this.campos.senha.value) {
                    this.feedback.mostrarErro(this.campos.confirmarSenha, this.validador.mensagens.senhasNaoCoincidem);
                    return false;
                }
                break;
        }

        this.feedback.mostrarSucesso(this.campos[campo]);
        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Valida todos os campos
        const camposValidos = Object.keys(this.campos).every(campo => this.validarCampo(campo));
        
        if (!camposValidos) return;

        try {
            const dados = {
                nome: this.campos.nome.value.trim(),
                email: this.campos.email.value.trim(),
                cpf: this.campos.cpf.value.replace(/[^\d]/g, ''),
                senha: this.campos.senha.value
            };

            const response = await fetch('/api/cadastro', {
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

            // Redireciona para a página de login
            window.location.href = '/index.html';
            
        } catch (erro) {
            console.error('Erro no cadastro:', erro);
            alert(erro.message || 'Erro ao realizar cadastro. Tente novamente.');
        }
    }
}

// Inicializa o formulário quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => new FormularioCadastro()); 