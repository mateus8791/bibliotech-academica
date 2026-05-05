const db = require('../src/config/database');

async function popularResumoIA() {
  try {
    console.log('📚 Buscando livros existentes...\n');

    const livrosResult = await db.query('SELECT id, titulo FROM livro ORDER BY titulo LIMIT 20');
    const livros = livrosResult.rows;

    if (livros.length === 0) {
      console.log('⚠️  Nenhum livro encontrado no banco!');
      process.exit(0);
    }

    console.log(`✅ Encontrados ${livros.length} livros.\n`);

    // Resumos pré-definidos baseados em títulos comuns
    const resumos = {
      '1984': 'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos. Um clássico sobre vigilância, manipulação e resistência.',

      'fundação': 'Hari Seldon prevê a queda do Império Galáctico usando psicohistória. Cria duas Fundações para preservar o conhecimento e encurtar a era das trevas vindoura. Épico de ficção científica sobre destino e ciência.',

      'dom casmurro': 'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar? Um mistério psicológico sobre memória, paixão e a natureza humana narrado por um protagonista pouco confiável.',

      'cortiço': 'Retrato naturalista de um cortiço carioca no século XIX. João Romão explora os moradores enquanto busca ascensão social. Crítica social sobre pobreza, ambição e determinismo ambiental.',

      'memórias póstumas': 'Brás Cubas narra sua vida depois de morto. Com humor negro e ironia, disseca a hipocrisia da elite brasileira do século XIX. Revolucionou a literatura nacional com sua narrativa não-linear.',

      'iracema': 'Lenda do Ceará: o amor impossível entre a índia Iracema e o português Martim. Ela sacrifica tudo por amor, simbolizando o encontro doloroso entre culturas. Prosa poética que forjou mitos nacionais.',

      'revolução dos bichos': 'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos. Alegoria devastadora sobre corrupção de ideais revolucionários.',

      'senhora': 'Aurélia compra seu próprio casamento para vingar-se de Seixas, que a rejeitou por dinheiro. Romance urbano sobre orgulho, mercantilização do amor e redenção na sociedade carioca oitocentista.',

      'quincas borba': 'Rubião herda fortuna do filósofo Quincas Borba, mas é explorado por Sofia e Palha. Crítica à elite carioca e ao darwinismo social através da trajetória de um ingênuo que enlouquece.',

      'harry potter': 'Harry descobre ser um bruxo e ingressa em Hogwarts. Enfrenta Voldemort, o bruxo das trevas que matou seus pais. Saga sobre amizade, coragem e a luta entre o bem e o mal.',

      'hobbit': 'Bilbo Baggins é arrastado para uma aventura com 13 anões e o mago Gandalf. Enfrentam trolls, goblins e o dragão Smaug para recuperar o tesouro da Montanha Solitária. Clássico da fantasia.',

      'pequeno príncipe': 'Um piloto perdido no deserto encontra o Pequeno Príncipe, que conta sobre sua jornada por diferentes planetas. Fábula poética sobre amizade, amor e o sentido da vida.',

      'cem anos de solidão': 'A saga da família Buendía em Macondo, desde a fundação até o apocalipse. Realismo mágico, solidão, guerra civil e amores impossíveis na obra-prima de García Márquez.',

      'crime e castigo': 'Raskólnikov mata uma velha usurária para provar sua teoria do super-homem. Atormentado pela culpa, busca redenção. Dostoiévski explora moralidade, loucura e salvação.'
    };

    let totalInseridos = 0;

    for (const livro of livros) {
      const tituloLower = livro.titulo.toLowerCase();

      // Buscar resumo correspondente
      let resumoTexto = null;
      for (const [chave, resumo] of Object.entries(resumos)) {
        if (tituloLower.includes(chave)) {
          resumoTexto = resumo;
          break;
        }
      }

      // Se não encontrou resumo específico, criar um genérico
      if (!resumoTexto) {
        resumoTexto = `Uma obra fascinante que explora temas profundos da condição humana. "${livro.titulo}" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.`;
      }

      try {
        await db.query(
          'INSERT INTO resumo_ia (livro_id, resumo_texto, modelo_utilizado) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [livro.id, resumoTexto, 'gpt-4-turbo']
        );
        console.log(`✅ Resumo criado para: ${livro.titulo}`);
        totalInseridos++;
      } catch (err) {
        console.log(`⚠️  Erro ao inserir resumo para ${livro.titulo}: ${err.message}`);
      }
    }

    console.log(`\n✅ Total de resumos inseridos: ${totalInseridos}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

popularResumoIA();
