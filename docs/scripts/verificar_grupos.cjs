const axios = require('axios');

const baseUrl = 'http://192.168.2.142:80';

async function verificarGrupos() {
  try {
    const login = await axios.post(
      `${baseUrl}/login.fcgi`,
      { login: 'admin', password: 'admin' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const session = login.data.session;

    const groups = await axios.post(
      `${baseUrl}/load_objects.fcgi?session=${session}`,
      { object: 'groups' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('📋 Grupos na Control ID:\n');
    groups.data.groups.forEach(g => {
      console.log(`  Grupo ID ${g.id}: ${g.name}`);
      console.log(`    Usuários no grupo:`, g.users || []);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarGrupos();
