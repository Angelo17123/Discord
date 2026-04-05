"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Building2, MapPin, Users, Copy, Plus, Edit2, Trash2, X } from "lucide-react";

interface Sede {
  id: number;
  name: string;
  capacidad: string;
  coords_defensa: string;
  coords_ataque: string;
  uso_count: number;
}

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSede, setNewSede] = useState({ name: "", capacidad: "15 vs 15", coords_defensa: "", coords_ataque: "" });

  useEffect(() => {
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    try {
      const res = await fetch("/api/sedes");
      const data = await res.json();
      const mapped: Sede[] = (Array.isArray(data) ? data : []).map((s: any) => ({
        id: s.id,
        name: s.name,
        capacidad: s.capacidad || "N/A",
        coords_defensa: s.coords_defensa || "N/A",
        coords_ataque: s.coords_ataque || "N/A",
        uso_count: s.uso_count || 0,
      }));
      setSedes(mapped);
    } catch (e) {
      console.error("Error fetching sedes:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyCoords = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreate = async () => {
    if (!newSede.name) return;
    try {
      const res = await fetch("/api/sedes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSede),
      });
      if (res.ok) {
        setShowModal(false);
        setNewSede({ name: "", capacidad: "15 vs 15", coords_defensa: "", coords_ataque: "" });
        fetchSedes();
      }
    } catch (e) {
      console.error("Error creating sede:", e);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Eliminar sede "${name}"?`)) return;
    try {
      const res = await fetch(`/api/sedes?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSedes();
      }
    } catch (e) {
      console.error("Error deleting sede:", e);
    }
  };

  const mostUsed = sedes.length > 0
    ? sedes.reduce((a, b) => (a.uso_count || 0) > (b.uso_count || 0) ? a : b)
    : { name: "N/A", uso_count: 0 };

  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Sedes">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 uppercase">
              Sedes
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Ubicaciones y coordenadas de las sedes disponibles para enfrentamientos.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-bold font-headline uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_10px_30px_rgba(229,57,53,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Nueva Sede
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Building2 className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Total Sedes</p>
            <p className="text-4xl font-black font-headline tracking-tighter">{loading ? "..." : sedes.length}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MapPin className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Mas Usada</p>
            <p className="text-xl font-black font-headline tracking-tighter text-secondary truncate">
              {loading ? "..." : `${mostUsed.name} (${mostUsed.uso_count || 0})`}
            </p>
          </div>
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Total Enfrentamientos</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-primary">
              {sedes.reduce((a, b) => a + (b.uso_count || 0), 0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 font-headline uppercase tracking-widest text-sm">
            Cargando sedes...
          </div>
        ) : (
          <div className="bg-surface-container rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  <th className="px-6 py-4">Sede</th>
                  <th className="px-6 py-4">Capacidad</th>
                  <th className="px-6 py-4 text-right">Usos</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sedes.map((sede) => (
                  <tr key={sede.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{sede.name}</p>
                          <p className="text-[10px] text-gray-500">Usos: {sede.uso_count || 0}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter bg-secondary/10 text-secondary">
                        {sede.capacidad}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-headline font-bold text-primary">
                      {sede.uso_count || 0}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-white/5 rounded transition-colors text-gray-500 hover:text-white">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sede.name)}
                          className="p-1.5 hover:bg-red-900/30 rounded transition-colors text-gray-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black font-headline uppercase">Nueva Sede</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Nombre</label>
                  <input
                    value={newSede.name}
                    onChange={(e) => setNewSede(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="Nombre de la sede"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Capacidad</label>
                  <input
                    value={newSede.capacidad}
                    onChange={(e) => setNewSede(prev => ({ ...prev, capacidad: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="15 vs 15"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Coords Defensa</label>
                  <input
                    value={newSede.coords_defensa}
                    onChange={(e) => setNewSede(prev => ({ ...prev, coords_defensa: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="x, y, z, heading"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1 block">Coords Ataque</label>
                  <input
                    value={newSede.coords_ataque}
                    onChange={(e) => setNewSede(prev => ({ ...prev, coords_ataque: e.target.value }))}
                    className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm font-headline focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="x, y, z, heading"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-bold font-headline uppercase tracking-widest text-xs"
                >
                  Crear Sede
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
