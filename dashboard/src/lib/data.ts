import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string): T[] {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJson<T>(filename: string, data: T[]) {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ── Seed inicial de datos de ejemplo ──

function seedIfEmpty() {
  ensureDir();

  const sedes = readJson<Sede>("sedes.json");
  if (sedes.length === 0) {
    writeJson("sedes.json", [
      { id: 1, name: "Almacen de Muelles", capacidad: "15 vs 15", coords_defensa: "124.5, -452.1, 35.8", coords_ataque: "-1092.3, 1542.8, 12.4" },
      { id: 2, name: "Mansion Vinewood", capacidad: "20 vs 20", coords_defensa: "200.0, 500.0, 80.0", coords_ataque: "-300.0, 600.0, 45.0" },
      { id: 3, name: "Laboratorio Paleto Bay", capacidad: "15 vs 15", coords_defensa: "50.0, 3000.0, 20.0", coords_ataque: "-100.0, 3100.0, 15.0" },
      { id: 4, name: "Bunker Sandy Shores", capacidad: "10 vs 10", coords_defensa: "1800.0, 2500.0, 40.0", coords_ataque: "1700.0, 2400.0, 30.0" },
    ]);
  }

  const facciones = readJson<Faccion>("facciones.json");
  if (facciones.length === 0) {
    writeJson("facciones.json", [
      { key: "lspd", nombre: "L.S.P.D.", coordenadas: "124.5, -452.1, 35.8" },
      { key: "cartel", nombre: "The Cartel", coordenadas: "-1092.3, 1542.8, 12.4" },
      { key: "vagos", nombre: "Vagos Gang", coordenadas: "300.0, -1200.0, 25.0" },
      { key: "ballas", nombre: "Ballas Family", coordenadas: "-150.0, 1600.0, 30.0" },
      { key: "lost_mc", nombre: "The Lost MC", coordenadas: "500.0, 2700.0, 45.0" },
      { key: "bratva", nombre: "Bratva Mafia", coordenadas: "-800.0, 1500.0, 10.0" },
    ]);
  }

  const matches = readJson<Match>("matches.json");
  if (matches.length === 0) {
    writeJson("matches.json", [
      {
        id: "match_1700000001",
        sede_name: "Almacen de Muelles",
        def_name: "L.S.P.D.",
        atk_name: "The Cartel",
        winner_name: "The Cartel",
        score_def: 0,
        score_atk: 1,
        rounds: 1,
        capacity: "15 vs 15",
        created_at: "2026-04-01T21:30:00.000Z",
        iso_year_week: "2026-W14",
        event_subtype: "asalto",
        creatorid: null,
        staffapoyo: [],
        fecha: "01/04/2026",
      },
      {
        id: "match_1700000002",
        sede_name: "Mansion Vinewood",
        def_name: "Vagos Gang",
        atk_name: "Ballas Family",
        winner_name: "Vagos Gang",
        score_def: 3,
        score_atk: 0,
        rounds: 3,
        capacity: "20 vs 20",
        created_at: "2026-03-30T18:15:00.000Z",
        iso_year_week: "2026-W13",
        event_subtype: "asalto",
        creatorid: null,
        staffapoyo: [],
        fecha: "30/03/2026",
      },
      {
        id: "br_1700000003",
        sede_name: "Cayo Perico Island",
        def_name: "Solo: Jax",
        atk_name: "14 jugadores",
        winner_name: "Solo: Jax",
        score_def: 1,
        score_atk: 0,
        rounds: 1,
        capacity: "15 jugadores",
        created_at: "2026-03-28T23:00:00.000Z",
        iso_year_week: "2026-W13",
        event_subtype: "br_cayo",
        creatorid: null,
        staffapoyo: [],
        fecha: "28/03/2026",
      },
    ]);
  }

  const ranking = readJson<RankingEntry>("ranking.json");
  if (ranking.length === 0) {
    writeJson("ranking.json", [
      { sede_name: "L.S.P.D.", wins: 12, losses: 3, points: 12, total_matches: 15 },
      { sede_name: "The Cartel", wins: 10, losses: 5, points: 10, total_matches: 15 },
      { sede_name: "Vagos Gang", wins: 8, losses: 4, points: 8, total_matches: 12 },
      { sede_name: "Ballas Family", wins: 6, losses: 6, points: 6, total_matches: 12 },
      { sede_name: "The Lost MC", wins: 5, losses: 7, points: 5, total_matches: 12 },
      { sede_name: "Bratva Mafia", wins: 3, losses: 9, points: 3, total_matches: 12 },
    ]);
  }
}

// ── Tipos ──

export interface Sede {
  id: number;
  name: string;
  capacidad: string;
  coords_defensa: string;
  coords_ataque: string;
}

export interface Faccion {
  key: string;
  nombre: string;
  coordenadas: string;
}

export interface Match {
  id: string;
  sede_name: string;
  def_name: string;
  atk_name: string;
  winner_name: string;
  score_def: number;
  score_atk: number;
  rounds: number;
  capacity: string;
  created_at: string;
  iso_year_week: string;
  event_subtype: string;
  creatorid: string | null;
  staffapoyo: string[];
  fecha: string;
}

export interface RankingEntry {
  sede_name: string;
  wins: number;
  losses: number;
  points: number;
  total_matches: number;
}

// ── API ──

export function getSedes(): Sede[] {
  return readJson<Sede>("sedes.json");
}

export function getFacciones(): Faccion[] {
  return readJson<Faccion>("facciones.json");
}

export function getMatches(): Match[] {
  return readJson<Match>("matches.json");
}

export function saveMatch(match: Match) {
  const matches = getMatches();
  matches.unshift(match);
  writeJson("matches.json", matches);
}

export function getRanking(): RankingEntry[] {
  return readJson<RankingEntry>("ranking.json");
}

// Inicializar seeds
seedIfEmpty();
