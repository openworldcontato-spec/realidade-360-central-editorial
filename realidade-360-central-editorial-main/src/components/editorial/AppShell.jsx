import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Search, Bell, Radar as RadarIcon, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const runRadar = async () => {
    if (running) return;
    setRunning(true); setDone(false);
    try {
      const res = await base44.functions.invoke('runRadar', {});
      const d = res.data || {};
      setDone(true);
      setTimeout(() => setDone(false), 2500);
      // se estiver na página Radar, recarrega manualmente; senão apenas sinaliza
      if (d.error) setDone(false);
    } catch { setDone(false); }
    setRunning(false);
  };

  return <div className="min-h-screen bg-[#070d18] text-slate-200">
    <Sidebar open={open} close={() => setOpen(false)} />
    {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden" />}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/7 bg-[#070d18]/90 px-4 backdrop-blur-xl sm:px-7">
        <button onClick={() => setOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-white/7 bg-white/[.03] px-3 py-2 text-sm text-slate-500 sm:flex"><Search className="h-4 w-4" />Pesquisar na Central</div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button onClick={runRadar} disabled={running} title="Atualizar Radar 360" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <RadarIcon className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{running ? 'Atualizando...' : done ? 'Atualizado' : 'Atualizar Radar'}</span>
          </button>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-white/5"><Bell className="h-4 w-4" /></button>
          <span className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px]"><span className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1424] text-xs font-bold">R360</span></span>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-7"><Outlet /></main>
    </div>
  </div>;
}