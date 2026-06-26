// Arquivo: frontend/src/components/ConfirmDeleteModal.tsx
'use client';

import { useState } from 'react';
import { X, AlertTriangle, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: ConfirmDeleteModalProps) {
  const { usuario } = useAuth();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setSenha('');
    setErro('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!senha) {
      setErro('Por favor, informe sua senha para continuar.');
      return;
    }

    if (!usuario?.email) {
      setErro('Erro: Usuário não identificado.');
      return;
    }

    setVerificando(true);
    setErro('');

    try {
      // Verifica a senha simulando um login rápido
      await api.post('/auth/login', { email: usuario.email, senha });
      
      // Se a requisição não der erro, a senha está correta
      setSenha('');
      onConfirm();
    } catch (error: any) {
      setErro('Senha incorreta. Ação não autorizada.');
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Exclusão */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertTriangle size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h2>
            </div>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6">
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Você está prestes a excluir {itemName ? <span className="font-semibold text-red-600">"{itemName}"</span> : 'este item'}. 
                <br className="mb-2"/>
                Esta ação <span className="font-semibold text-gray-800">não poderá ser desfeita</span> e os dados serão removidos permanentemente.
            </p>

            {/* Campo de Senha de Segurança */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <KeyRound size={16} className="text-gray-400" />
                    Autenticação de Segurança
                </label>
                <p className="text-xs text-gray-500 mb-2">Para sua segurança, informe sua senha de acesso para confirmar a exclusão.</p>
                <input 
                    type="password" 
                    value={senha} 
                    onChange={(e) => setSenha(e.target.value)} 
                    placeholder="Sua senha..."
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none text-sm transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirm();
                        }
                    }}
                />
                {erro && <p className="text-xs text-red-600 font-medium mt-2">{erro}</p>}
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button 
                type="button" 
                onClick={handleClose}
                disabled={verificando}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button 
                type="button" 
                onClick={handleConfirm}
                disabled={verificando || !senha}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 focus:ring-4 focus:ring-red-500/20 disabled:bg-gray-300 disabled:shadow-none transition-all"
            >
                {verificando ? (
                    <><Loader2 size={16} className="animate-spin" /> Verificando...</>
                ) : (
                    <><Trash2 size={16} /> Excluir Permanentemente</>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}