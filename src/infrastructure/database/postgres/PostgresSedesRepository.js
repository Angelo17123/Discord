const db = require("../PostgresConnection");

class PostgresSedesRepository {
  async init() {
    const pool = db.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sedes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        capacidad VARCHAR(50),
        coords_defensa VARCHAR(200),
        coords_ataque VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAll() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM sedes ORDER BY name ASC");
    return rows;
  }

  async findByName(name) {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM sedes WHERE name = $1", [name]);
    return rows.length > 0 ? rows[0] : null;
  }

  async add(sede) {
    const pool = db.getPool();
    const { rows } = await pool.query(
      `INSERT INTO sedes (name, capacidad, coords_defensa, coords_ataque)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET
         capacidad = EXCLUDED.capacidad,
         coords_defensa = EXCLUDED.coords_defensa,
         coords_ataque = EXCLUDED.coords_ataque
       RETURNING *`,
      [sede.nombre, sede.capacidad, sede.coords_defensa, sede.coords_ataque]
    );
    return rows[0];
  }

  async remove(name) {
    const pool = db.getPool();
    const { rowCount } = await pool.query("DELETE FROM sedes WHERE name = $1", [name]);
    return rowCount > 0;
  }

  async count() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT COUNT(*) as count FROM sedes");
    return parseInt(rows[0].count, 10);
  }
}

module.exports = new PostgresSedesRepository();
