// Arquivo: backend/src/controllers/dashboardController.js

const pool = require('../config/database');

const getLoanDashboardData = async (req, res) => {
  try {
    console.log("Buscando dados para o Dashboard de Empréstimos e Finanças...");

    // Usamos Promise.all para executar todas as consultas em paralelo
    const [
      emprestimosRecentesResult,
      statsFinanceirasResult,
      livrosMaisEmprestadosResult,
    ] = await Promise.all([
      // Query 1: CORRIGIDO - Nomes de tabela em minúsculo e sem aspas
      pool.query(`
        SELECT
          e.id,
          l.titulo AS livro_titulo,
          u.nome AS usuario_nome,
          e.data_emprestimo,
          e.data_devolucao_prevista,
          e.status
        FROM emprestimo e
        JOIN usuario u ON e.usuario_id = u.id
        JOIN livro l ON e.livro_id = l.id
        ORDER BY e.data_emprestimo DESC
        LIMIT 10;
      `),
      // Query 2: CORRIGIDO - Nome da tabela em minúsculo e sem aspas
      pool.query(`
        SELECT
          COALESCE(SUM(valor) FILTER (WHERE tipo = 'multa_atraso'), 0) AS total_multas,
          COALESCE(SUM(valor) FILTER (WHERE tipo = 'venda_livro'), 0) AS total_vendas,
          COALESCE(SUM(valor) FILTER (WHERE tipo = 'orcamento_acervo'), 0) AS orcamento_acervo
        FROM "Transacao_Financeira";
      `),
      // Query 3: CORRIGIDO - Nomes de tabela em minúsculo e sem aspas
      pool.query(`
        SELECT 
          l.titulo,
          COUNT(e.id) AS total_emprestimos
        FROM emprestimo e
        JOIN livro l ON e.livro_id = l.id
        GROUP BY l.titulo
        ORDER BY total_emprestimos DESC
        LIMIT 5;
      `),
    ]);

    // Montamos o objeto de resposta final para o frontend
    const dashboardData = {
      emprestimosRecentes: emprestimosRecentesResult.rows,
      statsFinanceiras: statsFinanceirasResult.rows[0],
      livrosMaisPopulares: livrosMaisEmprestadosResult.rows,
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard de empréstimos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Dashboard completo do aluno com KPIs, gráficos e tabelas (usando tabela emprestimo)
const getStudentDashboard = async (req, res) => {
  try {
    console.log('===== DEBUG DASHBOARD =====');
    console.log('req.usuario completo:', JSON.stringify(req.usuario, null, 2));
    console.log('req.usuario.tipo_usuario:', req.usuario?.tipo_usuario);
    console.log('req.usuario.tipo:', req.usuario?.tipo);
    console.log('===========================');

    const usuarioId = req.usuario.id;
    console.log(`Buscando dados do dashboard para o usuário ${usuarioId}...`);

    const [
      kpisResult,
      atividadeResult,
      categoriasResult,
      reservasAtivasResult,
      livrosPopularesResult,
    ] = await Promise.all([
      // KPIs - 4 cards no topo (usando tabela emprestimo com tipo = 'reserva')
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM emprestimo WHERE usuario_id = $1 AND tipo = 'reserva' AND status = 'disponivel') AS reservas_disponiveis,
          (SELECT COUNT(*) FROM emprestimo WHERE usuario_id = $1 AND tipo = 'reserva' AND status = 'aguardando') AS reservas_aguardando,
          (SELECT COALESCE(SUM(valor), 0) FROM "Transacao_Financeira" WHERE usuario_id = $1 AND tipo = 'multa_atraso') AS multas_pendentes,
          (SELECT COUNT(*) FROM emprestimo WHERE usuario_id = $1 AND tipo = 'reserva' AND status = 'concluido') AS livros_retirados
      `, [usuarioId]),

      // Gráfico de Atividade - Últimos 6 meses (baseado em reservas da tabela emprestimo)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', data_reserva), 'Mon') AS mes,
          COUNT(*) AS livros
        FROM emprestimo
        WHERE usuario_id = $1
          AND tipo = 'reserva'
          AND data_reserva >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', data_reserva)
        ORDER BY DATE_TRUNC('month', data_reserva) ASC
      `, [usuarioId]),

      // Gráfico de Categorias - Distribuição percentual (baseado em reservas concluídas)
      pool.query(`
        SELECT
          c.nome,
          COUNT(*) AS quantidade,
          ROUND((COUNT(*) * 100.0) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS percentual
        FROM emprestimo e
        JOIN livro l ON e.livro_id = l.id
        JOIN livro_categoria lc ON l.id = lc.livro_id
        JOIN categoria c ON lc.categoria_id = c.id
        WHERE e.usuario_id = $1 AND e.tipo = 'reserva' AND e.status = 'concluido'
        GROUP BY c.nome
        ORDER BY quantidade DESC
        LIMIT 5
      `, [usuarioId]),

      // Tabela de Reservas Ativas (disponíveis e aguardando)
      pool.query(`
        SELECT
          e.id,
          l.titulo AS livro_titulo,
          l.capa_url AS livro_capa_url,
          STRING_AGG(a.nome, ', ') AS autores,
          e.data_expiracao,
          e.status,
          (e.data_expiracao::date - CURRENT_DATE) AS dias_restantes
        FROM emprestimo e
        JOIN livro l ON e.livro_id = l.id
        LEFT JOIN livro_autor la ON l.id = la.livro_id
        LEFT JOIN autor a ON la.autor_id = a.id
        WHERE e.usuario_id = $1 AND e.tipo = 'reserva' AND e.status IN ('disponivel', 'aguardando')
        GROUP BY e.id, l.titulo, l.capa_url, e.data_expiracao, e.status
        ORDER BY
          CASE
            WHEN e.status = 'disponivel' THEN 1
            WHEN e.status = 'aguardando' THEN 2
          END,
          e.data_expiracao ASC
        LIMIT 10
      `, [usuarioId]),

      // Livros Mais Populares da Biblioteca (top 5 baseado em reservas da tabela emprestimo)
      pool.query(`
        SELECT
          l.id,
          l.titulo,
          l.capa_url,
          STRING_AGG(DISTINCT a.nome, ', ') AS autores,
          COUNT(e.id) AS total_reservas
        FROM livro l
        LEFT JOIN emprestimo e ON l.id = e.livro_id AND e.tipo = 'reserva'
        LEFT JOIN livro_autor la ON l.id = la.livro_id
        LEFT JOIN autor a ON la.autor_id = a.id
        GROUP BY l.id, l.titulo, l.capa_url
        ORDER BY total_reservas DESC, l.titulo
        LIMIT 5
      `),
    ]);

    const dashboardData = {
      kpis: kpisResult.rows[0],
      atividade: atividadeResult.rows,
      categorias: categoriasResult.rows,
      reservasAtivas: reservasAtivasResult.rows,
      livrosPopulares: livrosPopularesResult.rows,
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard do aluno:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getLoanDashboardData,
  getStudentDashboard,
};