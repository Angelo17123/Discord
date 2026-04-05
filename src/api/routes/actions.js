const express = require("express");
const assaultPersistence = require("../../services/assaultPersistence");

module.exports = function actionRoutes(client, sessionManager, broadcast) {
  const router = express.Router();

  router.post("/score", async (req, res) => {
    try {
      const { sessionId, team, round } = req.body;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const teamObj = team === "def" ? session.teamA : session.teamB;
      teamObj.points += 1;

      session.currentRound = round || session.currentRound;
      sessionManager.updateSession(sessionId, session);

      broadcast({
        type: "score_update",
        sessionId,
        team,
        score: teamObj.points,
        round: session.currentRound,
        teamA: session.teamA,
        teamB: session.teamB,
      });

      res.json({ ok: true, teamA: session.teamA, teamB: session.teamB });
    } catch (error) {
      console.error("Error updating score:", error);
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  router.post("/next-round", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      session.currentRound += 1;
      sessionManager.updateSession(sessionId, session);

      broadcast({
        type: "round_change",
        sessionId,
        round: session.currentRound,
      });

      res.json({ ok: true, round: session.currentRound });
    } catch (error) {
      console.error("Error changing round:", error);
      res.status(500).json({ error: "Failed to change round" });
    }
  });

  router.post("/swap-roles", async (req, res) => {
    try {
      const { sessionId } = req.body;
      sessionManager.swapRoles(sessionId);
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      broadcast({
        type: "roles_swapped",
        sessionId,
        teamA: session.teamA,
        teamB: session.teamB,
      });

      res.json({ ok: true, teamA: session.teamA, teamB: session.teamB });
    } catch (error) {
      console.error("Error swapping roles:", error);
      res.status(500).json({ error: "Failed to swap roles" });
    }
  });

  router.post("/announce", async (req, res) => {
    try {
      const { channelId, message } = req.body;
      if (!channelId || !message) {
        return res.status(400).json({ error: "channelId and message are required" });
      }

      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      await channel.send(message);

      broadcast({
        type: "announcement",
        channelId,
        message,
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error sending announcement:", error);
      res.status(500).json({ error: "Failed to send announcement" });
    }
  });

  router.post("/finish-event", async (req, res) => {
    try {
      const { sessionId } = req.body;
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const result = await assaultPersistence.saveFinishedAssault(session, sessionId);

      const db = require("../../infrastructure/database/PostgresConnection");
      const pool = db.getPool();
      await pool.query(
        "UPDATE sedes SET uso_count = COALESCE(uso_count, 0) + 1 WHERE name = $1",
        [session.sede]
      );

      sessionManager.deleteSession(sessionId);

      broadcast({
        type: "event_finished",
        sessionId,
        result,
      });

      res.json({ ok: true, result });
    } catch (error) {
      console.error("Error finishing event:", error);
      res.status(500).json({ error: "Failed to finish event" });
    }
  });

  router.post("/cancel-event", async (req, res) => {
    try {
      const { sessionId } = req.body;
      sessionManager.deleteSession(sessionId);

      broadcast({
        type: "event_cancelled",
        sessionId,
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Error cancelling event:", error);
      res.status(500).json({ error: "Failed to cancel event" });
    }
  });

  router.post("/add-staff", async (req, res) => {
    try {
      const { sessionId, userId } = req.body;
      const added = sessionManager.addStaff(sessionId, userId);
      if (!added) {
        return res.status(404).json({ error: "Session not found or user already added" });
      }

      const session = sessionManager.getSession(sessionId);
      broadcast({
        type: "staff_added",
        sessionId,
        staff: session.staff,
      });

      res.json({ ok: true, staff: session.staff });
    } catch (error) {
      console.error("Error adding staff:", error);
      res.status(500).json({ error: "Failed to add staff" });
    }
  });

  return router;
};
