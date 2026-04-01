const { Pool } = require("pg");
require("dotenv").config();

class PostgresConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    console.log(`🔌 DB Init: Conectando a ${process.env.DB_HOST}...`);
    this.pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const client = await this.pool.connect();
    console.log("✅ BASE DE DATOS: Conectado exitosamente a PostgreSQL.");
    client.release();
    return this.pool;
  }

  getPool() {
    if (!this.pool) {
      throw new Error("Database pool not initialized. Call connect() first.");
    }
    return this.pool;
  }
}

module.exports = new PostgresConnection();
