// Testar qual dia da semana está sendo detectado

const getDayOfWeek = () => {
  // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  // Segunda=A, Terça=B, Quarta=C, Quinta=D, Sexta=A, Sábado=B, Domingo=C
  const days = ["C", "A", "B", "C", "D", "A", "B"];
  return days[new Date().getDay()];
};

const now = new Date();
const dayNumber = now.getDay();
const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

console.log(`\n📅 Teste de detecção de dia da semana:\n`);
console.log(`Data/Hora atual: ${now.toLocaleString('pt-BR')}`);
console.log(`Dia da semana (número): ${dayNumber}`);
console.log(`Dia da semana (nome): ${dayNames[dayNumber]}`);
console.log(`Treino detectado: ${getDayOfWeek()}`);

console.log(`\n📋 Mapeamento esperado:`);
console.log(`  Domingo (0) → C`);
console.log(`  Segunda (1) → A`);
console.log(`  Terça (2) → B`);
console.log(`  Quarta (3) → C`);
console.log(`  Quinta (4) → D`);
console.log(`  Sexta (5) → A`);
console.log(`  Sábado (6) → B`);
