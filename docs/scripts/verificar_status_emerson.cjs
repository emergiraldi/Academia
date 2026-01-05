const axios = require('axios');

async function verificarStatus() {
  const controlIdIp = '192.168.2.142';
  const controlIdPort = 80;
  const baseUrl = `http://${controlIdIp}:${controlIdPort}`;
  const userId = 1;

  try {
    // Login
    const loginResponse = await axios.post(
      `${baseUrl}/login.fcgi`,
      { login: 'admin', password: 'admin' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const session = loginResponse.data.session;

    // Buscar usuário completo
    const userResponse = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      {
        object: 'users',
        where: { users: { id: userId } }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const user = userResponse.data.users[0];

    console.log('\n📊 STATUS COMPLETO DO EMERSON GIRALDI:\n');
    console.log('ID:', user.id);
    console.log('Nome:', user.name);
    console.log('Matrícula:', user.registration);
    console.log('Begin Time:', user.begin_time, user.begin_time === 0 ? '(✅ OK)' : '(❌)');
    console.log('End Time:', user.end_time, user.end_time === 0 ? '(🚫 BLOQUEADO)' : user.end_time === 2147483647 ? '(✅ LIBERADO)' : `(⚠️  ${user.end_time})`);
    console.log('Image Timestamp:', user.image_timestamp > 0 ? '✅ Tem foto' : '❌ Sem foto');
    console.log('User Type ID:', user.user_type_id);
    console.log('Salt:', user.salt);
    console.log('\n📋 DADOS COMPLETOS:');
    console.log(JSON.stringify(user, null, 2));

    // Buscar grupos
    const groupsResponse = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      {
        object: 'user_groups',
        where: { user_groups: { user_id: userId } }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('\n👥 GRUPOS:');
    console.log(JSON.stringify(groupsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

verificarStatus();
