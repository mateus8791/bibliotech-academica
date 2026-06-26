'use client';

import { useState, useEffect } from 'react';
import { 
  Puzzle, 
  ExternalLink, 
  History,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';

// Mapeamento de informações visuais estáticas para cada provedor
const providerDetails: Record<string, any> = {
  openai: {
    name: 'OpenAI',
    category: 'Inteligência Artificial',
    description: 'Utilizado para geração de resumos, recomendações e análises inteligentes de livros.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg', // logo openai svg genérico
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    features: ['Resumos', 'Recomendações', 'Análises']
  },
  gemini: {
    name: 'Google Gemini',
    category: 'Inteligência Artificial',
    description: 'Modelo multimodal do Google para geração de conteúdo e insights.',
    iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-gemini-icon.png', 
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    features: ['Geração de conteúdo', 'Análise']
  },
  claude: {
    name: 'Anthropic Claude',
    category: 'Inteligência Artificial',
    description: 'Utilizado para análises profundas e geração de conteúdo especializado.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Anthropic_logo.svg/512px-Anthropic_logo.svg.png',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    features: ['Análise profunda', 'Conteúdo especializado']
  },
  google_books: {
    name: 'Google Books',
    category: 'Catálogo e Conteúdo',
    description: 'Consulta ao catálogo do Google Books para buscar informações bibliográficas.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Google_Play_Books_icon_%282016%29.svg',
    models: [],
    features: ['Buscar livros', 'Informações detalhadas', 'Capas']
  },
  sendgrid: {
    name: 'SendGrid',
    category: 'Comunicação',
    description: 'Envio de emails transacionais para usuários da biblioteca.',
    iconUrl: 'https://ui-avatars.com/api/?name=SG&background=0D6EFD&color=fff&rounded=true',
    models: [],
    features: ['Emails de notificação', 'Recuperação de senha', 'Confirmação de reservas']
  },
  google_analytics: {
    name: 'Google Analytics 4',
    category: 'Analytics',
    description: 'Acompanhe o uso da plataforma e o comportamento dos usuários.',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Google_Analytics_icon_%282015%29.svg',
    models: [],
    features: ['Eventos personalizados', 'Conversões', 'Relatórios']
  }
};

interface Integration {
  id: number;
  provider: string;
  model: string;
  enabled: boolean;
  api_key_encrypted: string;
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todas');

  // Controle de formulário para edição local nos cards
  const [editingData, setEditingData] = useState<Record<number, Partial<Integration>>>({});
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [testing, setTesting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/integrations');
      setIntegrations(data);
    } catch (error) {
      console.error('Erro ao buscar integrações', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['Todas', 'Inteligência Artificial', 'Catálogo e Conteúdo', 'Comunicação', 'Analytics'];

  const filteredIntegrations = integrations.filter(int => {
    if (activeTab === 'Todas') return true;
    const cat = providerDetails[int.provider]?.category;
    return cat === activeTab;
  });

  const handleFieldChange = (id: number, field: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = async (integration: Integration) => {
    const edits = editingData[integration.id];
    if (!edits) return; // Nenhuma alteração

    try {
      // Se tiver mudado, salva.
      const payload = {
        model: edits.model !== undefined ? edits.model : integration.model,
        enabled: edits.enabled !== undefined ? edits.enabled : integration.enabled,
        api_key_encrypted: edits.api_key_encrypted !== undefined ? edits.api_key_encrypted : undefined,
      };

      const { data } = await api.put(`/integrations/${integration.id}`, payload);
      
      setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, ...data, api_key_encrypted: payload.api_key_encrypted || i.api_key_encrypted } : i));
      
      // Limpa edições locais exceto se a chave foi setada (para manter visível no front se quiser)
      alert('Integração atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar', error);
      alert('Erro ao atualizar a integração.');
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      setTesting(prev => ({ ...prev, [id]: true }));
      const { data } = await api.post(`/integrations/${id}/test`);
      alert(data.mensagem || 'Conexão bem-sucedida!');
    } catch (error: any) {
      alert(error.response?.data?.mensagem || 'Falha ao conectar. Verifique sua chave de API.');
    } finally {
      setTesting(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Puzzle className="w-8 h-8 text-blue-600" />
            Integrações
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Conecte serviços e APIs para ampliar os recursos da sua biblioteca.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Documentação
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            <History className="w-4 h-4" />
            Histórico de uso
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards de Integrações */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(integration => {
            const details = providerDetails[integration.provider] || { name: integration.provider, category: 'Geral', description: '', models: [], features: [] };
            const isEditing = editingData[integration.id] !== undefined;
            const currentModel = isEditing && editingData[integration.id].model !== undefined ? editingData[integration.id].model : integration.model;
            const currentKey = isEditing && editingData[integration.id].api_key_encrypted !== undefined ? editingData[integration.id].api_key_encrypted : integration.api_key_encrypted || '';
            const isEnabled = isEditing && editingData[integration.id].enabled !== undefined ? editingData[integration.id].enabled : integration.enabled;

            return (
              <div key={integration.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2 flex-shrink-0 border border-gray-100 dark:border-gray-700">
                      {details.iconUrl ? (
                        <img src={details.iconUrl} alt={details.name} className="w-full h-full object-contain" />
                      ) : (
                        <Puzzle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{details.name}</h3>
                      <span className="text-xs text-gray-500">{details.category}</span>
                    </div>
                  </div>
                  
                  {/* Status Toggle */}
                  <button 
                    onClick={() => handleFieldChange(integration.id, 'enabled', !isEnabled)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isEnabled 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                  >
                    {isEnabled ? (
                      <><CheckCircle2 className="w-3 h-3" /> Ativa</>
                    ) : (
                      <><AlertCircle className="w-3 h-3" /> Inativo</>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                  {details.description}
                </p>

                {/* Campos do Formulário */}
                <div className="space-y-4 mb-6">
                  {details.models.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                      <select 
                        value={currentModel}
                        onChange={(e) => handleFieldChange(integration.id, 'model', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      >
                        <option value="">Selecione um modelo</option>
                        {details.models.map((m: string) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {integration.provider === 'google_analytics' ? 'ID de Medição' : 'Chave da API'}
                    </label>
                    <div className="relative">
                      <input 
                        type={showKey[integration.id] || integration.provider === 'google_analytics' ? 'text' : 'password'}
                        value={currentKey}
                        onChange={(e) => handleFieldChange(integration.id, 'api_key_encrypted', e.target.value)}
                        placeholder="••••••••••••••••••••••••••••"
                        className="w-full text-sm pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                      {integration.provider !== 'google_analytics' && (
                        <button 
                          onClick={() => setShowKey(prev => ({ ...prev, [integration.id]: !prev[integration.id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showKey[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recursos Habilitados */}
                  {details.features.length > 0 && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Recursos habilitados</label>
                      <div className="flex flex-wrap gap-2">
                        {details.features.map((feat: string) => (
                          <span key={feat} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] rounded-full border border-gray-200 dark:border-gray-700 font-medium">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={() => handleSave(integration)}
                    disabled={!isEditing}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isEditing 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    Salvar configuração
                  </button>
                  {isEnabled && integration.api_key_encrypted && (
                    <button 
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={testing[integration.id]}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                    >
                      {testing[integration.id] ? 'Testando...' : 'Testar conexão'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alerta de Segurança */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-5 flex items-start gap-4">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-1">Sobre as integrações</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80">
            As integrações permitem que sua biblioteca utilize serviços externos para oferecer recursos avançados. 
            Suas chaves de API são criptografadas e armazenadas com segurança no banco de dados. Nunca compartilhe suas credenciais.
          </p>
        </div>
      </div>
    </div>
  );
}
