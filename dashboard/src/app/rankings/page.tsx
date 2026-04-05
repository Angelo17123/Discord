"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Trophy, Medal, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Match {
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
  creatorid: string;
  staffapoyo: string[];
  fecha: string;
}

interface RankingEntry {
  sede_name: string;
  wins: number;
  losses: number;
  points: number;
  total_matches: number;
}

export default function RankingsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "historical">("weekly");
  const [filterType, setFilterType] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      const [matchesRes, rankingRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/ranking"),
      ]);
      const matchesData = await matchesRes.json();
      const rankingData = await rankingRes.json();
      setMatches(matchesData);
      setRanking(rankingData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMatches = matches.filter((m) => {
    if (filterType === "All") return true;
    if (filterType === "Asalto") return !m.event_subtype || m.event_subtype === "asalto";
    if (filterType === "BR") return m.event_subtype?.startsWith("br_");
    if (filterType === "Rey del Crimen") return m.event_subtype === "rey_del_crimen";
    return true;
  });

  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

  const getEventTypeBadge = (subtype?: string) => {
    switch (subtype) {
      case "rey_del_crimen":
        return { label: "Rey del Crimen", bg: "bg-on-tertiary-fixed-variant", text: "text-white" };
      case "br_cayo":
        return { label: "Battle Royale Cayo", bg: "bg-secondary-container", text: "text-on-secondary-container" };
      case "br_ciudad":
        return { label: "Battle Royale Ciudad", bg: "bg-secondary-container", text: "text-on-secondary-container" };
      case "asalto":
        return { label: "Asalto", bg: "bg-primary-container", text: "text-on-primary-container" };
      default:
        return { label: "Asalto", bg: "bg-primary-container", text: "text-on-primary-container" };
    }
  };

  const top3 = ranking.slice(0, 3);

  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Rankings & History">
      <div className="pt-4 pb-12 max-w-7xl mx-auto">
        {/* Page Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2">
              RANKINGS E HISTORIAL
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Seguimiento del rendimiento elite de los organizadores de facciones.
            </p>
          </div>
          <div className="bg-surface-container-low p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-6 py-2 rounded-md font-headline font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === "weekly"
                  ? "bg-primary-container text-on-primary-container shadow-lg"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-6 py-2 rounded-md font-headline font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === "monthly"
                  ? "bg-primary-container text-on-primary-container shadow-lg"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setActiveTab("historical")}
              className={`px-6 py-2 rounded-md font-headline font-bold text-xs tracking-widest uppercase transition-all ${
                activeTab === "historical"
                  ? "bg-primary-container text-on-primary-container shadow-lg"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              Historico
            </button>
          </div>
        </div>

        {/* Top 3 Podium Bento */}
        {!loading && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {top3.map((entry, index) => {
              const isRank1 = index === 0;
              const isRank2 = index === 1;
              const borderColor = isRank1 ? "border-primary" : isRank2 ? "border-secondary" : "border-tertiary";
              const textColor = isRank1 ? "text-primary" : isRank2 ? "text-secondary" : "text-tertiary";
              const ringClass = isRank1 ? "ring-1 ring-primary/30 shadow-[0_20px_50px_rgba(255,84,76,0.15)] transform md:-translate-y-4" : "";

              return (
                <div
                  key={entry.sede_name}
                  className={`bg-surface-container${isRank1 ? "-high" : ""} h-full rounded-xl ${
                    isRank1 ? "p-8" : "p-6"
                  } relative overflow-hidden group border-b-2 ${borderColor}/20 ${ringClass}`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className={`w-${isRank1 ? "20" : "16"} h-${isRank1 ? "20" : "16"} ${textColor}`} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`relative mb-${isRank1 ? "6" : "4"}`}>
                      <div
                        className={`w-${isRank1 ? "28" : "20"} h-${isRank1 ? "28" : "20"} rounded-full border-${isRank1 ? "4" : "2"} ${borderColor} bg-surface-container-highest flex items-center justify-center`}
                      >
                        <span className={`text-${isRank1 ? "4xl" : "2xl"} font-black font-headline ${textColor}`}>
                          {entry.sede_name.charAt(0)}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-${isRank1 ? "3" : "2"} -right-${isRank1 ? "3" : "2"} ${
                          isRank1 ? "bg-primary" : isRank2 ? "bg-secondary" : "bg-tertiary"
                        } text-on-secondary-container w-${isRank1 ? "12" : "8"} h-${isRank1 ? "12" : "8"} rounded-full flex items-center justify-center font-bold font-headline ${
                          isRank1 ? "text-xl shadow-lg ring-4 ring-surface-container-high" : ""
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <h3 className={`font-headline font-${isRank1 ? "black" : "bold"} ${isRank1 ? "text-3xl" : "text-xl"} tracking-tight`}>
                      {entry.sede_name}
                    </h3>
                    <p className={`${textColor} ${isRank1 ? "text-sm" : "text-xs"} font-bold tracking-widest uppercase mb-${isRank1 ? "6" : "4"}`}>
                      {entry.wins} Victorias
                    </p>
                    <div className={`grid grid-cols-2 w-full gap-${isRank1 ? "4" : "2"}`}>
                      <div className={`bg-surface-container-lowest p-${isRank1 ? "4" : "3"} rounded-lg ${isRank1 ? "border border-primary/10" : ""}`}>
                        <span className={`block ${isRank1 ? "text-xs" : "text-[10px]"} text-on-surface-variant uppercase font-bold tracking-tighter`}>
                          Partidas
                        </span>
                        <span className={`${isRank1 ? "text-2xl" : "text-lg"} font-headline font-black`}>
                          {entry.total_matches}
                        </span>
                      </div>
                      <div className={`bg-surface-container-lowest p-${isRank1 ? "4" : "3"} rounded-lg ${isRank1 ? "border border-primary/10" : ""}`}>
                        <span className={`block ${isRank1 ? "text-xs" : "text-[10px]"} text-on-surface-variant uppercase font-bold tracking-tighter`}>
                          Puntos
                        </span>
                        <span className={`${isRank1 ? "text-2xl" : "text-lg"} font-headline font-black ${textColor}`}>
                          {entry.points}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-xl tracking-tighter uppercase flex items-center gap-2">
              <span className="w-2 h-6 bg-primary" /> Tabla Completa
            </h3>
          </div>
          <div className="overflow-x-auto rounded-xl bg-surface-container-low">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Sede</th>
                  <th className="px-6 py-4">Victorias</th>
                  <th className="px-6 py-4">Derrotas</th>
                  <th className="px-6 py-4">Partidas</th>
                  <th className="px-6 py-4 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ranking.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No hay datos de ranking disponibles
                    </td>
                  </tr>
                ) : (
                  ranking.map((entry, index) => (
                    <tr key={entry.sede_name} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-headline font-bold text-lg text-on-surface-variant">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center">
                            <span className="text-xs font-bold">{entry.sede_name.charAt(0)}</span>
                          </div>
                          <span className="font-bold">{entry.sede_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-400">{entry.wins}</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-400">{entry.losses}</td>
                      <td className="px-6 py-4 text-sm font-medium">{entry.total_matches}</td>
                      <td className="px-6 py-4 text-right font-headline font-bold text-primary">
                        {entry.points}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Matches History & Filters */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <h3 className="font-headline font-bold text-xl tracking-tighter uppercase flex items-center gap-2">
              <span className="w-2 h-6 bg-secondary" /> Historial de Partidas
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              {/* Filters */}
              <div className="flex items-center gap-2 bg-surface-container p-1 rounded-lg">
                {["All", "Asalto", "BR", "Rey del Crimen"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${
                      filterType === type
                        ? "bg-secondary text-on-secondary-container"
                        : "text-on-surface-variant hover:text-white"
                    }`}
                  >
                    {type === "All" ? "Todos" : type}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <select className="bg-surface-container border-none text-xs font-headline tracking-tighter rounded-lg pl-10 pr-10 py-2 focus:ring-1 focus:ring-secondary appearance-none">
                  <option>Sede: Todas</option>
                  <option>Los Santos</option>
                  <option>Cayo Perico</option>
                  <option>Paleto Bay</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-white/5 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Sede</th>
                  <th className="px-6 py-4">Ganador</th>
                  <th className="px-6 py-4">Marcador</th>
                  <th className="px-6 py-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedMatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No hay partidas registradas
                    </td>
                  </tr>
                ) : (
                  paginatedMatches.map((match) => {
                    const badge = getEventTypeBadge(match.event_subtype);
                    return (
                      <tr key={match.id} className="hover:bg-secondary/5 transition-colors group">
                        <td className="px-6 py-5 text-sm font-medium">
                          {match.fecha || new Date(match.created_at).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          <span className="text-on-surface-variant text-[10px] block">
                            {new Date(match.created_at).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm">{match.sede_name}</td>
                        <td className="px-6 py-5">
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                match.winner_name === match.def_name
                                  ? "bg-secondary shadow-[0_0_8px_#a2c9ff]"
                                  : "bg-primary shadow-[0_0_8px_#ffb4ac]"
                              }`}
                            />
                            <span className="font-bold">{match.winner_name}</span>
                          </span>
                        </td>
                        <td className="px-6 py-5 font-headline font-bold">
                          {match.score_def} - {match.score_atk}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                            Verificado
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredMatches.length)} de{" "}
                {filteredMatches.length} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                        currentPage === page
                          ? "bg-primary text-on-primary-container"
                          : "bg-surface-container hover:bg-surface-container-high"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Background Decoration / Light Leaks */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px] -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4" />
    </DashboardLayout>
  );
}
