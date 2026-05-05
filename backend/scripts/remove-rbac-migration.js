// Script para executar a migration de remoção do sistema RBAC
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function removeRBAC() {
  console.log('🚀 Iniciando remoção do sistema RBAC...\n');

  const migrationFile = '004_remove_rbac_system.sql';
  const filePath = path.join(__dirname, '../migrations', migrationFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Migration ${migrationFile} não encontrada!`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`📝 Executando migration: ${migrationFile}`);
  console.log('⚠️  Esta migration irá:');
  console.log('   - Migrar usuários de roles para tipo_usuario');
  console.log('   - Remover tabelas: permissions, roles, role_permissions');
  console.log('   - Remover colunas relacionadas a RBAC da tabela usuario');
  console.log('');

  try {
    await pool.query(sql);
    console.log(`✅ Migration ${migrationFile} executada com sucesso!\n`);
    console.log('🎉 Sistema RBAC removido com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Reinicie o servidor backend');
    console.log('   2. Faça logout e login novamente no frontend');
    console.log('   3. O sistema agora usa apenas tipo_usuario (admin, bibliotecario, aluno)');
  } catch (error) {
    console.error(`❌ Erro ao executar migration ${migrationFile}:`, error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }

  process.exit(0);
}

removeRBAC();
