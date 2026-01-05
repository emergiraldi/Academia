const mysql = require('mysql2/promise');

async function setupControlIdDevice() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('🔧 Configurando leitora facial Control ID...\n');

    // Buscar ID da academia (vamos pegar a primeira academia cadastrada)
    const [gyms] = await conn.execute('SELECT id, name FROM gyms LIMIT 1');

    if (gyms.length === 0) {
      console.error('❌ Nenhuma academia encontrada no banco!');
      console.log('Execute primeiro: node create_gym.js');
      return;
    }

    const gym = gyms[0];
    console.log(`✅ Academia encontrada: ${gym.name} (ID: ${gym.id})\n`);

    // Verificar se já existe um dispositivo com esse IP
    const [existing] = await conn.execute(
      'SELECT * FROM control_id_devices WHERE ipAddress = ?',
      ['192.168.2.142']
    );

    if (existing.length > 0) {
      console.log('⚠️  Dispositivo já cadastrado! Atualizando...\n');
      await conn.execute(
        `UPDATE control_id_devices
         SET active = TRUE, updatedAt = CURRENT_TIMESTAMP
         WHERE ipAddress = ?`,
        ['192.168.2.142']
      );
      console.log('✅ Dispositivo atualizado e ativado!');
    } else {
      // Cadastrar novo dispositivo
      await conn.execute(
        `INSERT INTO control_id_devices
         (gymId, name, ipAddress, port, username, password, location, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          gym.id,
          'Leitora Facial Principal',
          '192.168.2.142',
          80,
          'admin',
          'admin',
          'Entrada Principal'
        ]
      );
      console.log('✅ Dispositivo cadastrado com sucesso!');
    }

    // Exibir dispositivos cadastrados
    console.log('\n📋 DISPOSITIVOS CONTROL ID CADASTRADOS:\n');
    const [devices] = await conn.execute(
      `SELECT id, name, ipAddress, port, location, active
       FROM control_id_devices
       WHERE gymId = ?`,
      [gym.id]
    );

    devices.forEach(device => {
      const status = device.active ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`  ${status} - ${device.name}`);
      console.log(`     IP: ${device.ipAddress}:${device.port}`);
      console.log(`     Local: ${device.location}`);
      console.log('');
    });

    console.log('✅ Configuração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Testar conexão: node test_controlid.cjs');
    console.log('   2. Sistema já vai usar automaticamente essa leitora!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

setupControlIdDevice();
