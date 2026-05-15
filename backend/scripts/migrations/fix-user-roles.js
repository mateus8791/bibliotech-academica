/**
 * =====================================================
 * SCRIPT: Corrigir Roles dos Usuários
 * =====================================================
 * Verifica se todos os usuários têm role_id atribuído
 * e atribui roles baseadas no tipo_usuario
 *
 * Autor: Claude Code
 * Data: 2025-11-11
 * =====================================================
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixUserRoles() {
  const client = await pool.connect();

  try {
    console.log('🔧 Iniciando correção de roles dos usuários...\n');

    await client.query('BEGIN');

    // 1. Verificar usuários sem role_id
    console.log('🔍 Buscando usuários sem role_id...\n');
    const usersWithoutRole = await client.query(`
      SELECT id, nome, email, tipo_usuario
      FROM usuario
      WHERE role_id IS NULL
    `);

    if (usersWithoutRole.rows.length === 0) {
      console.log('✅ Todos os usuários já têm role_id atribuído!\n');

      // Mostrar todos os usuários e suas roles
      console.log('📋 Lista de usuários e suas roles:\n');
      const allUsers = await client.query(`
        SELECT u.id, u.nome, u.email, u.tipo_usuario, r.nome AS role_nome
        FROM usuario u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.nome
      `);

      for (const user of allUsers.rows) {
        const roleStatus = user.role_nome ? `✅ ${user.role_nome}` : '❌ SEM ROLE';
        console.log(`  ${user.nome} (${user.email})`);
        console.log(`    Tipo: ${user.tipo_usuario} | Role: ${roleStatus}\n`);
      }

      await client.query('COMMIT');
      return;
    }

    console.log(`⚠️  Encontrados ${usersWithoutRole.rows.length} usuários sem role_id:\n`);

    // 2. Atribuir roles baseadas no tipo_usuario
    for (const user of usersWithoutRole.rows) {
      let roleName = 'Aluno'; // Padrão

      if (user.tipo_usuario === 'admin') {
        roleName = 'SuperAdmin';
      } else if (user.tipo_usuario === 'bibliotecario') {
        roleName = 'Bibliotecário Sênior';
      }

      // Buscar o ID da role
      const roleResult = await client.query(`
        SELECT id FROM roles WHERE nome = $1
      `, [roleName]);

      if (roleResult.rows.length === 0) {
        console.log(`  ❌ ${user.nome}: Role '${roleName}' não encontrada no banco!`);
        continue;
      }

      const roleId = roleResult.rows[0].id;

      // Atualizar o usuário
      await client.query(`
        UPDATE usuario
        SET role_id = $1
        WHERE id = $2
      `, [roleId, user.id]);

      console.log(`  ✅ ${user.nome} (${user.email})`);
      console.log(`     Tipo: ${user.tipo_usuario} → Role: ${roleName}\n`);
    }

    await client.query('COMMIT');
    console.log('✅ Correção concluída com sucesso!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao corrigir roles:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar o script
fixUserRoles()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
