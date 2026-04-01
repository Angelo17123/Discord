const fs = require('fs');
const path = require('path');
class SessionManager {
constructor() {
this.filePath = path.join(__dirname, '..', 'data', 'sessions.json');
this.sessions = new Map();
this._ensureDir();
this.load();
}
_ensureDir() {
const dir = path.dirname(this.filePath);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
}
save() {
const data = Object.fromEntries(this.sessions);
fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
}
load() {
if (fs.existsSync(this.filePath)) {
try {
const data = JSON.parse(fs.readFileSync(this.filePath));
this.sessions = new Map(Object.entries(data));
} catch (e) {
console.error('❌ Error cargando sesiones persistentes:', e);
this.sessions = new Map();
}
}
}
createSession(channelId, data) {
const sessionData = {
id: channelId,
sede: data.sede,
capacity: data.capacity,
isBicicleta: data.isBicicleta || false,
currentRound: 1,
teamA: {
name: data.defenders,
points: 0,
role: 'Defensa'
},
teamB: {
name: data.attackers,
points: 0,
role: 'Ataque'
},
staff: data.staff,
creatorId: data.creatorId || data.staff?.[0]
};
this.sessions.set(channelId, sessionData);
this.save();
return sessionData;
}
getSession(channelId) {
return this.sessions.get(channelId);
}
updateSession(channelId, newData) {
if (this.sessions.has(channelId)) {
const current = this.sessions.get(channelId);
const updated = { ...current, ...newData };
this.sessions.set(channelId, updated);
this.save();
return updated;
}
return null;
}
deleteSession(channelId) {
const deleted = this.sessions.delete(channelId);
if (deleted) this.save();
return deleted;
}
addStaff(channelId, userId) {
const session = this.getSession(channelId);
if (session) {
if (!Array.isArray(session.staff)) session.staff = [];
if (!session.staff.includes(userId)) {
session.staff.push(userId);
this.updateSession(channelId, session);
return true;
}
}
return false;
}
swapRoles(channelId) {
const session = this.getSession(channelId);
if (session) {
const tempRole = session.teamA.role;
session.teamA.role = session.teamB.role;
session.teamB.role = tempRole;
this.updateSession(channelId, session);
}
}
}
module.exports = new SessionManager();
