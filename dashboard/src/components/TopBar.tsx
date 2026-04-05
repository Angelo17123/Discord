"use client";

import { Bell, Settings, User } from "lucide-react";

export default function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="fixed top-0 w-full z-40 bg-[#131313]/80 backdrop-blur-xl flex justify-between items-center px-6 h-16 ml-64 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold uppercase tracking-widest text-red-600 font-headline">
          {title}
        </span>
        <div className="h-4 w-px bg-white/10 mx-2" />
        <span className="text-sm font-medium text-gray-400 font-headline uppercase tracking-tighter">
          {subtitle}
        </span>
      </div>

      <div className="flex items-center gap-4 pr-64">
        <button className="p-2 text-gray-400 hover:bg-white/5 transition-colors rounded-lg active:scale-95 duration-150">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:bg-white/5 transition-colors rounded-lg active:scale-95 duration-150">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded bg-surface-container-high border border-white/10 overflow-hidden ml-2 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
}
