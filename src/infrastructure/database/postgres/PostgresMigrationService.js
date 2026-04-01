const db = require("../PostgresConnection");
const initialData = require("./seeds/initial-data.seed");

class PostgresMigrationService {
  async runMigrations() {
    const pool = db.getPool();
    await this.createTables(pool);
    await this.seedInitialUsers(pool);
    await this.seedSedes(pool);
    await this.seedZones(pool);
    await this.seedFacciones(pool);
    await this.seedFaccionesBr(pool);
    await this.updateRankingTableSchema(pool);
  }

  async updateRankingTableSchema(pool) {
    try {
      await pool.query("ALTER TABLE sedes_ranking ADD COLUMN ties INT DEFAULT 0");
      await pool.query("ALTER TABLE sedes_ranking ADD COLUMN points FLOAT DEFAULT 0");
      console.log("✅ BASE DE DATOS: Tabla sedes_ranking actualizada con nuevas columnas.");
    } catch (error) {
      if (error.code !== "42701") {
        console.log("ℹ️ (Info) Skipped altering sedes_ranking (columns likely exist).");
      }
    }
  }

  async createTables(pool) {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        discord_id VARCHAR(50) PRIMARY KEY,
        role VARCHAR(50),
        username VARCHAR(100),
        server_nickname VARCHAR(100),
        join_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS staff_blacklist (
        discord_id VARCHAR(50) PRIMARY KEY,
        staff_name VARCHAR(100),
        reasons TEXT,
        days INT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        author_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS sedes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        capacidad VARCHAR(50),
        coords_defensa VARCHAR(200),
        coords_ataque VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS br_zones_ciudad (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        coords VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS br_zones_cayo (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        coords VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS duels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE,
        coords_team1 VARCHAR(200),
        coords_team2 VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS matches (
        id VARCHAR(64) PRIMARY KEY,
        sede_name VARCHAR(100),
        def_name VARCHAR(100),
        atk_name VARCHAR(100),
        winner_name VARCHAR(100),
        score_def INT,
        score_atk INT,
        rounds INT,
        capacity VARCHAR(50),
        created_at TIMESTAMP,
        duration_minutes INT DEFAULT 0,
        iso_year_week VARCHAR(12) NULL,
        event_subtype VARCHAR(32) NULL,
        source VARCHAR(48) NULL DEFAULT 'entretenimiento_system',
        creatorid VARCHAR(50) NULL,
        staffapoyo TEXT[] NULL,
        fecha VARCHAR(50) NULL
      )`,
      `CREATE TABLE IF NOT EXISTS match_organizers (
        match_id VARCHAR(64),
        discord_id VARCHAR(50),
        discord_username VARCHAR(100),
        server_nickname VARCHAR(100),
        assigned_at TIMESTAMP,
        PRIMARY KEY (match_id, discord_id),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS sedes_ranking (
        sede_name VARCHAR(100) PRIMARY KEY,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        ties INT DEFAULT 0,
        points FLOAT DEFAULT 0,
        total_matches INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS facciones (
        key VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100),
        coordenadas VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS facciones_br (
        key VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100),
        coords VARCHAR(200),
        coords_br_ciudad VARCHAR(200),
        coords_br_cayo VARCHAR(200),
        coords_br_rey VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];
    try {
      for (const query of tables) {
        await pool.query(query);
      }
      console.log("✅ BASE DE DATOS: Todas las tablas verificadas/creadas.");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
    }
  }

  async seedInitialUsers(pool) {
    const initialAdmins = process.env.INITIAL_ADMINS ? process.env.INITIAL_ADMINS.split(",") : [];
    try {
      for (const id of initialAdmins) {
        await pool.query(
          `INSERT INTO users (discord_id, role, username, server_nickname, join_date)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (discord_id) DO NOTHING`,
          [id, "ADM-AUX", "Kira", "Kira"]
        );
      }
      console.log("✅ BASE DE DATOS: Admins iniciales verificados.");
    } catch (e) {
      console.error("❌ Error seeding users:", e);
    }
  }

  async seedSedes(pool) {
    try {
      for (const sede of initialData.sedes) {
        await pool.query(
          `INSERT INTO sedes (name, capacidad, coords_defensa, coords_ataque)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (name) DO UPDATE SET
             capacidad = EXCLUDED.capacidad,
             coords_defensa = EXCLUDED.coords_defensa,
             coords_ataque = EXCLUDED.coords_ataque`,
          [sede.nombre, sede.capacidad, sede.coords_defensa, sede.coords_ataque]
        );
      }
      console.log(`✅ BASE DE DATOS: ${initialData.sedes.length} sedes seedeadas.`);
    } catch (e) {
      console.error("❌ Error seeding sedes:", e);
    }
  }

  async seedZones(pool) {
    try {
      const seedList = async (list, tableName) => {
        for (const zone of list) {
          await pool.query(
            `INSERT INTO ${tableName} (name, coords)
             VALUES ($1, $2)
             ON CONFLICT (name) DO UPDATE SET coords = EXCLUDED.coords`,
            [zone.name, zone.coords]
          );
        }
      };
      await seedList(initialData.brZonesCiudad, "br_zones_ciudad");
      await seedList(initialData.brZonesCayo, "br_zones_cayo");
      console.log(`✅ BASE DE DATOS: Zonas BR seedeadas (${initialData.brZonesCiudad.length} ciudad, ${initialData.brZonesCayo.length} cayo).`);
    } catch (e) {
      console.error("❌ Error seeding zones:", e);
    }
  }

  async seedFacciones(pool) {
    try {
      for (const fac of initialData.facciones) {
        await pool.query(
          `INSERT INTO facciones (key, nombre, coordenadas)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO UPDATE SET
             nombre = EXCLUDED.nombre,
             coordenadas = EXCLUDED.coordenadas`,
          [fac.key, fac.nombre, fac.coordenadas]
        );
      }
      console.log(`✅ BASE DE DATOS: ${initialData.facciones.length} facciones seedeadas.`);
    } catch (e) {
      console.error("❌ Error seeding facciones:", e);
    }
  }

  async seedFaccionesBr(pool) {
    try {
      for (const fac of initialData.faccionesBr) {
        await pool.query(
          `INSERT INTO facciones_br (key, nombre, coords, coords_br_ciudad, coords_br_cayo, coords_br_rey)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (key) DO UPDATE SET
             nombre = EXCLUDED.nombre,
             coords = EXCLUDED.coords,
             coords_br_ciudad = EXCLUDED.coords_br_ciudad,
             coords_br_cayo = EXCLUDED.coords_br_cayo,
             coords_br_rey = EXCLUDED.coords_br_rey`,
          [fac.key, fac.nombre, fac.coords, fac.coords_br_ciudad, fac.coords_br_cayo, fac.coords_br_rey]
        );
      }
      console.log(`✅ BASE DE DATOS: ${initialData.faccionesBr.length} facciones BR seedeadas.`);
    } catch (e) {
      console.error("❌ Error seeding facciones_br:", e);
    }
  }
}

module.exports = new PostgresMigrationService();
