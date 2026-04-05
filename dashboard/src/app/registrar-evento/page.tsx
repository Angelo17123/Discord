"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Swords, Map, Rocket, Shield, Crosshair } from "lucide-react";

interface Sede {
  id: number;
  name: string;
  capacidad: string;
  coords_defensa: string;
  coords_ataque: string;
}

interface Faccion {
  key: string;
  nombre: string;
  coordenadas: string;
}

const ASALTO_SEDES = ["CARIBE", "VERDES", "LA04", "BLINDERS", "WARLOCKS", "BARRAGEM"];

export default function RegistrarEventoPage() {
  const router = useRouter();
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [facciones, setFacciones] = useState<Faccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventType, setEventType] = useState<"normal" | "vip" | "custom">("normal");

  const [formData, setFormData] = useState({
    defender: "",
    attacker: "",
    sede: "",
    capacity: "15 vs 15",
    rules: {
      noRevivir: true,
      perimetroStaff: true,
      grabacionObligatoria: false,
      prohibidoHelicopteros: true,
    },
  });

  const fetchSedes = useCallback(async () => {
    try {
      const res = await fetch("/api/sedes");
      const data = await res.json();
      const allSedes = Array.isArray(data) ? data : [];
      const filtered = allSedes.filter((s: Sede) =>
        ASALTO_SEDES.includes(s.name.toUpperCase())
      );
      setSedes(filtered);
    } catch (error) {
      console.error("Error fetching sedes:", error);
    }
  }, []);

  const fetchFacciones = useCallback(async () => {
    try {
      const res = await fetch("/api/facciones");
      const data = await res.json();
      setFacciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching facciones:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSedes(), fetchFacciones()]).finally(() =>
      setLoading(false)
    );
  }, [fetchSedes, fetchFacciones]);

  const selectedSede = sedes.find((s) => s.name === formData.sede);

  useEffect(() => {
    if (selectedSede?.capacidad) {
      setFormData(prev => ({ ...prev, capacity: selectedSede.capacidad }));
    }
  }, [selectedSede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sede: formData.sede,
          defTeam: formData.defender,
          atkTeam: formData.attacker,
          winner: null,
          scoreDef: 0,
          scoreAtk: 0,
          rounds: 0,
          capacity: formData.capacity,
          creatorId: null,
          staffApoyo: [],
          eventSubtype: eventType === "normal" ? "asalto" : eventType,
          isoYearWeek: null,
          fecha: new Date().toLocaleDateString("es-ES"),
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Operations Hub">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black font-headline tracking-tighter text-white mb-2 uppercase">
              Asalto a Sede
            </h1>
            <p className="text-gray-400 max-w-xl border-l-2 border-red-600 pl-4">
              Configure los parametros tacticos para el enfrentamiento de facciones.
              Todos los campos marcados con brillo rojo son obligatorios.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-high px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-headline uppercase tracking-widest text-gray-300">
                Live Server Alpha
              </span>
            </div>
          </div>
        </div>

        {/* Bento Grid Form Layout */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Primary Configuration Card */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-surface-container rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none" />
              <h3 className="text-lg font-headline font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-500" />
                Parametros de Mision
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event Type */}
                <div className="space-y-2">
                  <label className="text-xs font-headline uppercase tracking-widest text-gray-500 block">
                    Tipo de Evento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEventType("normal")}
                      className={`py-3 font-bold text-[10px] uppercase rounded-md transition-all ${
                        eventType === "normal"
                          ? "bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                          : "bg-surface-container-lowest text-gray-400 hover:bg-white/5 border border-white/5"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType("vip")}
                      className={`py-3 font-bold text-[10px] uppercase rounded-md transition-all ${
                        eventType === "vip"
                          ? "bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                          : "bg-surface-container-lowest text-gray-400 hover:bg-white/5 border border-white/5"
                      }`}
                    >
                      VIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setEventType("custom")}
                      className={`py-3 font-bold text-[10px] uppercase rounded-md transition-all ${
                        eventType === "custom"
                          ? "bg-red-600 text-white shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                          : "bg-surface-container-lowest text-gray-400 hover:bg-white/5 border border-white/5"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <label className="text-xs font-headline uppercase tracking-widest text-gray-500 block">
                    Capacidad (Tamano de Enfrentamiento)
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border-none text-white text-sm py-3 px-4 rounded-md focus:ring-1 focus:ring-secondary"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                  >
                    <option>10 vs 10</option>
                    <option>15 vs 15</option>
                    <option>20 vs 20</option>
                    <option>30 vs 30 (Elite Tier)</option>
                  </select>
                </div>

                {/* Faction Selectors */}
                <div className="space-y-2">
                  <label className="text-xs font-headline uppercase tracking-widest text-gray-500 block">
                    Faccion Defensora
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full bg-surface-container-lowest border-none text-white text-sm py-3 px-10 rounded-md focus:ring-1 focus:ring-primary"
                      value={formData.defender}
                      onChange={(e) =>
                        setFormData({ ...formData, defender: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccionar Defensor</option>
                      {loading ? (
                        <option disabled>Cargando...</option>
                      ) : (
                        facciones.map((f) => (
                          <option key={f.key} value={f.nombre}>
                            {f.nombre}
                          </option>
                        ))
                      )}
                    </select>
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-headline uppercase tracking-widest text-gray-500 block">
                    Faccion Atacante
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full bg-surface-container-lowest border-none text-white text-sm py-3 px-10 rounded-md focus:ring-1 focus:ring-secondary"
                      value={formData.attacker}
                      onChange={(e) =>
                        setFormData({ ...formData, attacker: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccionar Atacante</option>
                      {loading ? (
                        <option disabled>Cargando...</option>
                      ) : (
                        facciones.map((f) => (
                          <option key={f.key} value={f.nombre}>
                            {f.nombre}
                          </option>
                        ))
                      )}
                    </select>
                    <Crosshair className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Technical Details */}
            <div className="bg-surface-container rounded-xl p-8 shadow-2xl">
              <h3 className="text-lg font-headline font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Map className="w-5 h-5 text-secondary" />
                Inteligencia de Sede
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-headline uppercase tracking-widest text-gray-500 block">
                      Seleccion de Sede
                    </label>
                    <select
                      className="w-full bg-surface-container-lowest border-none text-white text-sm py-3 px-4 rounded-md focus:ring-1 focus:ring-secondary"
                      value={formData.sede}
                      onChange={(e) =>
                        setFormData({ ...formData, sede: e.target.value })
                      }
                      required
                    >
                      <option value="">Elegir Ubicacion...</option>
                      {loading ? (
                        <option disabled>Cargando...</option>
                      ) : (
                        sedes.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.capacidad})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {selectedSede ? (
                    <div className="space-y-2">
                      <div className="bg-surface-container-lowest rounded-lg p-3">
                        <p className="text-[9px] font-headline uppercase text-secondary mb-1">Defensa</p>
                        <code className="text-xs font-mono text-white">{selectedSede.coords_defensa || "N/A"}</code>
                      </div>
                      <div className="bg-surface-container-lowest rounded-lg p-3">
                        <p className="text-[9px] font-headline uppercase text-primary mb-1">Ataque</p>
                        <code className="text-xs font-mono text-white">{selectedSede.coords_ataque || "N/A"}</code>
                      </div>
                      <div className="bg-surface-container-lowest rounded-lg p-3">
                        <p className="text-[9px] font-headline uppercase text-gray-500 mb-1">Capacidad</p>
                        <p className="text-xs font-bold text-white">{selectedSede.capacidad}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-headline uppercase text-gray-600 ml-1">Coord X</span>
                        <input className="w-full bg-surface-container-lowest border-none text-gray-500 text-xs py-2 px-3 rounded text-center" readOnly value="0.00" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-headline uppercase text-gray-600 ml-1">Coord Y</span>
                        <input className="w-full bg-surface-container-lowest border-none text-gray-500 text-xs py-2 px-3 rounded text-center" readOnly value="0.00" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-headline uppercase text-gray-600 ml-1">Coord Z</span>
                        <input className="w-full bg-surface-container-lowest border-none text-gray-500 text-xs py-2 px-3 rounded text-center" readOnly value="0.00" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedSede ? (
                    <div className="rounded-lg overflow-hidden h-32 relative bg-surface-container-lowest flex items-center justify-center">
                      <div className="text-center">
                        <Map className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-headline uppercase">{selectedSede.name}</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
                        <span className="text-[10px] text-white font-headline uppercase tracking-tighter">
                          {selectedSede.capacidad}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg overflow-hidden h-32 relative bg-surface-container-lowest flex items-center justify-center">
                      <div className="text-center">
                        <Map className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-headline uppercase">
                          Selecciona una sede
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="md:col-span-4 space-y-6">
            {/* Rules Checklist */}
            <div className="bg-surface-container-high rounded-xl p-6 shadow-xl">
              <h3 className="text-xs font-headline font-bold text-white uppercase tracking-widest mb-4">
                Reglas Estandar
              </h3>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.rules.noRevivir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: { ...formData.rules, noRevivir: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded-sm bg-surface-container-lowest border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-medium group-hover:text-white transition-colors">
                      No Revivir (NLR)
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Reglas estandar de muerte aplican durante el evento.
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.rules.perimetroStaff}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          perimetroStaff: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded-sm bg-surface-container-lowest border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-medium group-hover:text-white transition-colors">
                      Perimetro Staff
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Sin jugadores externos dentro de la zona.
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.rules.grabacionObligatoria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          grabacionObligatoria: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded-sm bg-surface-container-lowest border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-medium group-hover:text-white transition-colors">
                      Grabacion Obligatoria
                    </span>
                    <span className="text-[10px] text-gray-500">
                      POV requerido para todos los participantes.
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.rules.prohibidoHelicopteros}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rules: {
                          ...formData.rules,
                          prohibidoHelicopteros: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded-sm bg-surface-container-lowest border-white/10 text-red-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-medium group-hover:text-white transition-colors">
                      Prohibido Helicopteros
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Solo transporte terrestre para este nivel.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Final Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white font-black font-headline uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(229,57,53,0.4)] active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket className="w-5 h-5" />
              {submitting ? "Creando..." : "Crear Evento"}
            </button>
            <p className="text-[9px] text-center text-gray-600 font-headline uppercase tracking-widest leading-relaxed px-4">
              Al lanzar, notificas a todos los lideres de faccion involucrados y
              asignas los miembros de staff seleccionados a esta operacion.
            </p>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
