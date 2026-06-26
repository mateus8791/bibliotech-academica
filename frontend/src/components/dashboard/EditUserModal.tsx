import { useState, useEffect, useRef } from 'react';
import { useUpdateUser, type User } from '@/lib/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save, KeyRound, Copy, CheckCircle2, ShieldAlert, Upload, Link as LinkIcon } from 'lucide-react';
import { notify } from '@/lib/toast';
import Image from 'next/image';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const { usuario: adminUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo_usuario: 'aluno' as User['tipo_usuario'],
    foto_url: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useFile, setUseFile] = useState(false);
  
  const [novaSenha, setNovaSenha] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateMutation = useUpdateUser();

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        foto_url: user.foto_url || '',
      });
      setNovaSenha(null);
      setCopied(false);
      setSelectedFile(null);
      setPreviewUrl(user.foto_url || null);
      setUseFile(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNovaSenha(pass);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (novaSenha) {
      navigator.clipboard.writeText(novaSenha);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify.success('Senha copiada para a área de transferência');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUseFile(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.email.trim()) {
      notify.error('Preencha todos os campos obrigatórios');
      return;
    }

    let payload: any;
    
    // Se o usuário selecionou um arquivo para upload
    if (useFile && selectedFile) {
      payload = new FormData();
      payload.append('nome', formData.nome);
      payload.append('email', formData.email);
      payload.append('tipo_usuario', formData.tipo_usuario);
      payload.append('file', selectedFile);
      if (novaSenha) payload.append('senha', novaSenha);
    } else {
      // Se está usando apenas URL ou não alterou a foto
      payload = { ...formData };
      if (!useFile) payload.foto_url = formData.foto_url;
      if (novaSenha) payload.senha = novaSenha;
    }

    updateMutation.mutate(
      { id: user.id, data: payload },
      {
        onSuccess: () => {
          notify.success('Usuário atualizado com sucesso!');
          if (novaSenha) {
            notify.success('Nova senha definida. Não esqueça de enviá-la ao usuário.');
          }
          onClose();
        },
        onError: () => {
          notify.error('Erro ao atualizar usuário');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tradicional */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Perfil do Usuário</h2>
            <p className="text-sm text-gray-500 mt-1">
              Atualize as informações de acesso e dados cadastrais.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
                {previewUrl || formData.foto_url ? (
                  <img src={previewUrl || formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-gray-400">
                    {formData.nome.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Foto de Perfil
              </label>
              
              {/* Opções de Foto */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input 
                      type="radio" 
                      name="foto_type" 
                      checked={!useFile} 
                      onChange={() => setUseFile(false)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Usar URL
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input 
                      type="radio" 
                      name="foto_type" 
                      checked={useFile} 
                      onChange={() => setUseFile(true)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Enviar Arquivo
                  </label>
                </div>

                {!useFile ? (
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={formData.foto_url}
                      onChange={(e) => {
                        setFormData({ ...formData, foto_url: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 rounded-lg text-sm transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {selectedFile ? selectedFile.name : 'Selecionar imagem do computador'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 outline-none"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nível de Acesso
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 outline-none bg-white"
                value={formData.tipo_usuario}
                onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value as User['tipo_usuario'] })}
              >
                <option value="aluno">Aluno</option>
                <option value="bibliotecario">Bibliotecário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* Seção de Redefinição de Senha (Apenas Admin) */}
          {adminUser?.tipo_usuario === 'admin' && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-2 bg-white border border-gray-200 rounded-md mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Forçar Redefinição de Senha</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Você pode gerar uma nova senha segura. O usuário será forçado a trocá-la no próximo acesso.
                  </p>
                  
                  {!novaSenha ? (
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Gerar Nova Senha
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-white rounded-md text-sm font-mono text-gray-900 border border-gray-200 select-all">
                        {novaSenha}
                      </code>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                        title="Copiar senha"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all text-sm"
            >
              {updateMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
