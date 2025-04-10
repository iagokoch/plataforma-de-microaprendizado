// Formatar CPF enquanto digita
document.getElementById("cpf").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    e.target.value = value;
  }
});

async function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
    senha: document.getElementById("senha").value,
    anoEscolar: document.getElementById("anoEscolar").value,
  };

  try {
    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.sucesso) {
      alert("Cadastro realizado com sucesso!");
      window.location.href = "/login";
    } else {
      alert(data.mensagem || "Erro ao realizar cadastro");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao realizar cadastro");
  }
}
