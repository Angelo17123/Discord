const db = require("../PostgresConnection");

class PostgresFaccionesRepository {
  async init() {
    const pool = db.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facciones (
        key VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100),
        coordenadas VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facciones_br (
        key VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100),
        coords VARCHAR(200),
        coords_br_ciudad VARCHAR(200),
        coords_br_cayo VARCHAR(200),
        coords_br_rey VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAll() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM facciones ORDER BY nombre ASC");
    return rows;
  }

  async findByKey(key) {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM facciones WHERE key = $1", [key]);
    return rows.length > 0 ? rows[0] : null;
  }

  async getAllBr() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM facciones_br ORDER BY nombre ASC");
    return rows;
  }

  async findBrByKey(key) {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM facciones_br WHERE key = $1", [key]);
    return rows.length > 0 ? rows[0] : null;
  }

  async count() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT COUNT(*) as count FROM facciones");
    return parseInt(rows[0].count, 10);
  }

  async countBr() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT COUNT(*) as count FROM facciones_br");
    return parseInt(rows[0].count, 10);
  }
}

module.exports = new PostgresFaccionesRepository();
