const axios = require('axios');

const baseUrl = 'http://192.168.2.142:80';

async function verUsuarios() {
  try {
    const login = await axios.post(
      `${baseUrl}/login.fcgi`,
      { login: 'admin', password: 'admin' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const session = login.data.session;

    const users = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      { object: 'users' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('Usuários na Control ID:\n');
    users.data.users.forEach(u => {
      console.log(`  ID ${u.id}: ${u.name} (registration: ${u.registration})`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

verUsuarios();
