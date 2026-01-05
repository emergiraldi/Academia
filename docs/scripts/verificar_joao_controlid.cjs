const axios = require('axios');

async function verificarJoao() {
  const controlIdIp = '192.168.2.142';
  const controlIdPort = 80;
  const baseUrl = `http://${controlIdIp}:${controlIdPort}`;

  try {
    // Login
    const loginResponse = await axios.post(
      `${baseUrl}/login.fcgi`,
      { login: 'admin', password: 'admin' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const session = loginResponse.data.session;

    // Buscar usuário ID 1 (João)
    const userResponse = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      {
        object: 'users',
        where: { users: { id: 1 } }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const user = userResponse.data.users[0];

    if (!user) {
      console.log('❌ Usuário ID 1 não encontrado');
      return;
    }

    console.log('✅ João Santos no Control ID:');
    console.log('   ID:', user.id);
    console.log('   Nome:', user.name);
    console.log('   Matrícula:', user.registration);
    console.log('   Begin Time:', user.begin_time === 0 ? '✅ Liberado' : `❌ ${user.begin_time}`);
    console.log('   End Time:', user.end_time === 2147483647 ? '✅ Sem expiração' : `❌ ${user.end_time}`);
    console.log('   Foto:', user.image_timestamp > 0 ? '✅ Cadastrada' : '❌ Sem foto');

    // Buscar vínculos de grupo
    const groupsResponse = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      {
        object: 'user_groups',
        where: { user_groups: { user_id: 1 } }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const groups = groupsResponse.data.user_groups || [];

    if (groups.length > 0) {
      console.log('   Grupos:', groups.map(g => g.group_id).join(', '));
    } else {
      console.log('   Grupos: ❌ Nenhum');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarJoao();
