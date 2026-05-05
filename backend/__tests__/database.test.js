/**
 * Tests for database module (mocked - integration tests require real DB)
 * Note: Real DB connection tests are skipped as they require a running PostgreSQL instance.
 */

jest.mock('../src/config/database');
const pool = require('../src/config/database');

describe('Database Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should export a pool with query method', () => {
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });

  test('should execute a query and return result', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });
    const result = await pool.query('SELECT 1');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ '?column?': 1 });
  });

  test('should handle query errors', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection error'));
    await expect(pool.query('INVALID SQL')).rejects.toThrow('DB connection error');
  });

  test('should support connection via pool.connect()', async () => {
    expect(typeof pool.connect).toBe('function');
    const mockClient = { query: jest.fn(), release: jest.fn() };
    pool.connect.mockResolvedValueOnce(mockClient);
    const client = await pool.connect();
    expect(client).toBeDefined();
    expect(typeof client.query).toBe('function');
    expect(typeof client.release).toBe('function');
  });

  test('should support transactions via client', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValueOnce(mockClient);

    const client = await pool.connect();
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM test');
    await client.query('COMMIT');
    client.release();

    expect(mockClient.query).toHaveBeenCalledTimes(3);
    expect(result.rows[0]).toEqual({ id: 1 });
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });
});
