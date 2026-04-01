const db = require("../PostgresConnection");

class PostgresUserRepository {
  async init() {
    const pool = db.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        discord_id VARCHAR(50) PRIMARY KEY,
        role VARCHAR(50) DEFAULT 'Civil',
        username VARCHAR(100),
        server_nickname VARCHAR(100),
        join_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_blacklist (
        discord_id VARCHAR(50) PRIMARY KEY,
        staff_name VARCHAR(100),
        reasons TEXT,
        days INT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        author_id VARCHAR(50)
      )
    `);
    console.log("✅ BASE DE DATOS: Tablas de Usuarios y Blacklist verificadas.");
  }

  async save(user) {
    const pool = db.getPool();
    await pool.query(
      `INSERT INTO users (discord_id, role, username, server_nickname, join_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (discord_id) DO UPDATE SET
         role = EXCLUDED.role,
         username = EXCLUDED.username,
         server_nickname = EXCLUDED.server_nickname,
         join_date = EXCLUDED.join_date`,
      [user.discordId, user.role, user.username, user.serverNickname, user.joinDate]
    );
  }

  async findById(discordId) {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT * FROM users WHERE discord_id = $1", [discordId]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      discordId: r.discord_id,
      role: r.role,
      username: r.username,
      serverNickname: r.server_nickname,
      joinDate: r.join_date,
    };
  }

  async findAll(limit = 10, offset = 0, roleFilter = null) {
    const pool = db.getPool();
    let query = "SELECT * FROM users";
    const params = [];
    if (roleFilter && roleFilter !== "ALL") {
      query += " WHERE role = $1";
      params.push(roleFilter);
    }
    query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3";
    params.push(limit, offset);
    const { rows } = await pool.query(query, params);
    return rows.map((r) => ({
      discordId: r.discord_id,
      role: r.role,
      username: r.username,
      serverNickname: r.server_nickname,
      joinDate: r.join_date,
    }));
  }

  async findAllUsers() {
    const pool = db.getPool();
    const { rows } = await pool.query("SELECT discord_id, username, server_nickname FROM users ORDER BY username ASC");
    return rows.map((r) => ({
      discordId: r.discord_id,
      username: r.username,
      serverNickname: r.server_nickname,
    }));
  }

  async countAll(roleFilter = null) {
    const pool = db.getPool();
    let query = "SELECT COUNT(*) as count FROM users";
    const params = [];
    if (roleFilter && roleFilter !== "ALL") {
      query += " WHERE role = $1";
      params.push(roleFilter);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count, 10);
  }

  async delete(discordId) {
    const pool = db.getPool();
    await pool.query("DELETE FROM users WHERE discord_id = $1", [discordId]);
  }

  async addToBlacklist(data) {
    const pool = db.getPool();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + data.days);
    await pool.query(
      `INSERT INTO staff_blacklist (discord_id, staff_name, reasons, days, start_date, end_date, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (discord_id) DO UPDATE SET
         staff_name = EXCLUDED.staff_name,
         reasons = EXCLUDED.reasons,
         days = EXCLUDED.days,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         author_id = EXCLUDED.author_id`,
      [
        data.discordId,
        data.staffName || "Desconocido",
        data.reasons,
        data.days,
        startDate,
        endDate,
        data.authorId,
      ]
    );
  }

  async checkBlacklist(discordId) {
    const pool = db.getPool();
    const { rows } = await pool.query(
      "SELECT * FROM staff_blacklist WHERE discord_id = $1 AND end_date > CURRENT_TIMESTAMP",
      [discordId]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = new PostgresUserRepository();
