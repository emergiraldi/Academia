const fetch = require('node-fetch');

async function testUpdateGym() {
  try {
    console.log('🔄 Tentando atualizar academia via API...\n');

    // Dados para atualizar (mudando apenas o CEP para testar)
    const updateData = {
      gymId: 1,
      zipCode: "01234-999", // Mudando o CEP
      city: "São Paulo",
      state: "SP"
    };

    console.log('Dados a serem enviados:', JSON.stringify(updateData, null, 2));

    const response = await fetch('http://localhost:3002/api/trpc/gyms.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    console.log('\n📊 Status da resposta:', response.status);
    console.log('📊 Status text:', response.statusText);

    const responseText = await response.text();
    console.log('\n📦 Resposta completa:', responseText);

    if (response.ok) {
      console.log('\n✅ Atualização bem-sucedida!');
    } else {
      console.log('\n❌ Erro na atualização!');
    }

  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUpdateGym();
