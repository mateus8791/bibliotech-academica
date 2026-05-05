/**
 * Script para listar usuários admin e suas senhas (apenas para desenvolvimento)
 */

const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function listarAdmins() {
  try {
    console.log('\n========================================');
    console.log('USUÁRIOS ADMINISTRATIVOS');
    console.log('========================================\n');

    const query = `
      SELECT
        u.id,
        u.nome,
        u.email,
        u.tipo_usuario,
        u.senha_hash,
        r.nome AS role_nome
      FROM usuario u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.tipo_usuario IN ('admin', 'bibliotecario')
      ORDER BY u.tipo_usuario DESC, u.email;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('⚠️  Nenhum usuário admin encontrado!\n');
      return;
    }

    console.log('Usuários com permissões administrativas:\n');

    for (const user of result.rows) {
      console.log('='.repeat(60));
      console.log(`Email:     ${user.email}`);
      console.log(`Nome:      ${user.nome}`);
      console.log(`Tipo:      ${user.tipo_usuario}`);
      console.log(`Role:      ${user.role_nome}`);

      // Verificar senhas comuns
      const senhasComuns = ['admin123', 'senha123', '123456', 'bibliotech123', 'admin'];
      let senhaEncontrada = null;

      for (const senha of senhasComuns) {
        const match = await bcrypt.compare(senha, user.senha_hash);
        if (match) {
          senhaEncontrada = senha;
          break;
        }
      }

      if (senhaEncontrada) {
        console.log(`Senha:     ${senhaEncontrada} ✅`);
      } else {
        console.log(`Senha:     [senha personalizada - não encontrada nas senhas comuns]`);
      }
      console.log('='.repeat(60));
      console.log('');
    }

    console.log('\n💡 DICA: Se a senha não foi encontrada, você pode resetá-la');
    console.log('executando o script reset-senha-admin.js\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

listarAdmins();
