// Arquivo: frontend/src/app/minhas-conquistas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import api from '@/services/api';
import { Award, BookOpen, Clock, Compass, Star } from 'lucide-react';

// --- Interfaces para os dados ---
interface Conquista {
  nome: string;
  descricao: string;
  icon: string;
}
interface LivroHistorico {
  livro_id: string;
  titulo: string;
  capa_url: string | null;
  autor_nome: string;
  data_conclusao: string;
}
interface ConquistasData {
  nivelLeitor: { nome: string; proximoNivel: number; };
  totalLivrosLidos: number;
  historico: LivroHistorico[];
  conquistas: Conquista[];
}

// --- Componentes ---
const BadgeIcon = ({ iconName }: { iconName: string }) => {
    const iconMap: { [key: string]: React.ElementType } = {
        BookOpen, Clock, Compass
    };
    const Icon = iconMap[iconName] || Star;
    return <Icon className="w-8 h-8 text-yellow-500" />;
};

// --- Página Principal ---
export default function MinhasConquistasPage() {
  const [data, setData] = useState<ConquistasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/conquistas');
        setData(response.data);
      } catch (err) {
        setError('Não foi possível carregar seus dados.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Carregando suas conquistas...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const progressoNivel = Math.min((data.totalLivrosLidos / data.nivelLeitor.proximoNivel) * 100, 100);

  

  return (

    <main className="p-4 sm:p-6 md:p-8 bg-gray-50">

      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3"><Award className="text-amber-500"/> Minhas Conquistas</h1>



      {/* Seção de Nível de Leitor */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md text-center">

              <h2 className="text-lg font-semibold text-gray-500">SEU NÍVEL ATUAL</h2>

              <p className="text-3xl font-bold text-blue-600 my-2">{data.nivelLeitor.nome}</p>

              <div className="w-full bg-gray-200 rounded-full h-4 my-4">

                  <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progressoNivel}%` }}></div>

              </div>

              <p className="text-sm text-gray-600">{data.totalLivrosLidos} de {data.nivelLeitor.proximoNivel} livros lidos para o próximo nível.</p>

          </div>

          

          {/* Seção de Medalhas */}

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">

              <h2 className="text-lg font-semibold text-gray-800 mb-4">Medalhas Desbloqueadas ({data.conquistas.length})</h2>

              {data.conquistas.length > 0 ? (

                  <div className="flex flex-wrap gap-4">

                      {data.conquistas.map(conquista => (

                          <div key={conquista.nome} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg" title={conquista.descricao}>

                              <BadgeIcon iconName={conquista.icon} />

                              <span className="font-semibold text-gray-700">{conquista.nome}</span>

                          </div>

                      ))}

                  </div>

              ) : (

                  <p className="text-center text-gray-500 py-8">Continue lendo para desbloquear novas medalhas!</p>

              )}

          </div>

      </div>



      {/* Histórico de Leitura */}

      <div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">Seu Histórico de Leitura</h2>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">

              {data.historico.map(livro => (

                  <Link href={`/livro/${livro.livro_id}`} key={livro.livro_id} className="block text-center group">

                      <div className="relative aspect-[2/3] w-full bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">

                           <Image 

                              src={livro.capa_url || '/covers/placeholder-icon.png'} 

                              alt={`Capa de ${livro.titulo}`} 

                              fill 

                              className="object-cover"

                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"

                          />

                      </div>

                      <h3 className="mt-2 font-semibold text-sm text-gray-700 group-hover:text-blue-600">{livro.titulo}</h3>

                      <p className="text-xs text-gray-500">Lido em: {livro.data_conclusao}</p>

                  </Link>

              ))}

          </div>

          {data.historico.length === 0 && (

               <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">

                  <p>Seu histórico de leitura aparecerá aqui assim que você devolver seu primeiro livro.</p>

               </div>

          )}

      </div>

    </main>

  );

}