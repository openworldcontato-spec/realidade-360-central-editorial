import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
export default function CopyButton({ text, label = 'Copiar', className }) {
  const [done, setDone] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text || ''); setDone(true); setTimeout(() => setDone(false), 1800); };
  return <button type="button" onClick={copy} className={className || 'flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300'}>
    {done ? <><Check className="h-3 w-3" />Copiado.</> : <><Copy className="h-3 w-3" />{label}</>}
  </button>;
}