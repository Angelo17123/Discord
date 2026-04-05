"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Users, Activity } from "lucide-react";

export default function StaffPage() {
  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Staff">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 uppercase">
              Staff
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Equipo de moderadores y organizadores de eventos activos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Total Staff</p>
            <p className="text-4xl font-black font-headline tracking-tighter">-</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">En Linea Ahora</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-green-400">-</p>
          </div>
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Eventos Totales</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-primary">-</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-headline uppercase tracking-widest text-sm">
            Modulo de Staff - Proximamente
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Esta seccion estara disponible en una futura actualizacion.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
