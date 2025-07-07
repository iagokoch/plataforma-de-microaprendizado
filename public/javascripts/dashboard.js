async function fetchAndDisplaySubjects() {
  try {
    console.log('Chamando fetchAndDisplaySubjects');
    const response = await fetch("/api/materias");
    console.log('Response:', response);
    if (!response.ok) throw new Error('Erro ao buscar matérias');
    const subjects = await response.json();
    console.log('Subjects:', subjects);
    // ... resto do código ...
  } catch (error) {
    console.error("Error fetching subjects:", error);
    // ... tratamento de erro ...
  }
}

fetchAndDisplaySubjects(); 