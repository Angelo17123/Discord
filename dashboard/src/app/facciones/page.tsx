"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Shield, Swords, Eye, Edit2, Plus, X, RefreshCw } from "lucide-react";

interface Faccion {
  key: string;
  nombre: string;
  coordenadas: string;
  tipo: "ley" | "submundo" | "neutral";
  miembros: number;
  winRate: number;
  enfrentamientos: number;
}

const tipoMap: Record<string, "ley" | "submundo" | "neutral"> = {
  lspd: "ley",
  fbi: "ley",
  sheriff: "ley",
  cartel: "submundo",
  vagos: "submundo",
  ballas: "submundo",
  families: "submundo",
  marabunta: "submundo",
  lost_mc: "neutral",
  bratva: "submundo",
  triada: "submundo",
  yakuza: "submundo",
};

export default function FaccionesPage() {
  const [facciones, setFacciones] = useState<Faccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [newFaccion, setNewFaccion] = useState({ nombre: "", coordenadas: "", tipo: "submundo" as const });

  useEffect(() => {
    fetchFacciones();
  }, []);

  const fetchFacciones = async () => {
    try {
      const res = await fetch("/api/sedes");
      const data = await res.json();
      const mapped: Faccion[] = (Array.isArray(data) ? data : []).map((s: any) => ({
        key: s.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        nombre: s.name,
        coordenadas: s.coords_defensa || "N/A",
        tipo: tipoMap[s.name.toLowerCase().replace(/[^a-z0-9]/g, "_")] || "neutral",
        miembros: 0,
        winRate: 0,
        enfrentamientos: 0,
      }));
      setFacciones(mapped);
    } catch (e) {
      console.error("Error fetching facciones:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newFaccion.nombre || !newFaccion.coordenadas) return;
    try {
      const res = await fetch("/api/sedes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFaccion.nombre,
          capacidad: "15 vs 15",
          coords_defensa: newFaccion.coordenadas,
          coords_ataque: newFaccion.coordenadas,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewFaccion({ nombre: "", coordenadas: "", tipo: "submundo" });
        fetchFacciones();
      }
    } catch (e) {
      console.error("Error creating faccion:", e);
    }
  };

  const handleDelete = async (key: string) => {
    const item = facciones.find(f => f.key === key);
    if (!item || !confirm(`Eliminar "${item.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/sedes?name=${encodeURIComponent(item.nombre)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchFacciones();
      }
    } catch (e) {
      console.error("Error deleting faccion:", e);
    }
  };

  const filtered = filter === "all" ? facciones : facciones.filter((f) => f.tipo === filter);

  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Facciones">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 uppercase">
              Facciones
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Gestion de facciones y grupos organizados del servidor.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-bold font-headline uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_10px_30px_rgba(229,57,53,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Nueva Faccion
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Total Facciones</p>
            <p className="text-4xl font-black font-headline tracking-tighter">{loading ? "..." : facciones.length}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Ley</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-secondary">
              {facciones.filter(f => f.tipo === "ley").length}
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Swords className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Submundo</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-primary">
              {facciones.filter(f => f.tipo === "submundo").length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 bg-surface-container p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "Todas" },
            { key: "ley", label: "Ley" },
            { key: "submundo", label: "Submundo" },
            { key: "neutral", label: "Neutral" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${
                filter === f.key
                  ? "bg-secondary text-on-secondary-container"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-headline uppercase tracking-widest text-sm">
            Cargando facciones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {filtered.map((faccion) => {
              const colorMap = {
                ley: { bg: "bg-secondary/10", text: "text-secondary", border: "border-secondary/20" },
                submundo: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
                neutral: { bg: "bg-tertiary/10", text: "text-tertiary", border: "border-tertiary/20" },
              };
              const colors = colorMap[faccion.tipo];

              return (
                <div
                  key={faccion.key}
                  className="bg-surface-container rounded-xl p-6 relative overflow-hidden group hover:bg-surface-container-high transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center border ${colors.border}`}>
                        <Shield className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-headline">{faccion.nombre}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                          {faccion.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(faccion.key)}
                        className="p-2 hover:bg-red-900/30 rounded transition-colors text-gray-500 hover:text-red-400"
                      >
                        <Edit2 className="w-4 h-4 rotate-45" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mb-1">Coordenadas</p>
                    <code className="text-xs font-mono text-gray-400">{faccion.coordenadas}</code>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black font-headline uppercase">Nueva Faccion</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Nombre</label>
                  <input
                    value={newFaccion.nombre}
                    onChange={(e) => setNewFaccion(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="Nombre de la faccion"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Coordenadas</label>
                  <input
                    value={newFaccion.coordenadas}
                    onChange={(e) => setNewFaccion(prev => ({ ...prev, coordenadas: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="x, y, z, heading"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Tipo</label>
                  <select
                    value={newFaccion.tipo}
                    onChange={(e) => setNewFaccion(prev => ({ ...prev, tipo: e.target.value as "ley" | "submundo" | "neutral" }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                  >
                    <option value="ley">Ley</option>
                    <option value="submundo">Submundo</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <button
                  onClick={handleCreate}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-bold font-headline uppercase tracking-widest text-xs"
                >
                  Crear Faccion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
