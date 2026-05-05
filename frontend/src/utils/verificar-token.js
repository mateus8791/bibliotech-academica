/**
 * Script para verificar e decodificar o token JWT armazenado
 * Execute no console do navegador
 */

function verificarToken() {
  const token = localStorage.getItem('bibliotech_token');

  if (!token) {
    console.error('❌ Nenhum token encontrado no localStorage!');
    return;
  }

  console.log('✅ Token encontrado:', token.substring(0, 50) + '...');

  // Decodificar o JWT (parte do payload)
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Token inválido! Não possui 3 partes.');
      return;
    }

    const payload = JSON.parse(atob(parts[1]));

    console.log('\n📋 DADOS DO TOKEN:');
    console.log('=====================================');
    console.log('ID:', payload.id);
    console.log('Email:', payload.email);
    console.log('Tipo:', payload.tipo);
    console.log('Nome:', payload.nome);
    console.log('Foto URL:', payload.foto_url);
    console.log('Access Level:', payload.accessLevel);
    console.log('Access Log ID:', payload.accessLogId);

    // Verificar expiração
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = expDate < now;

      console.log('\n⏰ EXPIRAÇÃO:');
      console.log('Expira em:', expDate.toLocaleString());
      console.log('Status:', isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO');

      if (!isExpired) {
        const hoursLeft = (expDate - now) / (1000 * 60 * 60);
        console.log(`Tempo restante: ${hoursLeft.toFixed(2)} horas`);
      }
    }

    console.log('=====================================\n');

    // Verificar localStorage
    const usuario = localStorage.getItem('bibliotech_usuario');
    if (usuario) {
      console.log('👤 DADOS DO USUÁRIO (localStorage):');
      console.log(JSON.parse(usuario));
    }

  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error);
  }
}

// Auto-executar se estiver no navegador
if (typeof window !== 'undefined') {
  verificarToken();
}

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
  module.exports = verificarToken;
}
