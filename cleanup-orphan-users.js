import axios from 'axios';
import mysql from 'mysql2/promise';

async function cleanupOrphanUsers() {
  let connection;

  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db'
    });

    // 1. Login na leitora
    console.log('\n🔑 Conectando à leitora Control ID...');
    const loginResponse = await axios.post('http://192.168.2.142/login.fcgi', {
      login: 'admin',
      password: 'admin'
    });

    const session = loginResponse.data.session;
    console.log('✅ Conectado à leitora\n');

    // 2. Listar todos os usuários na leitora
    const usersResponse = await axios.post(
      `http://192.168.2.142/load_objects.fcgi?session=${session}`,
      { object: 'users' },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const readerUsers = usersResponse.data.users || [];
    console.log(`📊 Total de usuários na leitora: ${readerUsers.length}\n`);

    if (readerUsers.length === 0) {
      console.log('✅ Leitora já está limpa!');
      await axios.post(`http://192.168.2.142/logout.fcgi?session=${session}`);
      return;
    }

    // 3. Buscar todos os controlIdUserId válidos do banco (gymId = 1)
    const [students] = await connection.query(
      'SELECT controlIdUserId FROM students WHERE gymId = 1 AND controlIdUserId IS NOT NULL'
    );

    const [staff] = await connection.query(
      'SELECT controlIdUserId FROM staff WHERE gymId = 1 AND controlIdUserId IS NOT NULL'
    );

    const validIds = new Set([
      ...students.map(s => s.controlIdUserId),
      ...staff.map(s => s.controlIdUserId)
    ]);

    console.log(`✅ IDs válidos no banco: ${validIds.size}`);
    if (validIds.size > 0) {
      console.log(`   ${Array.from(validIds).join(', ')}\n`);
    }

    // 4. Identificar e deletar usuários órfãos
    let deleted = 0;
    let errors = 0;

    for (const user of readerUsers) {
      if (!validIds.has(user.id)) {
        // Usuário órfão - deletar
        console.log(`🗑️  Deletando usuário órfão ID ${user.id}: ${user.name} (${user.registration})`);

        try {
          await axios.post(
            `http://192.168.2.142/destroy_objects.fcgi?session=${session}`,
            {
              object: 'users',
              where: { users: { id: user.id } }
            },
            { headers: { 'Content-Type': 'application/json' } }
          );
          console.log(`   ✅ Deletado com sucesso\n`);
          deleted++;
        } catch (error) {
          console.log(`   ❌ Erro ao deletar:`, error.response?.data || error.message);
          errors++;
        }
      } else {
        console.log(`✓ ID ${user.id}: ${user.name} - válido (mantido)\n`);
      }
    }

    // 5. Logout
    await axios.post(`http://192.168.2.142/logout.fcgi?session=${session}`);

    // 6. Resumo
    console.log('\n========================================');
    console.log('           RESUMO DA LIMPEZA');
    console.log('========================================');
    console.log(`Usuários na leitora: ${readerUsers.length}`);
    console.log(`IDs válidos no banco: ${validIds.size}`);
    console.log(`Órfãos deletados: ${deleted}`);
    console.log(`Erros: ${errors}`);
    console.log('========================================\n');

    if (deleted > 0) {
      console.log('✅ Limpeza concluída com sucesso!');
    } else {
      console.log('ℹ️  Nenhum usuário órfão encontrado');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupOrphanUsers();
