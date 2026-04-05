const express = require("express");
const router = express.Router();
const db = require("../../infrastructure/database/PostgresConnection");

const PostgresMatchRepository = require("../../infrastructure/database/postgres/PostgresMatchRepository");
const PostgresSedesRepository = require("../../infrastructure/database/postgres/PostgresSedesRepository");
const PostgresFaccionesRepository = require("../../infrastructure/database/postgres/PostgresFaccionesRepository");
const PostgresUserRepository = require("../../infrastructure/database/postgres/PostgresUserRepository");
const assaultPersistence = require("../../services/assaultPersistence");

router.get("/matches", async (req, res) => {
  try {
    const { week, limit } = req.query;
    let matches;
    if (week) {
      matches = await PostgresMatchRepository.getMatchesByIsoYearWeek(week);
    } else {
      matches = await PostgresMatchRepository.getAllMatches();
      if (limit) {
        matches = matches.slice(0, parseInt(limit, 10));
      }
    }
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.post("/matches", async (req, res) => {
  try {
    const { sede, defTeam, atkTeam, capacity, fecha, eventSubtype } = req.body;
    if (!sede || !defTeam || !atkTeam) {
      return res.status(400).json({ error: "sede, defTeam, atkTeam are required" });
    }
    const match = await PostgresMatchRepository.create({
      sede_name: sede,
      def_name: defTeam,
      atk_name: atkTeam,
      capacity: capacity || "15 vs 15",
      fecha: fecha || new Date().toLocaleDateString("es-ES"),
      event_subtype: eventSubtype || "asalto",
    });
    res.json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Failed to create match" });
  }
});

router.get("/sedes", async (req, res) => {
  try {
    const sedes = await PostgresSedesRepository.getAll();
    res.json(sedes);
  } catch (error) {
    console.error("Error fetching sedes:", error);
    res.status(500).json({ error: "Failed to fetch sedes" });
  }
});

router.get("/facciones", async (req, res) => {
  try {
    const { br } = req.query;
    const facciones = br === "true"
      ? await PostgresFaccionesRepository.getAllBr()
      : await PostgresFaccionesRepository.getAll();
    res.json(facciones);
  } catch (error) {
    console.error("Error fetching facciones:", error);
    res.status(500).json({ error: "Failed to fetch facciones" });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const { week } = req.query;
    const ranking = await assaultPersistence.getRanking(week || null);
    res.json(ranking);
  } catch (error) {
    console.error("Error fetching ranking:", error);
    res.status(500).json({ error: "Failed to fetch ranking" });
  }
});

router.get("/users/:discordId", async (req, res) => {
  try {
    const user = await PostgresUserRepository.findById(req.params.discordId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.get("/weeks", async (req, res) => {
  try {
    const weeks = await PostgresMatchRepository.getRecentAssaultWeeks(12);
    res.json(weeks);
  } catch (error) {
    console.error("Error fetching weeks:", error);
    res.status(500).json({ error: "Failed to fetch weeks" });
  }
});

router.post("/sedes", async (req, res) => {
  try {
    const { name, capacidad, coords_defensa, coords_ataque } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const sede = await PostgresSedesRepository.add({
      nombre: name,
      capacidad: capacidad || "15 vs 15",
      coords_defensa: coords_defensa || "N/A",
      coords_ataque: coords_ataque || "N/A",
    });
    res.json(sede);
  } catch (error) {
    console.error("Error creating sede:", error);
    res.status(500).json({ error: "Failed to create sede" });
  }
});

router.delete("/sedes/:name", async (req, res) => {
  try {
    const removed = await PostgresSedesRepository.remove(req.params.name);
    if (!removed) {
      return res.status(404).json({ error: "Sede not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting sede:", error);
    res.status(500).json({ error: "Failed to delete sede" });
  }
});

router.post("/facciones", async (req, res) => {
  try {
    const { key, nombre, coordenadas } = req.body;
    if (!key || !nombre) {
      return res.status(400).json({ error: "Key and nombre are required" });
    }
    const pool = db.getPool();
    const { rows } = await pool.query(
      `INSERT INTO facciones (key, nombre, coordenadas)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         coordenadas = EXCLUDED.coordenadas
       RETURNING *`,
      [key, nombre, coordenadas || ""]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Error creating faccion:", error);
    res.status(500).json({ error: "Failed to create faccion" });
  }
});

router.delete("/facciones/:key", async (req, res) => {
  try {
    const pool = db.getPool();
    const { rowCount } = await pool.query("DELETE FROM facciones WHERE key = $1", [req.params.key]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Faccion not found" });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting faccion:", error);
    res.status(500).json({ error: "Failed to delete faccion" });
  }
});

module.exports = router;
