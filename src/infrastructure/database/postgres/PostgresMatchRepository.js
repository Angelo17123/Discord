const db = require("../PostgresConnection");

class PostgresMatchRepository {
  async init() {
    const pool = db.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
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
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_organizers (
        match_id VARCHAR(64),
        discord_id VARCHAR(50),
        discord_username VARCHAR(100),
        server_nickname VARCHAR(100),
        assigned_at TIMESTAMP,
        PRIMARY KEY (match_id, discord_id),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ BASE DE DATOS: Tablas de Historial de Partidas verificadas.");
  }

  async save(match) {
    const pool = db.getPool();
    const client = await pool.connect();
    const PostgresUserRepository = require("./PostgresUserRepository");
    try {
      await client.query("BEGIN");
      const createdAt = new Date();
      await client.query(
        `INSERT INTO matches (id, sede_name, def_name, atk_name, winner_name, score_def, score_atk, rounds, capacity, created_at, iso_year_week, event_subtype, source, creatorid, staffapoyo, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          match.id,
          match.location.name,
          match.defTeam.name,
          match.atkTeam.name,
          match.winner?.name || "Empate",
          match.scoreDef,
          match.scoreAtk,
          match.round,
          match.capacity,
          createdAt,
          match.isoYearWeek || null,
          match.eventSubtype || null,
          match.source || "entretenimiento_system",
          match.creatorId || null,
          match.staffApoyo || [],
          match.fecha || null,
        ]
      );
      if (match.isRanked !== false) {
        const defName = match.defTeam.name;
        const atkName = match.atkTeam.name;
        const winnerName = match.winner?.name;
        let defPoints = 0, atkPoints = 0;
        let defWin = 0, atkWin = 0;
        let defLoss = 0, atkLoss = 0;
        if (winnerName === defName) {
          defPoints = 1; defWin = 1; atkLoss = 1;
        } else if (winnerName === atkName) {
          atkPoints = 1; atkWin = 1; defLoss = 1;
        } else {
          defPoints = 0.5; atkPoints = 0.5;
        }
        const updateQuery = `
          INSERT INTO sedes_ranking (sede_name, wins, losses, points, total_matches)
          VALUES ($1, $2, $3, $4, 1)
          ON CONFLICT (sede_name) DO UPDATE SET
            wins = sedes_ranking.wins + EXCLUDED.wins,
            losses = sedes_ranking.losses + EXCLUDED.losses,
            points = sedes_ranking.points + EXCLUDED.points,
            total_matches = sedes_ranking.total_matches + 1
        `;
        await client.query(updateQuery, [defName, defWin, defLoss, defPoints]);
        await client.query(updateQuery, [atkName, atkWin, atkLoss, atkPoints]);
      }
      if (match.leonesIds && match.leonesIds.length > 0) {
        for (const userId of match.leonesIds) {
          let username = "Desconocido";
          let nickname = "Desconocido";
          const userDb = await PostgresUserRepository.findById(userId);
          if (userDb) {
            username = userDb.username;
            nickname = userDb.serverNickname;
          }
          await client.query(
            `INSERT INTO match_organizers (match_id, discord_id, discord_username, server_nickname, assigned_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [match.id, userId, username, nickname, createdAt]
          );
        }
      }
      await client.query("COMMIT");
      console.log(`💾 Match ${match.id} guardado (semana ${match.isoYearWeek || "N/A"}).`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error saving match history:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllMatches() {
    const pool = db.getPool();
    const { rows } = await pool.query(
      `SELECT * FROM matches
       WHERE (id LIKE 'es_%' OR id LIKE 'match_%' OR id LIKE 'br_%')
       ORDER BY created_at DESC`
    );
    return rows;
  }

  async getMatchesByIsoYearWeek(isoYearWeek) {
    const pool = db.getPool();
    const { rows } = await pool.query(
      `SELECT * FROM matches
       WHERE iso_year_week = $1
       AND (id LIKE 'es_%' OR id LIKE 'match_%')
       ORDER BY created_at DESC`,
      [isoYearWeek]
    );
    return rows;
  }

  async getRecentAssaultWeeks(limit = 8) {
    const pool = db.getPool();
    const { rows } = await pool.query(
      `SELECT DISTINCT iso_year_week FROM matches
       WHERE iso_year_week IS NOT NULL AND (id LIKE 'es_%' OR id LIKE 'match_%')
       ORDER BY iso_year_week DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => r.iso_year_week);
  }
}

module.exports = new PostgresMatchRepository();
