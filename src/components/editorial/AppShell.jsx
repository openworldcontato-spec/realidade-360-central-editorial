import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
export default function AppShell() {
 const [open,setOpen]=useState(false);
 return <div className="min-h-screen bg-[#070d18] text-slate-200"><Sidebar open={open} close={()=>setOpen(false)}/>{open&&<div onClick={()=>setOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden"/>}<div className="lg:pl-64">
  <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/7 bg-[#070d18]/90 px-4 backdrop-blur-xl sm:px-7"><button onClick={()=>setOpen(true)} className="lg:hidden"><Menu className="h-5 w-5"/></button><div className="hidden max-w-sm flex-1 items-center gap-2 rounded-xl border border-white/7 bg-white/[.03] px-3 py-2 text-sm text-slate-500 sm:flex"><Search className="h-4 w-4"/>Pesquisar na Central</div><div className="ml-auto flex items-center gap-3"><button className="rounded-lg p-2 text-slate-500 hover:bg-white/5"><Bell className="h-4 w-4"/></button><span className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[1px]"><span className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1424] text-xs font-bold">R360</span></span></div></header>
  <main className="mx-auto max-w-[1500px] p-4 sm:p-7"><Outlet/></main></div></div>
}