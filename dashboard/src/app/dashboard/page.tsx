"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Swords, Pause, RotateCcw, Gavel, SkipForward, AlertTriangle, X, Copy, Zap } from "lucide-react";
import { apiClient, createWebSocket, WsMessage, Match, Sede, TeamInfo } from "@/lib/api-client";

const DISCORD_CHANNEL_ID = process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID || "";

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [teamA, setTeamA] = useState<TeamInfo>({ name: "—", points: 0, role: "Defensa" });
  const [teamB, setTeamB] = useState<TeamInfo>({ name: "—", points: 0, role: "Ataque" });
  const [currentRound, setCurrentRound] = useState(1);

  const [timeRemaining, setTimeRemaining] = useState(15 * 60);
  const [isPaused, setIsPaused] = useState(false);

  const [notifications, setNotifications] = useState<string[]>([]);
  const [manualNotification, setManualNotification] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

  const addNotif = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    setNotifications((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 100));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [matchesRes, sedesRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/sedes"),
      ]);

      if (!matchesRes.ok || !sedesRes.ok) {
        throw new Error("Failed to fetch data from bot API");
      }

      const [matchesData, sedesData] = await Promise.all([
        matchesRes.json(),
        sedesRes.json(),
      ]);

      setMatches(matchesData);
      setSedes(sedesData);
      setApiError(null);

      if (matchesData.length > 0) {
        const last = matchesData[0];
        setTeamA({ name: last.def_name || "—", points: last.score_def || 0, role: "Defensa" });
        setTeamB({ name: last.atk_name || "—", points: last.score_atk || 0, role: "Ataque" });
        setCurrentRound(last.rounds || 1);
      }
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ws = createWebSocket((msg: WsMessage) => {
      switch (msg.type) {
        case "score_update":
          setTeamA(msg.teamA);
          setTeamB(msg.teamB);
          setCurrentRound(msg.round);
          addNotif(`Puntuación R${msg.round}: ${msg.team === "def" ? msg.teamA.name : msg.teamB.name} → ${msg.score}`);
          break;
        case "round_change":
          setCurrentRound(msg.round);
          addNotif(`Ronda ${msg.round} iniciada`);
          break;
        case "roles_swapped":
          setTeamA(msg.teamA);
          setTeamB(msg.teamB);
          addNotif("Roles intercambiados");
          break;
        case "event_finished":
          addNotif("Evento finalizado y guardado");
          fetchData();
          break;
        case "event_cancelled":
          addNotif("Evento cancelado");
          break;
        case "announcement":
          addNotif(`Anuncio en Discord: ${msg.message.substring(0, 60)}...`);
          break;
      }
    });

    wsRef.current = ws;

    return () => {
      ws?.close();
    };
  }, [addNotif, fetchData]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const lastMatch = matches[0];
  const sessionActive = lastMatch && (lastMatch.score_def === 0 && lastMatch.score_atk === 0) || (lastMatch && lastMatch.score_def < 2 && lastMatch.score_atk < 2);
  const currentSede = sedes.find((s) => s.name === lastMatch?.sede_name) || sedes[0];

  const defCoords = currentSede?.coords_defensa || "—";
  const atkCoords = currentSede?.coords_ataque || "—";

  const handleScore = async (team: "def" | "atk") => {
    if (!lastMatch?.id) return;
    try {
      const res = await apiClient.postScore(lastMatch.id, team, currentRound);
      setTeamA(res.teamA);
      setTeamB(res.teamB);
      addNotif(`+1 ${team === "def" ? "Defensa" : "Ataque"} → ${team === "def" ? res.teamA.points : res.teamB.points}`);
      fetchData();
    } catch (err: any) {
      addNotif(`Error puntuando: ${err.message}`);
    }
  };

  const handleNextRound = async () => {
    if (!lastMatch?.id) return;
    try {
      const res = await apiClient.postNextRound(lastMatch.id);
      setCurrentRound(res.round);
      addNotif(`Ronda ${res.round} iniciada`);
      fetchData();
    } catch (err: any) {
      addNotif(`Error cambiando ronda: ${err.message}`);
    }
  };

  const handleSwapRoles = async () => {
    if (!lastMatch?.id) return;
    try {
      const res = await apiClient.postSwapRoles(lastMatch.id);
      setTeamA(res.teamA);
      setTeamB(res.teamB);
      addNotif("Roles intercambiados");
      fetchData();
    } catch (err: any) {
      addNotif(`Error intercambiando roles: ${err.message}`);
    }
  };

  const handleAnnounce = async (message: string) => {
    if (!DISCORD_CHANNEL_ID) return;
    try {
      await apiClient.postAnnounce(DISCORD_CHANNEL_ID, message);
      addNotif(`Anuncio enviado a Discord`);
    } catch (err: any) {
      addNotif(`Error enviando anuncio: ${err.message}`);
    }
  };

  const handleFinishEvent = async () => {
    if (!lastMatch?.id) return;
    if (!confirm("¿Finalizar el evento y guardar el resultado?")) return;
    try {
      await apiClient.postFinishEvent(lastMatch.id);
      addNotif("Evento finalizado");
      fetchData();
    } catch (err: any) {
      addNotif(`Error finalizando evento: ${err.message}`);
    }
  };

  const handleCancelEvent = async () => {
    if (!lastMatch?.id) return;
    if (!confirm("¿Cancelar el evento sin guardar?")) return;
    try {
      await apiClient.postCancelEvent(lastMatch.id);
      addNotif("Evento cancelado");
      fetchData();
    } catch (err: any) {
      addNotif(`Error cancelando evento: ${err.message}`);
    }
  };

  const handleSendNotification = async () => {
    if (!manualNotification.trim()) return;
    addNotif(manualNotification);
    if (DISCORD_CHANNEL_ID) {
      await handleAnnounce(manualNotification);
    }
    setManualNotification("");
  };

  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Event Protocol 4.2">
      {apiError && (
        <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
          Error de API: {apiError} — Verificá que el bot esté encendido y BOT_API_SECRET configurado.
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-headline uppercase tracking-widest text-primary mb-1">
              Sede Actual
            </p>
            <h2 className="text-3xl font-black font-headline tracking-tighter text-on-surface">
              {loading ? "Cargando..." : (lastMatch?.sede_name || currentSede?.name || "Sin evento activo")}
            </h2>
            <div className="flex items-center gap-2 mt-4">
              <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${sessionActive ? "bg-green-500 shadow-green-500" : "bg-red-600 shadow-red-600"}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${sessionActive ? "text-green-500" : "text-red-500"}`}>
                {sessionActive ? "Evento En Vivo" : "Sin evento activo"}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-surface-container-high rounded-lg p-6 flex items-center justify-between">
          <div className="text-center">
            <p className="text-[10px] font-headline uppercase text-secondary mb-2 tracking-widest">
              {teamA.role}
            </p>
            <div className="w-16 h-16 bg-secondary-container/20 flex items-center justify-center rounded-lg mb-2 mx-auto border border-secondary/20">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <span className="text-sm font-bold font-headline">
              {teamA.name || lastMatch?.def_name || "—"}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="px-4 py-1 bg-surface-container-lowest rounded-full border border-white/5 mb-2">
              <span className="text-[10px] font-black font-headline text-gray-500 uppercase">
                VS
              </span>
            </div>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-headline uppercase text-primary mb-2 tracking-widest">
              {teamB.role}
            </p>
            <div className="w-16 h-16 bg-primary-container/20 flex items-center justify-center rounded-lg mb-2 mx-auto border border-primary/20">
              <Swords className="w-8 h-8 text-primary" />
            </div>
            <span className="text-sm font-bold font-headline">
              {teamB.name || lastMatch?.atk_name || "—"}
            </span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest rounded-lg p-6 border-l-4 border-primary flex flex-col items-center justify-center">
          <span className="text-[10px] font-headline uppercase tracking-widest text-gray-500 mb-1">
            Tiempo Restante
          </span>
          <span className="text-5xl font-black font-headline tracking-tighter tabular-nums text-on-surface">
            {formatTime(timeRemaining)}
          </span>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 text-[10px] font-bold transition-colors uppercase flex items-center gap-1"
            >
              <Pause className="w-3 h-3" />
              {isPaused ? "Reanudar" : "Pausa"}
            </button>
            <button
              onClick={() => setTimeRemaining(15 * 60)}
              className="px-3 py-1 bg-white/5 rounded hover:bg-white/10 text-[10px] font-bold transition-colors uppercase flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {[0, 1, 2].map((index) => {
              const roundNum = index + 1;
              const isActive = roundNum === currentRound;
              const isCompleted = roundNum < currentRound;
              const isLocked = roundNum > currentRound;

              const showRound3 = teamA.points === 1 && teamB.points === 1;
              const isRound3Hidden = roundNum === 3 && !showRound3 && currentRound < 3;

              const defScore = roundNum < currentRound ? (teamA.points > teamB.points ? 1 : 0) : (isActive ? teamA.points : 0);
              const atkScore = roundNum < currentRound ? (teamB.points > teamA.points ? 1 : 0) : (isActive ? teamB.points : 0);

              if (isRound3Hidden) {
                return (
                  <div
                    key={index}
                    className="rounded-lg p-4 relative bg-surface-container border-b-2 border-white/5 opacity-50 flex flex-col items-center justify-center min-h-[200px]"
                  >
                    <span className="text-[10px] font-headline uppercase text-gray-600">Ronda 3</span>
                    <span className="text-xs font-bold text-gray-500 mt-2">
                      {teamA.points === 2 || teamB.points === 2 ? "No necesaria" : "Pendiente"}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`rounded-lg p-4 relative ${
                    isActive
                      ? "bg-surface-container-high ring-1 ring-secondary/20 border-b-2 border-secondary"
                      : isCompleted
                      ? "bg-surface-container border-b-2 border-primary/50"
                      : "bg-surface-container border-b-2 border-white/5 opacity-50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-secondary text-on-secondary px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      Activa
                    </div>
                  )}
                  {roundNum === 3 && showRound3 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                      Decisiva
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-headline font-bold ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                      RONDA {String(roundNum).padStart(2, "0")}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-primary">COMPLETADA</span>
                    )}
                  </div>
                  <div className="flex justify-center items-baseline gap-4 mb-6">
                    <span className={`font-black font-headline ${isActive ? "text-5xl text-secondary" : "text-4xl text-secondary"} ${isLocked ? "text-gray-700" : ""}`}>
                      {defScore}
                    </span>
                    <span className={`text-xl ${isActive ? "text-gray-400" : "text-gray-600"}`}>-</span>
                    <span className={`font-black font-headline ${isActive ? "text-5xl text-primary" : "text-4xl text-primary"} ${isLocked ? "text-gray-700" : ""}`}>
                      {atkScore}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScore("def")}
                      disabled={isLocked || !sessionActive}
                      className={`flex-1 py-2 text-[10px] font-bold rounded uppercase transition-all ${
                        isLocked || !sessionActive
                          ? "bg-white/5 text-gray-600 cursor-not-allowed"
                          : isActive
                          ? "bg-secondary text-on-secondary shadow-[0_0_15px_rgba(51,148,241,0.4)]"
                          : "bg-secondary/10 hover:bg-secondary/20 text-secondary"
                      }`}
                    >
                      +1 DEF
                    </button>
                    <button
                      onClick={() => handleScore("atk")}
                      disabled={isLocked || !sessionActive}
                      className={`flex-1 py-2 text-[10px] font-bold rounded uppercase transition-all ${
                        isLocked || !sessionActive
                          ? "bg-white/5 text-gray-600 cursor-not-allowed"
                          : isActive
                          ? "bg-primary/20 text-on-primary-container border border-primary/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      +1 ATK
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg">
            <h3 className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Comandos Estrategicos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => handleAnnounce(`📜 [REGLAS DE ASALTO]\n🚫 NO reanimar | 🔇 0 Toxicidad | 🧍 Sin animaciones\n📍 Respetar límites | 🚗 VEHÍCULOS: SOLO ATACANTES`)}
                disabled={!DISCORD_CHANNEL_ID}
                className="bg-surface-container-high hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-md flex flex-col items-center gap-2 group transition-all duration-200"
              >
                <Gavel className="w-6 h-6 text-gray-400 group-hover:text-white" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Reglas</span>
              </button>
              <button
                onClick={() => handleAnnounce(`⏳ [AVISO]\n5 MINUTOS PARA PREPARARSE\n⚔️ ENFRENTAMIENTO: ${teamA.name} vs ${teamB.name}\n🛡️ PREPAREN ARMAMENTO Y POSICIONES`)}
                disabled={!DISCORD_CHANNEL_ID}
                className="bg-surface-container-high hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-md flex flex-col items-center gap-2 group transition-all duration-200"
              >
                <SkipForward className="w-6 h-6 text-gray-400 group-hover:text-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-tight">5 Minutos</span>
              </button>
              <button
                onClick={handleNextRound}
                disabled={!lastMatch?.id}
                className="bg-surface-container-high hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-md flex flex-col items-center gap-2 group transition-all duration-200"
              >
                <SkipForward className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Siguiente Ronda</span>
              </button>
              <button
                onClick={handleSwapRoles}
                disabled={!lastMatch?.id}
                className="bg-primary/10 border border-primary/20 hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-md flex flex-col items-center gap-2 group transition-all duration-200"
              >
                <AlertTriangle className="w-6 h-6 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tight text-primary">
                  Swap Roles
                </span>
              </button>
              <button
                onClick={handleFinishEvent}
                disabled={!lastMatch?.id}
                className="bg-white/5 hover:bg-red-900/40 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-md flex flex-col items-center gap-2 group transition-all duration-200"
              >
                <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Finalizar</span>
              </button>
            </div>
          </div>

          <div className="bg-surface-container p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-headline uppercase tracking-widest text-gray-500">
                Coordenadas de Despliegue
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-surface-container-lowest p-3 rounded border-l-2 border-secondary">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase">
                    Spawn {teamA.role}
                  </p>
                  <code className="text-xs font-mono text-gray-400">
                    TP {defCoords}
                  </code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`TP ${defCoords}`)}
                  className="p-2 hover:bg-white/5 rounded transition-colors text-gray-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between bg-surface-container-lowest p-3 rounded border-l-2 border-primary">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase">
                    Spawn {teamB.role}
                  </p>
                  <code className="text-xs font-mono text-gray-400">
                    TP {atkCoords}
                  </code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`TP ${atkCoords}`)}
                  className="p-2 hover:bg-white/5 rounded transition-colors text-gray-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-lg overflow-hidden border border-white/5">
            <div className="bg-[#5865F2]/10 px-4 py-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5865F2]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5865F2]">
                  Discord Webhook Live
                </span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${wsRef.current?.readyState === 1 ? "bg-green-500" : "bg-yellow-500"}`} />
            </div>
            <div className="p-4 h-64 overflow-y-auto space-y-3 font-mono text-[11px]">
              {notifications.length === 0 ? (
                <div className="text-gray-500">Esperando actividad...</div>
              ) : (
                notifications.map((notif, i) => (
                  <div key={i} className="text-gray-500">
                    {notif}
                  </div>
                ))
              )}
              <div className="animate-pulse border-l-2 border-primary pl-2">
                <span className="text-primary font-bold">EN VIVO:</span> Ronda {currentRound} en progreso...
              </div>
            </div>
            <div className="p-3 bg-surface-container border-t border-white/5 flex gap-2">
              <input
                className="flex-1 bg-surface-container-lowest border-none text-[10px] focus:ring-0 placeholder-gray-600 rounded px-3 py-2"
                placeholder="Enviar notificacion manual..."
                value={manualNotification}
                onChange={(e) => setManualNotification(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendNotification()}
              />
              <button
                onClick={handleSendNotification}
                className="bg-secondary p-1.5 rounded text-on-secondary"
              >
                <span className="text-sm">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
