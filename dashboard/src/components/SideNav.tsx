"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  Trophy,
  Users,
  Building2,
  Shield,
  BadgeCheck,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/registrar-evento", label: "Registrar Evento", icon: CalendarPlus },
  { href: "/rankings", label: "Rankings e Historial", icon: Trophy },
  { href: "/facciones", label: "Facciones", icon: Users },
  { href: "/sedes", label: "Sedes", icon: Building2 },
  { href: "/staff", label: "Staff", icon: Shield },
  { href: "/verificacion", label: "Verificacion", icon: BadgeCheck },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-[#131313] flex flex-col py-6 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-lg font-black text-red-600 font-headline uppercase tracking-widest">
          Neon Underground
        </h1>
        <p className="text-[10px] text-gray-500 font-headline tracking-tighter">
          Elite Roleplay Interface
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-headline text-sm uppercase tracking-tighter transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-red-600 to-red-900/20 text-white rounded-md shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto">
        <Link
          href="/login"
          className="flex items-center gap-3 text-gray-500 hover:text-white px-4 py-3 font-headline text-sm uppercase tracking-tighter hover:bg-white/5 transition-all duration-300 w-full"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Link>
      </div>
    </aside>
  );
}
