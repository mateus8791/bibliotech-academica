// Arquivo: backend/src/controllers/relatorioController.js (Versão Final Corrigida)

const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    console.log("Buscando estatísticas do dashboard...");

    // **** AQUI ESTÁ A CORREÇÃO: Removemos as aspas duplas dos nomes das tabelas ****
    const [
      totalLivrosResult,
      totalUsuariosResult,
      emprestimosAtivosResult,
      emprestimosAtrasadosResult,
      emprestimosPorMesResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM livro'), // <-- sem aspas
      pool.query('SELECT COUNT(*) FROM usuario'), // <-- sem aspas
      pool.query("SELECT COUNT(*) FROM emprestimo WHERE status = 'ativo'"), // <-- sem aspas
      pool.query("SELECT COUNT(*) FROM emprestimo WHERE status = 'atrasado'"), // <-- sem aspas
      pool.query(`
        SELECT
            to_char(data_emprestimo, 'YYYY-MM') AS mes,
            COUNT(*) AS quantidade
        FROM
            emprestimo 
        WHERE
            data_emprestimo >= date_trunc('month', NOW() - interval '5 months')
        GROUP BY
            mes
        ORDER BY
            mes ASC;
      `),
    ]);

    const emprestimosPorMes = emprestimosPorMesResult.rows.map(row => ({
        mes: new Date(row.mes + '-02').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        Empréstimos: parseInt(row.quantidade, 10),
    }));

    const responseData = {
      stats: {
        totalLivros: parseInt(totalLivrosResult.rows[0].count, 10),
        totalUsuarios: parseInt(totalUsuariosResult.rows[0].count, 10),
        livrosEmprestados: parseInt(emprestimosAtivosResult.rows[0].count, 10),
        livrosAtrasados: parseInt(emprestimosAtrasadosResult.rows[0].count, 10),
      },
      chartData: {
        emprestimosPorMes: emprestimosPorMes,
      },
    };

    console.log("Estatísticas calculadas:", responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getDashboardStats,
};