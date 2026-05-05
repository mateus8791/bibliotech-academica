// Arquivo: frontend/src/app/livro/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { BookCheck, CalendarClock, ChevronLeft, LoaderCircle } from "lucide-react";
import api from '@/services/api';
import ReservationModal from '@/components/ReservationModal';
import SuccessModal from '@/components/SuccessModal'; // Importa o novo modal de sucesso

// Define a "forma" completa dos dados de um livro
interface BookDetails {
  id: string;
  titulo: string;
  isbn: string | null;
  ano_publicacao: number | null;
  num_paginas: number | null;
  sinopse: string | null;
  capa_url: string | null;
  autor_nome: string | null;
  categoria_nome: string | null;
}

export default function LivroDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [livro, setLivro] = useState<BookDetails | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estados para controlar os modais
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  // Busca os detalhes do livro
  useEffect(() => {
    if (!id) return;
    const fetchBookDetails = async () => {
      try {
        setCarregando(true);
        const response = await api.get(`/livros/${id}`);
        setLivro(response.data);
      } catch (error) {
        console.error("Falha ao carregar detalhes do livro:", error);
        setErro("Não foi possível carregar os dados do livro.");
      } finally {
        setCarregando(false);
      }
    };
    fetchBookDetails();
  }, [id]);

  // Função chamada pelo modal para confirmar a reserva
  const handleConfirmReservation = async (dataRetirada: string) => {
    setIsSubmitting(true);
    setReservationError(null);
    try {
      await api.post('/reservas', {
        livro_id: id,
        data_expiracao: dataRetirada,
      });
      setIsReservationModalOpen(false); // Fecha o modal de reserva
      setIsSuccessModalOpen(true);     // ABRE o modal de SUCESSO
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensagem || 'Ocorreu um erro ao fazer a reserva.';
      setReservationError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para fechar o modal de sucesso e redirecionar
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    router.push('/aluno/minhas-reservas');
  };
  
  if (carregando) {
    return (
            <div className="flex justify-center items-center h-full text-gray-500">
                <LoaderCircle className="animate-spin mr-4" size={32}/>
                Carregando...
            </div>
    );
  }
  if (erro || !livro) {
    return (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-red-600">Livro não encontrado</h1>
                <p className="text-gray-600 mt-2">{erro || "O livro que você está procurando não existe ou não pôde ser carregado."}</p>
                <Link href="/catalogo" className="mt-6 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                    Voltar ao Catálogo
                </Link>
            </div>
    );
  }

  return (
    <>
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-semibold">
                <ChevronLeft size={20} />
                Voltar
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden md:flex md:gap-8">
              <div className="md:w-1/3 p-4">
                 <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg">
                  <Image
                      src={livro.capa_url || '/covers/placeholder-icon.png'}
                      alt={`Capa do livro ${livro.titulo}`}
                      fill
                      className="object-cover"
                  />
                 </div>
              </div>

              <div className="md:w-2/3 p-6 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">{livro.categoria_nome || 'Sem categoria'}</p>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-1">{livro.titulo}</h1>
                  <p className="text-lg text-gray-500 mt-2">por {livro.autor_nome || 'Autor Desconhecido'}</p>
                  <p className="text-gray-700 mt-6 text-justify leading-relaxed">
                    {livro.sinopse || 'Sinopse não disponível.'}
                  </p>
                  <div className="mt-6 border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500">Ano</p><p className="font-semibold text-gray-800 text-base">{livro.ano_publicacao || 'N/A'}</p></div>
                    <div><p className="text-gray-500">Páginas</p><p className="font-semibold text-gray-800 text-base">{livro.num_paginas || 'N/A'}</p></div>
                    <div className="col-span-2"><p className="text-gray-500">ISBN</p><p className="font-semibold text-gray-800 text-base">{livro.isbn || 'N/A'}</p></div>
                  </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                        setReservationError(null); // Limpa erros antigos ao abrir
                        setIsReservationModalOpen(true);
                    }}
                    className="flex-1 flex justify-center items-center gap-2 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 shadow-md">
                    <BookCheck size={20} /> Reservar Livro
                  </button>
                  <button className="flex-1 flex justify-center items-center gap-2 w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">
                    <CalendarClock size={20} /> Agendar Empréstimo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Renderiza o modal de reserva */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
            setIsReservationModalOpen(false);
            setReservationError(null);
        }}
        onConfirm={handleConfirmReservation}
        bookTitle={livro.titulo}
        bookCover={livro.capa_url}
        bookAuthor={livro.autor_nome}
        bookCategory={livro.categoria_nome}
        isSubmitting={isSubmitting}
        errorMessage={reservationError}
      />

      {/* Renderiza nosso novo modal de sucesso */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        title="LIVRO RESERVADO COM SUCESSO"
      >
        <p>
          Sua jornada por este universo está prestes a começar!
          Dirija-se à biblioteca na data selecionada para retirar o seu exemplar.
        </p>
        <p className="mt-4 text-xs bg-amber-100 text-amber-800 p-2 rounded-md">
          Lembre-se: em caso de atraso na devolução, será cobrada uma multa de <strong>R$ 1,00 por dia</strong>.
        </p>
        <p className="mt-4 font-semibold">Desejamos a você uma excelente leitura!</p>
      </SuccessModal>
    </>
  );
}
