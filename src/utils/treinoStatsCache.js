// Cache compartilhado entre Home.jsx (que já busca training_stats de toda
// categoria assim que a lista carrega, pros badges dos cards) e
// ModaTreino.jsx (o modal "Aprender/Repetir/Revisar") - sem isso, o modal
// buscava os mesmos dados de novo do zero toda vez que abria, mostrando os
// números zerados por um instante até a resposta chegar, mesmo a home já
// tendo acabado de buscar exatamente isso segundos antes.
export const treinoStatsCache = new Map();
