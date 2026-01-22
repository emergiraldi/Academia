import axios from 'axios';

async function checkUserGroups() {
  try {
    // Login
    const loginResponse = await axios.post('http://192.168.2.142/login.fcgi', {
      login: 'admin',
      password: 'admin'
    });

    const session = loginResponse.data.session;

    // Load user_groups
    const groupsResponse = await axios.post(
      `http://192.168.2.142/load_objects.fcgi?session=${session}`,
      { object: 'user_groups' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('\n=== GRUPOS DOS USUÁRIOS ===\n');
    const userGroups = groupsResponse.data.user_groups || [];

    if (userGroups.length === 0) {
      console.log('Nenhum usuário vinculado a grupos');
    } else {
      userGroups.forEach(ug => {
        console.log(`User ID: ${ug.user_id} -> Group ID: ${ug.group_id}`);
      });
      console.log(`\nTotal: ${userGroups.length} vínculos`);
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

checkUserGroups();
