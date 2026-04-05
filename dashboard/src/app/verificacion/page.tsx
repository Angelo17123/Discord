"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { BadgeCheck, Clock } from "lucide-react";

export default function VerificacionPage() {
  return (
    <DashboardLayout title="KINETIC NOIR" subtitle="Verificacion">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black font-headline tracking-tight mb-2 uppercase">
              Verificacion
            </h2>
            <p className="text-on-surface-variant text-sm font-medium">
              Sistema de verificacion de usuarios y staff para el servidor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BadgeCheck className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Total Solicitudes</p>
            <p className="text-4xl font-black font-headline tracking-tighter">-</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Pendientes</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-yellow-400">-</p>
          </div>
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BadgeCheck className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Aprobados</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-green-400">-</p>
          </div>
          <div className="bg-surface-container rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BadgeCheck className="w-16 h-16" />
            </div>
            <p className="text-xs font-headline uppercase tracking-widest text-gray-500 mb-1">Rechazados</p>
            <p className="text-4xl font-black font-headline tracking-tighter text-primary">-</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-12 text-center">
          <BadgeCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-headline uppercase tracking-widest text-sm">
            Modulo de Verificacion - Proximamente
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Esta seccion estara disponible en una futura actualizacion.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
