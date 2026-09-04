import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Power, Pencil, Trash2, X } from 'lucide-react';
import PageHeader from '@/components/editorial/PageHeader';
const types = ['Veículo jornalístico', 'Fonte oficial', 'Documento/Fonte primária', 'Outra'];
const cats = ['Brasil', 'Política', 'Economia', 'Justiça', 'Segurança', 'Mundo', 'Tecnologia', 'Sociedade', 'Viral'];
const blank = { name: '', url: '', feed_url: '', source_type: types[0], category: 'Brasil', priority: 'Média', reliability: 80, active: true, notes: '' };
export default function Sources() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = () => base44.entities.Source.list('-created_date', 100).then(setItems);
  useEffect(() => { load(); }, []);
  const openNew = () => setEditing({ ...blank, isNew: true });
  const openEdit = (x) => setEditing({ ...x, isNew: false });
  const submit = async (e) => { e.preventDefault(); if (editing.isNew) { await base44.entities.Source.create(editing); } else { await base44.entities.Source.update(editing.id, editing); } setEditing(null); load(); };
  const toggle = async (x) => { await base44.entities.Source.update(x.id, { active: !x.active }); setItems(v => v.map(i => i.id === x.id ? { ...i, active: !i.active } : i)); };
  const remove = async (x) => { if (confirm(`Excluir a fonte "${x.name}"?`)) { await base44.entities.Source.delete(x.id); setItems(v => v.filter(i => i.id !== x.id)); } };
  const f = (k) => (e) => setEditing(v => ({ ...v, [k]: e.target.value }));
  const input = 'w-full rounded-xl border border-white/10 bg-[#070d18] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/60';
  return <>
    <PageHeader title="Fontes" description="Cadastro e qualificação das fontes editoriais. A confiabilidade é uma referência, não uma verdade absoluta." action={<button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4" />Nova fonte</button>} />
    {editing && <form onSubmit={submit} className="mb-6 rounded-2xl border border-blue-500/20 bg-[#0b1424] p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-white">{editing.isNew ? 'Nova fonte' : 'Editar fonte'}</h3><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5 text-slate-400" /></button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Nome</span><input required value={editing.name} onChange={f('name')} placeholder="Nome da fonte" className={input} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">URL</span><input required value={editing.url} onChange={f('url')} placeholder="https://" className={input} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">RSS / API</span><input value={editing.feed_url} onChange={f('feed_url')} placeholder="Quando disponível" className={input} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Tipo</span><select value={editing.source_type} onChange={f('source_type')} className={input}>{types.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Editoria principal</span><select value={editing.category} onChange={f('category')} className={input}>{cats.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Prioridade</span><select value={editing.priority} onChange={f('priority')} className={input}>{['Alta', 'Média', 'Baixa'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Confiabilidade (referência)</span><input type="number" min="0" max="100" value={editing.reliability} onChange={e => setEditing(v => ({ ...v, reliability: +e.target.value }))} className={input} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Observações</span><input value={editing.notes} onChange={f('notes')} placeholder="Notas internas" className={input} /></label>
      </div>
      <div className="mt-4 flex gap-2"><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Salvar fonte</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button></div>
    </form>}
    {items.length ? <div className="overflow-x-auto rounded-2xl border border-white/7">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-white/[.03] text-xs text-slate-500"><tr>{['Fonte', 'Tipo', 'Editoria', 'Prioridade', 'Conf.', 'Status', 'Ações'].map(x => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
        <tbody>{items.map(x => <tr key={x.id} className="border-t border-white/5 bg-[#0b1424]">
          <td className="px-4 py-4"><strong className="text-white">{x.name}</strong><p className="mt-1 max-w-[230px] truncate text-xs text-slate-600">{x.url}</p></td>
          <td className="px-4 text-slate-300">{x.source_type}</td>
          <td className="px-4 text-slate-300">{x.category}</td>
          <td className="px-4 text-slate-300">{x.priority}</td>
          <td className="px-4 text-[#d4af55]">{x.reliability}%</td>
          <td className="px-4"><button onClick={() => toggle(x)} className={`flex items-center gap-2 text-xs ${x.active ? 'text-emerald-400' : 'text-slate-500'}`}><Power className="h-4 w-4" />{x.active ? 'Ativa' : 'Inativa'}</button></td>
          <td className="px-4"><div className="flex gap-2"><button onClick={() => openEdit(x)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => remove(x)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
        </tr>)}</tbody>
      </table>
    </div> : <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-12 text-center text-sm text-slate-500">Nenhuma fonte cadastrada. Clique em “Nova fonte” para começar.</div>}
  </>;
}