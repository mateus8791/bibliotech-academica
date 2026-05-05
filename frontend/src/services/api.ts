// Arquivo: frontend/src/services/api.ts

import axios from 'axios';

// 1. Cria uma instância do axios com a URL base da nossa API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Cria o Interceptor de Requisição
// Esta função será executada ANTES de cada requisição ser enviada
api.interceptors.request.use(
  (config) => {
    // Pega o token que guardamos no localStorage do navegador
    const token = localStorage.getItem('bibliotech_token');

    // Se o token existir, adiciona ele no cabeçalho 'Authorization'
    // no formato que o nosso backend espera ("Bearer <token>")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Retorna a configuração da requisição, agora com o token
  },
  (error) => {
    // Caso ocorra um erro na configuração da requisição
    return Promise.reject(error);
  }
);

// 3. Interceptor de Resposta para tratar erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Lista de endpoints que não devem logar erros no console
    // (são tratados silenciosamente pelo código que os chama)
    const silentEndpoints = ['/session/heartbeat', '/categorias/publico'];
    const isSilentEndpoint = silentEndpoints.some(endpoint =>
      error.config?.url?.includes(endpoint)
    );

    // Tratamento melhorado de erros
    const errorDetails = {
      message: error.message || 'Erro desconhecido',
      url: error.config?.url || 'URL não disponível',
      method: error.config?.method?.toUpperCase() || 'MÉTODO não disponível',
      timestamp: new Date().toISOString(),
    };

    // Apenas loga erros se não for um endpoint silencioso
    // OU se for um erro crítico (não-403 para endpoints silenciosos)
    const shouldLog = !isSilentEndpoint || (error.response?.status !== 403);

    if (shouldLog) {
      // Se houver resposta do servidor
      if (error.response) {
        // Log melhorado com informações separadas para melhor visualização
        console.group('🔴 Erro na API [Resposta do Servidor]');
        console.error('URL:', errorDetails.url);
        console.error('Method:', errorDetails.method);
        console.error('Status:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Error Message:', errorDetails.message);
        console.error('Timestamp:', errorDetails.timestamp);

        console.group('🔐 Detalhes de Autenticação');
        console.log('Token presente:', !!localStorage.getItem('bibliotech_token'));
        console.log('Auth Header:', error.config?.headers?.Authorization ? 'Present' : 'Missing');
        console.log('Base URL:', error.config?.baseURL);
        console.groupEnd();

        console.groupEnd();
      }
      // Se a requisição foi feita mas não houve resposta (timeout, rede)
      else if (error.request) {
        console.error('Erro na API [Rede/Timeout]:', {
          ...errorDetails,
          detalhes: 'Nenhuma resposta recebida do servidor. Verifique sua conexão ou se o backend está rodando.',
        });
        console.debug('Request details:', error.request);
      }
      // Erro na configuração da requisição
      else {
        console.error('Erro na API [Configuração]:', {
          ...errorDetails,
          detalhes: 'Erro ao configurar a requisição',
        });
        console.debug('Erro completo:', error);
      }
    }

    // Se o token expirou ou é inválido (401)
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;

      if (errorCode === 'TOKEN_OUTDATED') {
        console.warn('Token desatualizado detectado. Fazendo logout automático...');
      } else {
        console.warn('Token inválido ou expirado. Limpando autenticação...');
      }

      localStorage.removeItem('bibliotech_token');
      localStorage.removeItem('bibliotech_usuario');
      delete api.defaults.headers.common['Authorization'];

      // Redireciona para login se não estiver na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/auth/login';
      }
    }

    // Se há erro de permissão (403 Forbidden)
    // Isso pode indicar que o token é de outro usuário/perfil
    if (error.response?.status === 403 && !isSilentEndpoint) {
      console.warn('Acesso negado (403). Verificando consistência da autenticação...');

      // Se já está em uma página de admin/permissões e recebe 403,
      // provavelmente é um problema de permissões do usuário atual
      // Apenas loga o erro, mas não force logout aqui para evitar loops
      console.error('Usuário não tem permissão para acessar este recurso');
    }

    return Promise.reject(error);
  }
);

export default api;