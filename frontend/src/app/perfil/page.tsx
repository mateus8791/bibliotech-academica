// Arquivo: frontend/src/app/perfil/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import Image from 'next/image';
import { User, Calendar, BookCheck, History } from 'lucide-react';

// --- Interfaces para os dados ---
interface UserInfo {
  nome: string;
  email: string;
  foto_url: string | null;
  data_cadastro: string;
  tipo_usuario: 'aluno' | 'bibliotecario' | 'admin';
}

interface Atividade {
  descricao: string;
  data: string;
}

interface PerfilData {
  info: UserInfo;
  atividades: Atividade[];
}



// --- Componente da Página ---

export default function PerfilPage() {

  const { usuario } = useAuth(); // Hook para pegar o usuário logado

  const [perfilData, setPerfilData] = useState<PerfilData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');



  useEffect(() => {

    if (usuario) {

      const fetchPerfilData = async () => {

        try {

          // Usamos o novo endpoint que criamos no backend

          const response = await api.get('/perfil');

          setPerfilData(response.data);

        } catch (err) {

          console.error("Erro ao buscar dados do perfil:", err);

          setError("Não foi possível carregar os dados do seu perfil.");

        } finally {

          setLoading(false);

        }

      };

      fetchPerfilData();

    } else {

        // Se o usuário do contexto ainda não carregou, aguardamos.

        // O loading do AuthContext geralmente lida com isso.

        setLoading(false); 

    }

  }, [usuario]); // Roda o efeito quando a informação do usuário estiver disponível



  if (loading) {

    return <p className="p-8 text-center">Carregando perfil...</p>;

  }

  

  if (error) {

    return <p className="p-8 text-center text-red-500">{error}</p>;

  }

  

  if (!perfilData) {

    return <p className="p-8 text-center">Não foi possível encontrar os dados do perfil.</p>;

  }



  const { info, atividades } = perfilData;

  const isAluno = info.tipo_usuario === 'aluno';



  return (

      <main className="p-4 sm:p-6 md:p-8 bg-gray-50">

        <div className="max-w-4xl mx-auto">

          {/* Card de Informações do Usuário */}

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">

            <Image

              src={info.foto_url || '/avatar-placeholder.png'}

              alt={`Foto de ${info.nome}`}

              width={100}

              height={100}

              className="rounded-full object-cover border-4 border-blue-200"

            />

            <div className="text-center sm:text-left">

              <h1 className="text-3xl font-bold text-gray-800">{info.nome}</h1>

              <p className="text-md text-gray-500">{info.email}</p>

              <div className="flex items-center justify-center sm:justify-start text-sm text-gray-500 mt-2">

                <Calendar className="w-4 h-4 mr-2" />

                Membro desde: {info.data_cadastro}

              </div>

            </div>

          </div>

          

          {/* Seção de Atividades / Histórico */}

          <div className="mt-8">

            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">

              {isAluno ? <BookCheck className="w-6 h-6 mr-3 text-green-600" /> : <History className="w-6 h-6 mr-3 text-purple-600" />}

              {isAluno ? 'Meu Histórico de Leitura' : 'Minhas Atividades Recentes'}

            </h2>

            <div className="bg-white rounded-xl shadow-md p-6">

              {atividades.length > 0 ? (

                <ul className="space-y-4">

                  {atividades.map((atividade, index) => (

                    <li key={index} className="flex items-start pb-4 border-b last:border-b-0">

                       <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isAluno ? 'bg-green-100' : 'bg-purple-100'}`}>

                         {isAluno ? <BookCheck className="h-5 w-5 text-green-600" /> : <History className="h-5 w-5 text-purple-600" />}

                       </div>

                       <div className="ml-4">

                         <p className="text-sm font-medium text-gray-700">{atividade.descricao}</p>

                         <p className="text-sm text-gray-500">{atividade.data}</p>

                       </div>

                    </li>

                  ))}

                </ul>

              ) : (

                <p className="text-center text-gray-500 py-8">Nenhuma atividade registrada ainda.</p>

              )}

            </div>

          </div>

        </div>

      </main>

  );

}
