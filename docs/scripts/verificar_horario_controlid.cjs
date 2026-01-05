const axios = require('axios');

const baseUrl = 'http://192.168.2.142:80';

async function verificarHorario() {
  try {
    const login = await axios.post(
      `${baseUrl}/login.fcgi`,
      { login: 'admin', password: 'admin' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    const session = login.data.session;

    const response = await axios.post(
      `${baseUrl}/system_information.fcgi?session=${session}`,
      {},
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('📅 Informações da Control ID:\n');
    console.log('Data/Hora do sistema:', new Date().toLocaleString('pt-BR'));
    console.log('Resposta completa:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarHorario();
