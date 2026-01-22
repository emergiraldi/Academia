import axios from 'axios';

async function cleanup() {
  try {
    // Login
    const loginResponse = await axios.post('http://192.168.2.142/login.fcgi', {
      login: 'admin',
      password: 'admin'
    });

    const session = loginResponse.data.session;
    console.log('✅ Conectado ao Control ID\n');

    // 1. Deletar o usuário órfão ID 1 ("Funcionário")
    console.log('🗑️  Deletando usuário órfão ID 1 (Funcionário)...');
    try {
      await axios.post(
        `http://192.168.2.142/destroy_objects.fcgi?session=${session}`,
        {
          object: 'users',
          where: { users: { id: 1 } }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('   ✅ Usuário ID 1 deletado\n');
    } catch (err) {
      console.log('   ⚠️  Erro ao deletar:', err.response?.data || err.message);
    }

    // 2. Remover User ID 2 do Grupo 1 (já que está inativo)
    console.log('🔒 Removendo User ID 2 do Grupo 1...');
    try {
      await axios.post(
        `http://192.168.2.142/destroy_objects.fcgi?session=${session}`,
        {
          object: 'user_groups',
          where: {
            user_groups: {
              user_id: 2,
              group_id: 1
            }
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('   ✅ Acesso bloqueado (removido do grupo)\n');
    } catch (err) {
      console.log('   ⚠️  Erro ao remover do grupo:', err.response?.data || err.message);
    }

    // 3. Verificar estado final
    console.log('📋 Estado final:');
    const usersResponse = await axios.post(
      `http://192.168.2.142/load_objects.fcgi?session=${session}`,
      { object: 'users' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const users = usersResponse.data.users || [];
    console.log(`   Usuários: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ID ${u.id}: ${u.name} (${u.registration})`);
    });

    const groupsResponse = await axios.post(
      `http://192.168.2.142/load_objects.fcgi?session=${session}`,
      { object: 'user_groups' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const userGroups = groupsResponse.data.user_groups || [];
    console.log(`\n   Vínculos grupo-usuário: ${userGroups.length}`);
    userGroups.forEach(ug => {
      console.log(`   - User ${ug.user_id} -> Group ${ug.group_id}`);
    });

    // Logout
    await axios.post(`http://192.168.2.142/logout.fcgi?session=${session}`);
    console.log('\n✅ Limpeza concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

cleanup();
