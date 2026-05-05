const db = require('../src/config/database');

async function seedAvaliacoesAutores() {
  try {
    console.log('👥 Buscando autores e usuários...\n');

    const autoresResult = await db.query('SELECT id, nome FROM autor LIMIT 10');
    const usuariosResult = await db.query('SELECT id, nome FROM usuario WHERE tipo_usuario = $1 LIMIT 5', ['aluno']);

    const autores = autoresResult.rows;
    const usuarios = usuariosResult.rows;

    if (autores.length === 0) {
      console.log('⚠️  Nenhum autor encontrado!');
      process.exit(0);
    }

    if (usuarios.length === 0) {
      console.log('⚠️  Nenhum usuário aluno encontrado!');
      process.exit(0);
    }

    console.log(`✅ ${autores.length} autores e ${usuarios.length} usuários encontrados.\n`);

    // Avaliações pré-definidas por autor
    const avaliacoesPorAutor = {
      'orwell': [
        { nota: 5, comentario: 'George Orwell é um mestre em criar distopias que nos fazem refletir sobre o poder e a liberdade. Sua escrita direta e impactante denuncia autoritarismos de forma atemporal. 1984 e A Revolução dos Bichos são leituras essenciais!' },
        { nota: 5, comentario: 'Relendo Orwell em 2025 e suas obras continuam extremamente relevantes. A vigilância digital, fake news e manipulação da verdade que ele previu estão mais atuais do que nunca. Um autor visionário!' }
      ],
      'machado': [
        { nota: 5, comentario: 'Machado de Assis é simplesmente o maior escritor brasileiro. Sua ironia, narrativas não-confiáveis e análise da sociedade são incomparáveis. Dom Casmurro e Memórias Póstumas mudaram minha forma de ler literatura.' },
        { nota: 5, comentario: 'A profundidade psicológica dos personagens de Machado é impressionante. Cada releitura revela novas camadas de significado. Um gênio absoluto da literatura mundial!' }
      ],
      'asimov': [
        { nota: 5, comentario: 'Asimov revolucionou a ficção científica com suas Leis da Robótica e a série Fundação. Sua capacidade de misturar ciência, filosofia e narrativa envolvente é única. Um verdadeiro visionário!' }
      ],
      'alencar': [
        { nota: 4, comentario: 'José de Alencar é fundamental para entender o Romantismo brasileiro. Iracema e Senhora são obras lindas que constroem mitos nacionais. A linguagem é poética, embora às vezes datada para leitores modernos.' }
      ],
      'aluísio': [
        { nota: 4, comentario: 'Aluísio Azevedo retrata o Rio de Janeiro do século XIX com realismo impressionante. O Cortiço é uma obra-prima do Naturalismo, mostrando as duras condições sociais da época. Leitura importante para entender a história brasileira.' }
      ],
      'rowling': [
        { nota: 5, comentario: 'J.K. Rowling criou um universo mágico que marcou gerações. Harry Potter não é apenas fantasia, mas uma história sobre amizade, coragem e escolhas morais. Uma autora que democratizou a leitura!' }
      ],
      'tolkien': [
        { nota: 5, comentario: 'Tolkien é o pai da fantasia moderna. A riqueza do mundo que ele criou em O Senhor dos Anéis e O Hobbit é incomparável. Mitologia, linguística e narrativa épica em perfeita harmonia!' }
      ]
    };

    let totalInseridos = 0;
    let totalCurtidas = 0;
    let totalRespostas = 0;

    // Criar avaliações
    for (const autor of autores) {
      const nomeAutorLower = autor.nome.toLowerCase();

      // Encontrar avaliações correspondentes
      let avaliacoesAutor = [];
      for (const [chave, avaliacoes] of Object.entries(avaliacoesPorAutor)) {
        if (nomeAutorLower.includes(chave)) {
          avaliacoesAutor = avaliacoes;
          break;
        }
      }

      // Se não houver avaliações específicas, criar uma genérica
      if (avaliacoesAutor.length === 0) {
        avaliacoesAutor = [
          { nota: 4, comentario: `${autor.nome} é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.` }
        ];
      }

      // Inserir avaliações (usando usuários diferentes)
      for (let i = 0; i < avaliacoesAutor.length && i < usuarios.length; i++) {
        const avaliacao = avaliacoesAutor[i];
        const usuario = usuarios[i];

        try {
          const diasAtras = Math.floor(Math.random() * 30) + 1;

          const result = await db.query(
            `INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao)
             VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${diasAtras} days')
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [autor.id, usuario.id, avaliacao.nota, avaliacao.comentario]
          );

          if (result.rows.length > 0) {
            const avaliacaoId = result.rows[0].id;
            console.log(`✅ Avaliação criada: ${usuario.nome} → ${autor.nome} (${avaliacao.nota}⭐)`);
            totalInseridos++;

            // Adicionar curtidas aleatórias
            const numCurtidas = Math.floor(Math.random() * 4) + 1;
            for (let j = 0; j < numCurtidas && j < usuarios.length; j++) {
              const usuarioCurtida = usuarios[(i + j + 1) % usuarios.length];
              try {
                await db.query(
                  'INSERT INTO curtidas_comentario (tipo_comentario, comentario_id, usuario_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                  ['autor', avaliacaoId, usuarioCurtida.id]
                );
                totalCurtidas++;
              } catch (err) {
                // Ignora conflitos
              }
            }

            // Adicionar resposta ocasional
            if (Math.random() > 0.5) {
              const usuarioResposta = usuarios[(i + 1) % usuarios.length];
              const respostas = [
                'Concordo totalmente! Esse autor é incrível.',
                'Ótima avaliação! Você me convenceu a ler mais obras desse autor.',
                'Excelente análise. Penso exatamente o mesmo!',
                'Perfeito! Não poderia ter descrito melhor.'
              ];
              const textoResposta = respostas[Math.floor(Math.random() * respostas.length)];

              try {
                await db.query(
                  `INSERT INTO respostas_comentario (tipo_comentario, comentario_id, usuario_id, texto, data_criacao)
                   VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(diasAtras / 2)} days')`,
                  ['autor', avaliacaoId, usuarioResposta.id, textoResposta]
                );
                totalRespostas++;
              } catch (err) {
                // Ignora erros
              }
            }
          }
        } catch (err) {
          console.log(`⚠️  Erro ao criar avaliação para ${autor.nome}: ${err.message}`);
        }
      }
    }

    // Adicionar curtidas e respostas nas avaliações de LIVROS também
    console.log('\n📚 Adicionando curtidas e respostas em avaliações de livros...\n');

    const avaliacoesLivrosResult = await db.query('SELECT id FROM avaliacoes LIMIT 10');
    const avaliacoesLivros = avaliacoesLivrosResult.rows;

    for (const avaliacao of avaliacoesLivros) {
      // Adicionar curtidas
      const numCurtidas = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numCurtidas && i < usuarios.length; i++) {
        try {
          await db.query(
            'INSERT INTO curtidas_comentario (tipo_comentario, comentario_id, usuario_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            ['livro', avaliacao.id, usuarios[i].id]
          );
          totalCurtidas++;
        } catch (err) {
          // Ignora conflitos
        }
      }

      // Adicionar resposta ocasional
      if (Math.random() > 0.6) {
        const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
        const respostas = [
          'Muito boa sua avaliação! Me ajudou a decidir ler este livro.',
          'Concordo com seus pontos. Obra impactante!',
          'Excelente comentário. Obrigado por compartilhar!',
          'Penso o mesmo! Este livro é fantástico.'
        ];
        const textoResposta = respostas[Math.floor(Math.random() * respostas.length)];

        try {
          await db.query(
            'INSERT INTO respostas_comentario (tipo_comentario, comentario_id, usuario_id, texto) VALUES ($1, $2, $3, $4)',
            ['livro', avaliacao.id, usuario.id, textoResposta]
          );
          totalRespostas++;
        } catch (err) {
          // Ignora erros
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DADOS DE COMUNIDADE CRIADOS COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📊 ${totalInseridos} avaliações de autores criadas`);
    console.log(`❤️  ${totalCurtidas} curtidas distribuídas`);
    console.log(`💬 ${totalRespostas} respostas criadas`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

seedAvaliacoesAutores();
