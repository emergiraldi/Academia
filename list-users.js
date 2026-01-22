import axios from 'axios';

async function listUsers() {
  try {
    // Login
    const loginResponse = await axios.post('http://192.168.2.142/login.fcgi', {
      login: 'admin',
      password: 'admin'
    });

    const session = loginResponse.data.session;
    console.log('Session:', session);

    // Load users
    const usersResponse = await axios.post(
      `http://192.168.2.142/load_objects.fcgi?session=${session}`,
      { object: 'users' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const users = usersResponse.data.users || [];
    console.log('\n=== USUÁRIOS NA LEITORA ===\n');

    if (users.length === 0) {
      console.log('Nenhum usuário encontrado');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Matrícula: ${user.registration}`);
        console.log(`Tem foto: ${user.image ? 'SIM' : 'NÃO'}`);
        console.log('---');
      });

      console.log(`\nTotal: ${users.length} usuários`);
    }

    // Logout
    await axios.post(`http://192.168.2.142/logout.fcgi?session=${session}`);

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

listUsers();
