const mysql = require('mysql2/promise');

async function checkEmersonStatus() {
  try {
    console.log('🔍 Verificando status completo do Emerson...\n');

    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db'
    });

    // Buscar dados do aluno Emerson
    const [students] = await connection.execute(
      `SELECT
        s.id,
        u.name,
        u.email,
        s.registrationNumber,
        s.membershipStatus,
        s.controlIdUserId,
        s.faceEnrolled,
        s.createdAt
      FROM students s
      INNER JOIN users u ON s.userId = u.id
      WHERE u.name LIKE '%Emerson%'
      LIMIT 1`
    );

    if (students.length === 0) {
      console.log('❌ Emerson não encontrado no banco de dados');
      await connection.end();
      return;
    }

    const student = students[0];

    console.log('👤 DADOS DO ALUNO:');
    console.log('   ID:', student.id);
    console.log('   Nome:', student.name);
    console.log('   Email:', student.email);
    console.log('   Matrícula:', student.registrationNumber);
    console.log('   Status:', student.membershipStatus);
    console.log('   Control ID User ID:', student.controlIdUserId);
    console.log('   Face Enrolled:', student.faceEnrolled);
    console.log('   Criado em:', student.createdAt);
    console.log('');

    // Buscar subscriptions ativas
    const [subscriptions] = await connection.execute(
      `SELECT
        id,
        planId,
        status,
        startDate,
        endDate,
        gymId
      FROM subscriptions
      WHERE studentId = ?
      ORDER BY createdAt DESC`,
      [student.id]
    );

    console.log('📋 SUBSCRIPTIONS (Mensalidades):');
    if (subscriptions.length === 0) {
      console.log('   ❌ NENHUMA SUBSCRIPTION ENCONTRADA!');
      console.log('   ⚠️  Por isso o acesso NÃO deveria estar liberado\n');
    } else {
      subscriptions.forEach((sub, i) => {
        console.log(`   ${i + 1}. ID: ${sub.id}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Plan ID: ${sub.planId}`);
        console.log(`      Start: ${sub.startDate}`);
        console.log(`      End: ${sub.endDate || 'N/A'}`);
        console.log('');
      });

      const activeSubs = subscriptions.filter(s => s.status === 'active');
      if (activeSubs.length > 0) {
        console.log('   ✅ TEM SUBSCRIPTION ATIVA - Acesso PODE ser liberado');
      } else {
        console.log('   ❌ NÃO TEM SUBSCRIPTION ATIVA - Acesso NÃO deve ser liberado');
      }
    }
    console.log('');

    // Verificar Control ID
    console.log('🔐 VERIFICANDO CONTROL ID...\n');

    const axios = require('axios');
    const baseUrl = 'http://192.168.2.142:80';

    try {
      // Login
      const login = await axios.post(
        `${baseUrl}/login.fcgi`,
        { login: 'admin', password: 'admin' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
      );
      const session = login.data.session;

      // Buscar usuário no Control ID
      if (student.controlIdUserId) {
        const userResponse = await axios.post(
          `${baseUrl}/load_objects.fcgi?session=${session}`,
          { object: "users", where: { users: { id: student.controlIdUserId } } },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );

        if (userResponse.data.users && userResponse.data.users.length > 0) {
          const controlUser = userResponse.data.users[0];
          console.log('👤 USUÁRIO NO CONTROL ID:');
          console.log('   ID:', controlUser.id);
          console.log('   Nome:', controlUser.name);
          console.log('   Registration:', controlUser.registration);
          console.log('');
        } else {
          console.log('❌ Usuário não encontrado no Control ID\n');
        }

        // Verificar grupos do usuário
        const groupsResponse = await axios.post(
          `${baseUrl}/load_objects.fcgi?session=${session}`,
          { object: "user_groups", where: { user_groups: { user_id: student.controlIdUserId } } },
          { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
        );

        console.log('👥 GRUPOS DE ACESSO:');
        if (groupsResponse.data.user_groups && groupsResponse.data.user_groups.length > 0) {
          groupsResponse.data.user_groups.forEach(ug => {
            console.log(`   - Group ID: ${ug.group_id}`);
          });
          console.log('   ✅ USUÁRIO ESTÁ EM GRUPOS - Acesso LIBERADO na leitora');
        } else {
          console.log('   ❌ USUÁRIO NÃO ESTÁ EM NENHUM GRUPO - Acesso BLOQUEADO na leitora');
        }
      } else {
        console.log('❌ Emerson não tem controlIdUserId - Não está cadastrado no Control ID');
      }

    } catch (error) {
      console.error('❌ Erro ao verificar Control ID:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log('='.repeat(60));
    console.log(`Status da Matrícula: ${student.membershipStatus}`);
    console.log(`Tem Subscription Ativa: ${subscriptions.some(s => s.status === 'active') ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`Face Cadastrada: ${student.faceEnrolled ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`Control ID User ID: ${student.controlIdUserId || 'N/A'}`);
    console.log('');

    if (subscriptions.some(s => s.status === 'active') && student.membershipStatus === 'active') {
      console.log('✅ CONCLUSÃO: Acesso DEVE estar liberado (tem subscription ativa + status active)');
    } else {
      console.log('❌ CONCLUSÃO: Acesso NÃO deve estar liberado');
      if (!subscriptions.some(s => s.status === 'active')) {
        console.log('   Motivo: Sem subscription ativa');
      }
      if (student.membershipStatus !== 'active') {
        console.log(`   Motivo: Status não é "active" (atual: ${student.membershipStatus})`);
      }
    }
    console.log('='.repeat(60));

    await connection.end();

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkEmersonStatus();
