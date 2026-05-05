// Script para testar decodificação de token JWT
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Cole o token do localStorage aqui
const token = process.argv[2];

if (!token) {
  console.log('❌ Uso: node test-token.js <SEU_TOKEN_AQUI>');
  console.log('\n💡 Para obter o token:');
  console.log('   1. Abra o DevTools (F12)');
  console.log('   2. Vá em Application → Local Storage');
  console.log('   3. Copie o valor da chave "token"');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('\n✅ Token decodificado com sucesso!\n');
  console.log('📦 Payload do token:');
  console.log(JSON.stringify(decoded, null, 2));

  console.log('\n🔍 Verificações:');
  console.log(`   ✓ ID: ${decoded.id}`);
  console.log(`   ✓ Nome: ${decoded.nome}`);
  console.log(`   ✓ Tipo: ${decoded.tipo_usuario || decoded.tipo || '❌ NÃO ENCONTRADO'}`);
  console.log(`   ✓ Foto: ${decoded.foto_url || 'N/A'}`);
  console.log(`   ✓ Access Log ID: ${decoded.accessLogId || 'N/A'}`);

  if (decoded.tipo && !decoded.tipo_usuario) {
    console.log('\n⚠️  PROBLEMA ENCONTRADO!');
    console.log('   O token usa "tipo" mas deveria usar "tipo_usuario"');
    console.log('   Você precisa fazer logout e login novamente!');
  } else if (decoded.tipo_usuario) {
    console.log('\n✅ Token correto! Usa "tipo_usuario"');
  }

  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro ao decodificar token:', error.message);
  process.exit(1);
}
