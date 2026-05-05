// Arquivo: frontend/src/app/aluno/minhas-reservas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import {
  LoaderCircle,
  Trash2,
  Calendar,
  AlertTriangle,
  BookMarked,
  Clock,
  CheckCircle2,
  Users,
  LayoutList,
  LayoutGrid,
  History as HistoryIcon
} from 'lucide-react';
import Image from 'next/image';
import CancelModal from '@/components/CancelModal';

// Interface baseada na tabela 'reserva' do banco de dados
interface Reserva {
  id: number;
  usuario_id: number;
  livro_id: number;
  data_reserva: string;
  data_expiracao: string;
  status: 'aguardando' | 'disponivel' | 'cancelado' | 'concluido' | 'expirado';
  posicao_fila: null; // Campo não existe na tabela 'reserva'
  notificado: boolean;
  // Dados do livro (join)
  livro: {
    id: number;
    titulo: string;
    capa_url: string | null;
    autores: string; // Nome dos autores concatenados
  };
}

type ViewMode = 'lista' | 'quadro' | 'historico';

export default function MinhasReservasPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  // Estados para o modal de cancelamento
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState<Reserva | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca as reservas da API
  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/reservas/minhas');
      setReservas(response.data);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      setErro('Não foi possível carregar suas reservas.');
    } finally {
      setCarregando(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleOpenCancelModal = (reserva: Reserva) => {
    setReservaToCancel(reserva);
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setReservaToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!reservaToCancel) return;
    setIsSubmitting(true);
    try {
      await api.put(`/reservas/${reservaToCancel.id}/cancelar`);
      setReservas(prev => prev.filter(r => r.id !== reservaToCancel.id));
      handleCloseCancelModal();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      alert('Falha ao cancelar a reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNovoLivro = () => {
    router.push('/catalogo');
  };

  // Filtra reservas por status
  const reservasProntas = reservas.filter(r => r.status === 'disponivel');
  const reservasAguardando = reservas.filter(r => r.status === 'aguardando');
  const reservasHistorico = reservas.filter(r =>
    r.status === 'concluido' || r.status === 'expirado' || r.status === 'cancelado'
  );

  // Renderiza a linha de cada reserva na vista Lista
  const ReservaRow = ({ reserva }: { reserva: Reserva }) => {
    const isPronta = reserva.status === 'disponivel';

    return (
      <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <div className="grid grid-cols-12 gap-4 p-4 items-center">
          {/* Coluna: Livro (com capa) */}
          <div className="col-span-4 flex items-center gap-3">
            <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden shadow-sm">
              <Image
                src={reserva.livro.capa_url || '/covers/placeholder-icon.png'}
                alt={reserva.livro.titulo}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm truncate">{reserva.livro.titulo}</h4>
              <p className="text-xs text-gray-500 truncate">{reserva.livro.autores}</p>
            </div>
          </div>

          {/* Coluna: Data da Reserva */}
          <div className="col-span-2 text-sm text-gray-600">
            {formatDate(reserva.data_reserva)}
          </div>

          {/* Coluna: Retirar Até */}
          <div className="col-span-2 text-sm">
            {isPronta ? (
              <span className="font-semibold text-green-700">{formatDate(reserva.data_expiracao)}</span>
            ) : (
              <span className="text-gray-400">N/A</span>
            )}
          </div>

          {/* Coluna: Sua Posição */}
          <div className="col-span-2 text-sm">
            {isPronta ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                <CheckCircle2 size={14} /> Pronto!
              </span>
            ) : (
              <span className="text-gray-600 text-xs italic">Aguardando</span>
            )}
          </div>

          {/* Coluna: Status */}
          <div className="col-span-1">
            {isPronta ? (
              <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-md text-xs font-semibold">
                Pronto
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-orange-400 text-white rounded-md text-xs font-semibold">
                Em Fila
              </span>
            )}
          </div>

          {/* Coluna: Ações */}
          <div className="col-span-1 flex justify-end">
            <button
              onClick={() => handleOpenCancelModal(reserva)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Cancelar Reserva"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderiza card para vista Quadro (Kanban)
  const ReservaCard = ({ reserva }: { reserva: Reserva }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3 mb-3">
        <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden">
          <Image
            src={reserva.livro.capa_url || '/covers/placeholder-icon.png'}
            alt={reserva.livro.titulo}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{reserva.livro.titulo}</h4>
          <p className="text-xs text-gray-500 line-clamp-1">{reserva.livro.autores}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>Reservado em: {formatDate(reserva.data_reserva)}</span>
        </div>
        {reserva.status === 'disponivel' && (
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 size={14} />
            <span>Retirar até: {formatDate(reserva.data_expiracao)}</span>
          </div>
        )}
        {reserva.status === 'aguardando' && (
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>Aguardando disponibilidade</span>
          </div>
        )}
      </div>

      <button
        onClick={() => handleOpenCancelModal(reserva)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-semibold"
      >
        <Trash2 size={16} />
        Cancelar Reserva
      </button>
    </div>
  );

  // Renderiza linha do histórico
  const HistoricoRow = ({ reserva }: { reserva: Reserva }) => {
    const getStatusBadge = () => {
      switch (reserva.status) {
        case 'concluido':
          return <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-md text-xs font-semibold">Concluído</span>;
        case 'expirado':
          return <span className="inline-block px-3 py-1 bg-red-500 text-white rounded-md text-xs font-semibold">Expirado</span>;
        case 'cancelado':
          return <span className="inline-block px-3 py-1 bg-gray-500 text-white rounded-md text-xs font-semibold">Cancelado</span>;
        default:
          return <span className="inline-block px-3 py-1 bg-gray-400 text-white rounded-md text-xs font-semibold">Desconhecido</span>;
      }
    };

    return (
      <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <div className="grid grid-cols-12 gap-4 p-4 items-center">
          <div className="col-span-5 flex items-center gap-3">
            <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden shadow-sm">
              <Image
                src={reserva.livro.capa_url || '/covers/placeholder-icon.png'}
                alt={reserva.livro.titulo}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm truncate">{reserva.livro.titulo}</h4>
              <p className="text-xs text-gray-500 truncate">{reserva.livro.autores}</p>
            </div>
          </div>
          <div className="col-span-3 text-sm text-gray-600">
            {formatDate(reserva.data_reserva)}
          </div>
          <div className="col-span-3 text-sm text-gray-600">
            {formatDate(reserva.data_expiracao)}
          </div>
          <div className="col-span-1 flex justify-end">
            {getStatusBadge()}
          </div>
        </div>
      </div>
    );
  };

  // Renderiza conteúdo baseado no modo de visualização
  const renderContent = () => {
    if (carregando) {
      return (
        <div className="text-center text-gray-500 flex items-center justify-center p-20">
          <LoaderCircle className="animate-spin mr-2" size={32} />
          <span className="text-lg">Carregando suas reservas...</span>
        </div>
      );
    }

    if (erro) {
      return (
        <div className="text-center text-red-500 bg-red-50 p-10 rounded-lg flex items-center justify-center">
          <AlertTriangle className="mr-2" size={24} />
          <span>{erro}</span>
        </div>
      );
    }

    // Vista Lista
    if (viewMode === 'lista') {
      return (
        <div className="space-y-8">
          {/* Grupo 1: Pronto para Retirada */}
          {reservasProntas.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <CheckCircle2 className="text-green-600" size={20} />
                  Pronto para Retirada
                </h3>
                <span className="text-sm text-gray-500">Total: {reservasProntas.length}</span>
              </div>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 border-b border-gray-300">
                  <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase">Livro</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Data da Reserva</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Retirar Até</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Sua Posição</div>
                  <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase">Status</div>
                  <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase text-right">Ações</div>
                </div>
                {/* Linhas */}
                {reservasProntas.map(reserva => (
                  <ReservaRow key={reserva.id} reserva={reserva} />
                ))}
              </div>
            </div>
          )}

          {/* Grupo 2: Aguardando na Fila */}
          {reservasAguardando.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <Clock className="text-orange-600" size={20} />
                  Aguardando na Fila
                </h3>
                <span className="text-sm text-gray-500">Total: {reservasAguardando.length}</span>
              </div>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 border-b border-gray-300">
                  <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase">Livro</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Data da Reserva</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Retirar Até</div>
                  <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Sua Posição</div>
                  <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase">Status</div>
                  <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase text-right">Ações</div>
                </div>
                {/* Linhas */}
                {reservasAguardando.map(reserva => (
                  <ReservaRow key={reserva.id} reserva={reserva} />
                ))}
              </div>
            </div>
          )}

          {/* Mensagem quando não há reservas ativas */}
          {reservasProntas.length === 0 && reservasAguardando.length === 0 && (
            <div className="text-center text-gray-500 p-16 bg-white rounded-lg shadow-sm">
              <BookMarked size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma reserva ativa</h3>
              <p className="text-gray-400 mb-6">Você não possui reservas no momento.</p>
              <button
                onClick={handleNovoLivro}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Reservar Novo Livro
              </button>
            </div>
          )}
        </div>
      );
    }

    // Vista Quadro (Kanban)
    if (viewMode === 'quadro') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Aguardando na Fila */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <Clock className="text-orange-600" size={20} />
                Aguardando na Fila
              </h3>
              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                {reservasAguardando.length}
              </span>
            </div>
            <div className="space-y-3 bg-gray-100 p-4 rounded-lg min-h-[400px]">
              {reservasAguardando.length > 0 ? (
                reservasAguardando.map(reserva => (
                  <ReservaCard key={reserva.id} reserva={reserva} />
                ))
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma reserva aguardando</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Pronto para Retirada */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" size={20} />
                Pronto para Retirada
              </h3>
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                {reservasProntas.length}
              </span>
            </div>
            <div className="space-y-3 bg-gray-100 p-4 rounded-lg min-h-[400px]">
              {reservasProntas.length > 0 ? (
                reservasProntas.map(reserva => (
                  <ReservaCard key={reserva.id} reserva={reserva} />
                ))
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <BookMarked size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma reserva pronta</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Vista Histórico
    if (viewMode === 'historico') {
      if (reservasHistorico.length === 0) {
        return (
          <div className="text-center text-gray-500 p-16 bg-white rounded-lg shadow-sm">
            <HistoryIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem histórico</h3>
            <p className="text-gray-400">Você ainda não possui reservas concluídas ou expiradas.</p>
          </div>
        );
      }

      return (
        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 border-b border-gray-300">
            <div className="col-span-5 text-xs font-semibold text-gray-600 uppercase">Livro</div>
            <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Data da Reserva</div>
            <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Data de Expiração</div>
            <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase text-right">Status</div>
          </div>
          {/* Linhas */}
          {reservasHistorico.map(reserva => (
            <HistoricoRow key={reserva.id} reserva={reserva} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Minhas Reservas</h1>
        <button
          onClick={handleNovoLivro}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          <BookMarked size={20} />
          + Reservar Novo Livro
        </button>
      </div>

      {/* Abas de Navegação */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setViewMode('lista')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
            viewMode === 'lista'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList size={20} />
          Lista
        </button>
        <button
          onClick={() => setViewMode('quadro')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
            viewMode === 'quadro'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={20} />
          Quadro
        </button>
        <button
          onClick={() => setViewMode('historico')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
            viewMode === 'historico'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HistoryIcon size={20} />
          Histórico
        </button>
      </div>

      {/* Conteúdo */}
      {renderContent()}

      {/* Modal de Cancelamento */}
      {reservaToCancel && (
        <CancelModal
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancel}
          title={reservaToCancel.livro.titulo}
          coverUrl={reservaToCancel.livro.capa_url}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
