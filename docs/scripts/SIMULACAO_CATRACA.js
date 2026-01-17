/**
 * SIMULAÇÃO DE TESTES DA CATRACA TOLETUS
 *
 * Este script simula os diferentes cenários de configuração
 * da direção da catraca para entender qual usar.
 */

console.log('\n========================================');
console.log('  SIMULAÇÃO: DIREÇÃO DA CATRACA TOLETUS');
console.log('========================================\n');

// Configurações possíveis
const configuracoes = [
  { entryClockwise: true, release: 'ReleaseEntry' },
  { entryClockwise: false, release: 'ReleaseEntry' },
  { entryClockwise: true, release: 'ReleaseExit' },
  { entryClockwise: false, release: 'ReleaseExit' },
  { entryClockwise: true, release: 'ReleaseEntryAndExit' },
  { entryClockwise: false, release: 'ReleaseEntryAndExit' },
];

/**
 * Simula o comportamento da catraca baseado em lógica inferida
 *
 * PREMISSAS DA SIMULAÇÃO:
 * - entryClockwise = true  → Gira sentido HORÁRIO (→)
 * - entryClockwise = false → Gira sentido ANTI-HORÁRIO (←)
 * - ReleaseEntry → Libera lado de ENTRADA
 * - ReleaseExit → Libera lado de SAÍDA
 * - ReleaseEntryAndExit → Libera AMBOS os lados
 */
function simularCatraca(entryClockwise, release) {
  const direcao = entryClockwise ? 'HORÁRIO (→)' : 'ANTI-HORÁRIO (←)';

  let resultado = {
    configuracao: `entryClockwise = ${entryClockwise}`,
    comando: release,
    direcaoGiro: direcao,
    ladosLiberados: [],
    representacaoVisual: ''
  };

  // Lógica de liberação baseada no comando
  switch(release) {
    case 'ReleaseEntry':
      if (entryClockwise) {
        resultado.ladosLiberados = ['DIREITA (entrada liberada, giro horário)'];
        resultado.representacaoVisual = `
        [ANTES]           [DEPOIS]
        ┌─────┐          ┌─────┐
    ❌  │  ■  │  ✅  →   │  /  │  ✅ (LIBERADO)
        │     │          │     │
        └─────┘          └─────┘
        ESQUERDA         DIREITA
        BLOQUEADA        LIBERADA
        `;
      } else {
        resultado.ladosLiberados = ['ESQUERDA (entrada liberada, giro anti-horário)'];
        resultado.representacaoVisual = `
        [ANTES]           [DEPOIS]
        ┌─────┐          ┌─────┐
    ✅  │  ■  │  ❌  ←   ✅  │  \\  │
        │     │          │     │
        └─────┘          └─────┘
        ESQUERDA         DIREITA
        LIBERADA         BLOQUEADA
        `;
      }
      break;

    case 'ReleaseExit':
      if (entryClockwise) {
        resultado.ladosLiberados = ['ESQUERDA (saída liberada, giro horário)'];
        resultado.representacaoVisual = `
        [ANTES]           [DEPOIS]
        ┌─────┐          ┌─────┐
    ✅  │  ■  │  ❌  →   ✅  │  /  │
        │     │          │     │
        └─────┘          └─────┘
        ESQUERDA         DIREITA
        LIBERADA         BLOQUEADA
        `;
      } else {
        resultado.ladosLiberados = ['DIREITA (saída liberada, giro anti-horário)'];
        resultado.representacaoVisual = `
        [ANTES]           [DEPOIS]
        ┌─────┐          ┌─────┐
    ❌  │  ■  │  ✅  ←   │  \\  │  ✅ (LIBERADO)
        │     │          │     │
        └─────┘          └─────┘
        ESQUERDA         DIREITA
        BLOQUEADA        LIBERADA
        `;
      }
      break;

    case 'ReleaseEntryAndExit':
      resultado.ladosLiberados = ['AMBOS OS LADOS (entrada E saída)'];
      resultado.representacaoVisual = `
        [ANTES]           [DEPOIS]
        ┌─────┐          ┌─────┐
    ❌  │  ■  │  ❌  →   ✅  │     │  ✅
        │     │          │     │
        └─────┘          └─────┘
        ESQUERDA         DIREITA
        AMBOS LIBERADOS (ignora direção)
        `;
      break;
  }

  return resultado;
}

// Executar simulações
console.log('📊 SIMULANDO TODOS OS CENÁRIOS POSSÍVEIS:\n');
console.log('='.repeat(80));

configuracoes.forEach((config, index) => {
  const resultado = simularCatraca(config.entryClockwise, config.release);

  console.log(`\n🧪 CENÁRIO ${index + 1}:`);
  console.log(`   Configuração: ${resultado.configuracao}`);
  console.log(`   Comando: ${resultado.comando}`);
  console.log(`   Direção de Giro: ${resultado.direcaoGiro}`);
  console.log(`   Lados Liberados: ${resultado.ladosLiberados.join(', ')}`);
  console.log(resultado.representacaoVisual);
  console.log('-'.repeat(80));
});

// Recomendações baseadas no que o usuário disse
console.log('\n\n📝 ANÁLISE BASEADA NO SEU RELATO:\n');
console.log('Você disse:');
console.log('  "ainda esta liebrando para o lado esquedo tem que liberr para o lado direito"');
console.log('  "fisicamente girando o braco so gira para o lado esquedo o lado direito esta livre"\n');

console.log('🎯 INTERPRETAÇÃO:');
console.log('  - Atualmente: Catraca libera ESQUERDA (braço gira para lá)');
console.log('  - Desejado: Catraca deve liberar DIREITA (braço deve girar para lá)\n');

console.log('💡 RECOMENDAÇÕES:\n');

console.log('✅ OPÇÃO 1: Inverter entryClockwise');
console.log('   Se atualmente usa: entryClockwise = FALSE');
console.log('   Testar com: entryClockwise = TRUE');
console.log('   Comando: ReleaseEntry\n');

console.log('✅ OPÇÃO 2: Usar comando diferente');
console.log('   Se atualmente usa: ReleaseEntry com entryClockwise = FALSE');
console.log('   Testar com: ReleaseExit com entryClockwise = TRUE');
console.log('   OU usar: ReleaseEntryAndExit (libera ambos, ignora direção)\n');

console.log('✅ OPÇÃO 3: Configuração Permanente (MAIS SEGURO)');
console.log('   1. Chamar setEntryClockwise(TRUE) UMA VEZ para configurar');
console.log('   2. Sempre usar ReleaseEntry (direção já configurada)');
console.log('   3. Testar e documentar qual valor funciona\n');

console.log('='.repeat(80));
console.log('\n🔬 PRÓXIMOS PASSOS RECOMENDADOS:\n');
console.log('1. Criar endpoint de teste manual');
console.log('2. Testar entryClockwise=TRUE + ReleaseEntry');
console.log('3. Observar para qual lado gira fisicamente');
console.log('4. Se girar DIREITA → SUCESSO!');
console.log('5. Se girar ESQUERDA → Testar entryClockwise=FALSE');
console.log('6. Documentar resultado e aplicar configuração correta\n');

console.log('⚠️  IMPORTANTE:');
console.log('   Esta é uma SIMULAÇÃO baseada em lógica inferida.');
console.log('   O comportamento REAL pode variar dependendo do modelo da catraca.');
console.log('   É necessário testar empiricamente no hardware real.\n');
