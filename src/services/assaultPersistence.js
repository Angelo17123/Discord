const PostgresMatchRepository = require("../infrastructure/database/postgres/PostgresMatchRepository");
const localRegistro = require("./localRegistro");

function getISOYearWeekString(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNo =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${date.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function getWeekNumber(d = new Date()) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNo =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return weekNo;
}
function getMonthString(d = new Date()) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
function getISOYearWeekFromNumber(weekNum, year = new Date().getFullYear()) {
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}
function resolveWeekQuery(raw) {
  if (raw == null) return getISOYearWeekString();
  const s = String(raw).trim();
  if (s === "") return getISOYearWeekString();
  if (s === "0" || /^actual|ahora|current|hoy$/i.test(s)) {
    return getISOYearWeekString();
  }
  const isoMatch = s.match(/^(\d{4})-W(\d{1,2})$/i);
  if (isoMatch) {
    const y = isoMatch[1];
    const w = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
    return `${y}-W${w}`;
  }
  const onlyDigits = s.match(/^(\d{1,2})$/);
  if (onlyDigits) {
    const num = parseInt(onlyDigits[1], 10);
    if (num >= 1 && num <= 53) {
      const y = new Date().getFullYear();
      return `${y}-W${String(num).padStart(2, "0")}`;
    }
  }
  return s;
}
function sessionToMatchRecord(session, sessionId, creatorId) {
  const targetWins = session.isBicicleta ? 3 : 2;
  const winnerTeam = session.teamA.points >= targetWins ? session.teamA : session.teamB;
  const defTeam = session.teamA.role === "Defensa" ? session.teamA : session.teamB;
  const atkTeam = session.teamA.role === "Ataque" ? session.teamA : session.teamB;
  const capRaw = (session.capacity || "").toString();
  const num = capRaw.match(/\d+/);
  const capStr = num ? `${num[0]} vs ${num[0]}` : capRaw;
  const now = new Date();
  const fechaCompleta = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const staffApoyo = (session.staff || []).filter(id => id !== creatorId);
  return {
    id: `es_${Date.now()}_${sessionId}`,
    location: { name: session.sede },
    defTeam: { name: defTeam.name },
    atkTeam: { name: atkTeam.name },
    winner: { name: winnerTeam.name },
    scoreDef: defTeam.points,
    scoreAtk: atkTeam.points,
    round: session.currentRound,
    capacity: capStr,
    leonesIds: session.staff || [],
    creatorId: creatorId,
    staffApoyo: staffApoyo,
    fecha: fechaCompleta,
    isRanked: true,
    isoYearWeek: getISOYearWeekString(),
    eventSubtype: session.subtype || "normal",
    source: "entretenimiento_system",
  };
}
function matchToLocalRecord(match) {
  return {
    id: match.id,
    savedAt: new Date().toISOString(),
    isoYearWeek: match.isoYearWeek,
    sede_name: match.location.name,
    def_name: match.defTeam.name,
    atk_name: match.atkTeam.name,
    winner_name: match.winner.name,
    score_def: match.scoreDef,
    score_atk: match.scoreAtk,
    rounds: match.round,
    capacity: match.capacity,
    event_subtype: match.eventSubtype,
    leonesIds: match.leonesIds,
    creatorId: match.creatorId,
    staffApoyo: match.staffApoyo || [],
    fecha: match.fecha,
  };
}
async function saveBrEvent(session, sessionId, extra = {}) {
  const now = new Date();
  const fechaCompleta = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const creatorId = session.creatorId || session.staff?.[0];
  const staffApoyo = (session.staff || []).filter(id => id !== creatorId);
  const match = {
    id: `br_${Date.now()}_${sessionId}`,
    location: { name: session.sede || session.brType || 'BR' },
    defTeam: { name: 'BR' },
    atkTeam: { name: 'BR' },
    winner: { name: extra.winner || session.sede || 'BR' },
    scoreDef: 0,
    scoreAtk: 0,
    round: 0,
    capacity: session.staff?.length ? `${session.staff.length} leones` : 'N/A',
    leonesIds: session.staff || [],
    creatorId: creatorId,
    staffApoyo: staffApoyo,
    fecha: fechaCompleta,
    isRanked: true,
    isoYearWeek: getISOYearWeekString(),
    eventSubtype: session.brType === 'rey' ? 'rey_del_crimen' : session.brType === 'cayo' ? 'br_cayo' : 'br_ciudad',
    source: 'entretenimiento_system',
  };
  let pgOk = false;
  try {
    await PostgresMatchRepository.save(match);
    pgOk = true;
    console.log(`💾 BR ${match.id} guardado PostgreSQL (${match.eventSubtype}).`);
  } catch (e) {
    console.error('❌ Error guardando BR en PostgreSQL:', e);
  }
  try {
    const localRow = matchToLocalRecord(match);
    localRegistro.appendAssault(localRow);
  } catch (e) {
    console.error('⚠️ Error guardando BR en LOCALREGISTRO (no crítico):', e.message);
  }
  return {
    ok: pgOk,
    matchId: match.id,
    isoYearWeek: match.isoYearWeek,
    local: true,
    postgres: pgOk,
  };
}
async function saveFinishedAssault(session, sessionId) {
  if (session.isBicicleta) {
    return { ok: false, reason: "not_assault" };
  }
  const creatorId = session.creatorId || session.staff?.[0];
  const match = sessionToMatchRecord(session, sessionId, creatorId);
  const localRow = matchToLocalRecord(match);
  let pgOk = false;
  try {
    await PostgresMatchRepository.save(match);
    pgOk = true;
    console.log(`💾 Asalto ${match.id} guardado PostgreSQL.`);
  } catch (e) {
    console.error("❌ Error guardando asalto en PostgreSQL:", e);
    return { ok: false, reason: "postgres_error", error: e.message };
  }
  try {
    localRegistro.appendAssault(localRow);
  } catch (e) {
    console.error("⚠️ Error guardando en LOCALREGISTRO (no crítico):", e.message);
  }
  return {
    ok: true,
    matchId: match.id,
    isoYearWeek: match.isoYearWeek,
    local: true,
    postgres: pgOk,
  };
}
async function getAssaultsByUser(userId, isoYearWeek = null) {
  const all = await PostgresMatchRepository.getAllMatches();
  let filtered = all.filter(r => r.creatorid === userId);
  if (isoYearWeek) {
    filtered = filtered.filter(r => r.iso_year_week === isoYearWeek);
  }
  return filtered;
}
async function getRanking(isoYearWeek = null) {
  const all = await PostgresMatchRepository.getAllMatches();
  const userStats = {};
  for (const record of all) {
    if (isoYearWeek && record.iso_year_week !== isoYearWeek) continue;
    const allParticipants = [record.creatorid, ...(record.staffapoyo || [])].filter(Boolean);
    for (const userId of allParticipants) {
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId,
          count: 0,
          assaults: []
        };
      }
      userStats[userId].count++;
      const tipo = record.event_subtype === 'rey_del_crimen' ? '👑 Rey' :
                   record.event_subtype === 'br_cayo' ? '🏝️ BR Cayo' :
                   record.event_subtype === 'br_ciudad' ? '🏢 BR Ciudad' :
                   record.event_subtype === 'bicicleta' ? '🚲 Bicicleta' : '⚔️ Asalto';
      userStats[userId].assaults.push({
        sede: record.sede_name,
        fecha: record.fecha,
        winner: record.winner_name,
        def: record.def_name,
        atk: record.atk_name,
        score: `${record.score_def}-${record.score_atk}`,
        id: record.id,
        rol: userId === record.creatorid ? 'Creador' : 'Apoyo',
        tipo: tipo
      });
    }
  }
  return Object.values(userStats).sort((a, b) => b.count - a.count);
}
function getWeeksInMonth(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let currentWeek = getISOYearWeekString(firstDay);
  weeks.push(currentWeek);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 7)) {
    const weekStr = getISOYearWeekString(d);
    if (!weeks.includes(weekStr)) {
      weeks.push(weekStr);
    }
  }
  return weeks.sort();
}
async function getRankingMensual() {
  const all = await PostgresMatchRepository.getAllMatches();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const userStats = {};
  for (const record of all) {
    if (!record.created_at) continue;
    const d = new Date(record.created_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const allParticipants = [record.creatorid, ...(record.staffapoyo || [])].filter(Boolean);
    for (const userId of allParticipants) {
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId,
          count: 0,
          assaults: []
        };
      }
      userStats[userId].count++;
      const tipo = record.event_subtype === 'rey_del_crimen' ? '👑 Rey' :
                   record.event_subtype === 'br_cayo' ? '🏝️ BR Cayo' :
                   record.event_subtype === 'br_ciudad' ? '🏢 BR Ciudad' :
                   record.event_subtype === 'bicicleta' ? '🚲 Bicicleta' : '⚔️ Asalto';
      userStats[userId].assaults.push({
        sede: record.sede_name,
        fecha: record.fecha,
        winner: record.winner_name,
        def: record.def_name,
        atk: record.atk_name,
        score: `${record.score_def}-${record.score_atk}`,
        id: record.id,
        rol: userId === record.creatorid ? 'Creador' : 'Apoyo',
        tipo: tipo
      });
    }
  }
  return Object.values(userStats).sort((a, b) => b.count - a.count);
}
async function getAssaultsByUserMensual(userId) {
  const all = await PostgresMatchRepository.getAllMatches();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return all.filter(r => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) return false;
    const participants = [r.creatorid, ...(r.staffapoyo || [])];
    return participants.includes(userId);
  });
}
module.exports = {
  getISOYearWeekString,
  getWeekNumber,
  getMonthString,
  getISOYearWeekFromNumber,
  getWeeksInMonth,
  resolveWeekQuery,
  sessionToMatchRecord,
  saveFinishedAssault,
  saveBrEvent,
  readLocalWeek: localRegistro.readWeek,
  getAssaultsByUser,
  getRanking,
  getRankingMensual,
  getAssaultsByUserMensual,
};
