/**
 * Script para identificar qual usuário está causando os erros 403
 * Execute este script e depois verifique o localStorage do navegador
 */

const jwt = require('jsonwebtoken');
const pool = require('../src/config/database');

async function verificarUsuario() {
  console.log('\n========================================');
  console.log('VERIFICAÇÃO DE USUÁRIO');
  console.log('========================================\n');

  console.log('📋 INSTRUÇÕES:');
  console.log('1. Abra o DevTools do navegador (F12)');
  console.log('2. Vá para a aba "Console"');
  console.log('3. Execute o seguinte comando:\n');
  console.log('   localStorage.getItem("bibliotech_token")\n');
  console.log('4. Copie o token (sem as aspas) e cole abaixo quando solicitado\n');
  console.log('========================================\n');

  // Para fins de teste, vamos verificar todos os usuários e suas permissões
  console.log('📊 USUÁRIOS E PERMISSÕES RESUMIDAS:\n');

  const query = `
    SELECT
      u.id,
      u.email,
      u.tipo_usuario,
      r.nome AS role_nome,
      COUNT(DISTINCT p.id) AS total_permissoes,
      BOOL_OR(p.code = 'can_view_dashboard') AS pode_ver_dashboard,
      BOOL_OR(p.code = 'can_view_users') AS pode_ver_usuarios,
      BOOL_OR(p.code = 'can_manage_roles') AS pode_gerenciar_roles
    FROM usuario u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE r.ativo = TRUE
    GROUP BY u.id, u.email, u.tipo_usuario, r.nome
    ORDER BY u.email;
  `;

  const result = await pool.query(query);

  console.log('Email                      | Tipo          | Role                   | Dashboard | Usuários | Roles');
  console.log('='.repeat(100));

  result.rows.forEach(row => {
    const dashboard = row.pode_ver_dashboard ? '✅' : '❌';
    const usuarios = row.pode_ver_usuarios ? '✅' : '❌';
    const roles = row.pode_gerenciar_roles ? '✅' : '❌';

    console.log(
      `${row.email.padEnd(25)} | ${row.tipo_usuario.padEnd(13)} | ${(row.role_nome || 'N/A').padEnd(21)} | ${dashboard}       | ${usuarios}      | ${roles}`
    );
  });

  console.log('\n========================================');
  console.log('LEGENDA:');
  console.log('Dashboard = Pode acessar /admin/dashboard');
  console.log('Usuários  = Pode ver lista de usuários');
  console.log('Roles     = Pode gerenciar permissões');
  console.log('========================================\n');

  console.log('\n💡 SOLUÇÃO:');
  console.log('Se você está logado com um usuário que tem ❌ nas colunas acima,');
  console.log('você precisa fazer logout e login novamente com um usuário admin.\n');
  console.log('Usuários com acesso admin completo:');

  const admins = result.rows.filter(row =>
    row.pode_ver_dashboard &&
    row.pode_ver_usuarios &&
    row.pode_gerenciar_roles
  );

  if (admins.length > 0) {
    admins.forEach(admin => {
      console.log(`  ✅ ${admin.email} (${admin.role_nome})`);
    });
  } else {
    console.log('  ⚠️  NENHUM USUÁRIO COM ACESSO COMPLETO ENCONTRADO!');
  }

  console.log('\n========================================\n');

  await pool.end();
}

verificarUsuario()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
