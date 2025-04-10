async function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    emailCpf: document.getElementById("emailCpf").value,
    senha: document.getElementById("senha").value,
  };

  try {
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.sucesso) {
      window.location.href = "/";
    } else {
      alert(data.mensagem || "Erro ao fazer login");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao fazer login");
  }
}
