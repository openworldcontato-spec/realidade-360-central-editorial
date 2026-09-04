import React from 'react';
import { LayoutDashboard, Radar, Newspaper, Sparkles, Images, Send, Library, Settings, LogOut, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
const links = [['/','Dashboard',LayoutDashboard],['/radar','Radar 360',Radar],['/pautas','Pautas',Newspaper],['/editor','Editor IA',Sparkles],['/artes','Artes',Images],['/publicados','Publicados',Send],['/fontes','Fontes',Library],['/configuracoes','Configurações',Settings]];
export default function Sidebar({ open, close }) {
 return <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/7 bg-[#050b14] p-4 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
  <div className="flex items-center justify-between px-2 py-3"><div><strong className="text-xl tracking-tight text-white">REALIDADE <span className="text-blue-500">360</span></strong><p className="text-[9px] tracking-[.28em] text-slate-500">CENTRAL EDITORIAL</p></div><button onClick={close} className="lg:hidden"><X className="h-5 w-5" /></button></div>
  <nav className="mt-7 space-y-1">{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} onClick={close} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive?'bg-blue-600 text-white shadow-lg shadow-blue-950/40':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
  <button onClick={()=>base44.auth.logout('/login')} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4"/>Sair</button>
 </aside>
}