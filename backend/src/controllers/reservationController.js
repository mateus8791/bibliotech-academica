// Arquivo: backend/src/controllers/reservationController.js

const pool = require('../config/database');
const criarNotificacao = require('../helpers/criarNotificacao');

// --- Função para CRIAR uma reserva (usando tabela emprestimo) ---
const createReservation = async (req, res) => {
  const usuarioId = req.usuario.id;
  const { livro_id, data_expiracao } = req.body;

  if (!livro_id || !data_expiracao) {
    return res.status(400).json({ mensagem: 'O ID do livro e a data de retirada são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    // Verificar limite de reservas ativas (status aguardando ou disponivel)
    const limiteQuery = `
      SELECT COUNT(*) FROM emprestimo
      WHERE usuario_id = $1
      AND tipo = 'reserva'
      AND status IN ('aguardando', 'disponivel')
    `;
    const { rows } = await client.query(limiteQuery, [usuarioId]);
    const numReservasAtivas = parseInt(rows[0].count, 10);

    if (numReservasAtivas >= 1) {
      return res.status(403).json({ mensagem: 'Limite de 1 reserva ativa por vez atingido.' });
    }

    await client.query('BEGIN');
    const novaReserva = await client.query(
      `INSERT INTO emprestimo
       (livro_id, usuario_id, tipo, data_reserva, data_expiracao, status, notificado)
       VALUES ($1, $2, 'reserva', NOW(), $3, 'aguardando', FALSE)
       RETURNING *`,
      [livro_id, usuarioId, data_expiracao]
    );
    await client.query('COMMIT');

    // Busca o título do livro para a notificação
    const livroResult = await pool.query('SELECT titulo FROM livro WHERE id = $1', [livro_id]);
    const tituloLivro = livroResult.rows[0]?.titulo || 'livro reservado';

    // Cria notificação (não interrompe se falhar)
    await criarNotificacao(
      usuarioId,
      'RESERVA_DISPONIVEL',
      'Reserva confirmada!',
      `Sua reserva do livro "${tituloLivro}" foi registrada com sucesso. Você será notificado quando estiver disponível.`,
      { livro_id, titulo: tituloLivro }
    );

    res.status(201).json(novaReserva.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};


// --- FUNÇÃO PARA BUSCAR TODAS AS RESERVAS DO USUÁRIO LOGADO (usando tabela emprestimo) ---
const getMyReservations = async (req, res) => {
  const usuarioId = req.usuario.id; // ID do usuário logado

  console.log('[getMyReservations] Buscando reservas para usuário:', usuarioId);

  try {
    // Busca todas as reservas do usuário com informações do livro e autores
    const query = `
      SELECT
        e.id,
        e.usuario_id,
        e.livro_id,
        e.data_reserva,
        e.data_expiracao,
        e.status,
        e.posicao_fila,
        e.notificado,
        l.titulo,
        l.capa_url,
        COALESCE(STRING_AGG(a.nome, ', '), 'Autor desconhecido') AS autores
      FROM emprestimo e
      INNER JOIN livro l ON e.livro_id = l.id
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor a ON la.autor_id = a.id
      WHERE e.usuario_id = $1 AND e.tipo = 'reserva'
      GROUP BY e.id, e.usuario_id, e.livro_id, e.data_reserva, e.data_expiracao, e.status, e.posicao_fila, e.notificado, l.titulo, l.capa_url
      ORDER BY
        CASE
          WHEN e.status = 'disponivel' THEN 1
          WHEN e.status = 'aguardando' THEN 2
          WHEN e.status = 'concluido' THEN 3
          WHEN e.status = 'expirado' THEN 4
          WHEN e.status = 'cancelado' THEN 5
          ELSE 6
        END,
        e.data_reserva DESC;
    `;

    console.log('[getMyReservations] Executando query...');
    const { rows } = await pool.query(query, [usuarioId]);
    console.log('[getMyReservations] Número de reservas encontradas:', rows.length);

    // Formata os dados para o frontend
    const reservasFormatadas = rows.map(row => ({
      id: row.id,
      usuario_id: row.usuario_id,
      livro_id: row.livro_id,
      data_reserva: row.data_reserva,
      data_expiracao: row.data_expiracao,
      status: row.status,
      posicao_fila: row.posicao_fila,
      notificado: row.notificado || false,
      livro: {
        id: row.livro_id,
        titulo: row.titulo,
        capa_url: row.capa_url,
        autores: row.autores
      }
    }));

    console.log('[getMyReservations] Retornando', reservasFormatadas.length, 'reservas formatadas');
    res.status(200).json(reservasFormatadas);

  } catch (error) {
    console.error("Erro ao buscar reservas do usuário:", error);
    console.error("Stack trace completo:", error.stack);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};


// --- FUNÇÃO PARA CANCELAR UMA RESERVA (usando tabela emprestimo) ---
const cancelReservation = async (req, res) => {
  const usuarioId = req.usuario.id; // ID do usuário logado
  const { id } = req.params;      // ID da reserva que vem da URL (ex: /api/reservas/meu-id-aqui)

  try {
    // Primeiro, vamos garantir que a reserva pertence ao usuário que está tentando cancelá-la
    const updateQuery = `
      UPDATE emprestimo
      SET status = 'cancelado'
      WHERE id = $1 AND usuario_id = $2 AND tipo = 'reserva' AND status IN ('disponivel', 'aguardando')
      RETURNING *;
    `;

    const { rows, rowCount } = await pool.query(updateQuery, [id, usuarioId]);

    // Se rowCount for 0, significa que nenhuma linha foi alterada.
    // Isso acontece se a reserva não existe, não pertence ao usuário ou já não estava ativa.
    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Reserva não encontrada ou não pode ser cancelada.' });
    }

    // Notificação de cancelamento
    await criarNotificacao(
      usuarioId,
      'ERRO',
      'Reserva cancelada',
      'Sua reserva foi cancelada com sucesso.',
      { reserva_id: id }
    );

    res.status(200).json({ mensagem: 'Reserva cancelada com sucesso!', reserva: rows[0] });

  } catch (error) {
    console.error("Erro ao cancelar reserva:", error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};


module.exports = {
  createReservation,
  getMyReservations,
  cancelReservation,
};
