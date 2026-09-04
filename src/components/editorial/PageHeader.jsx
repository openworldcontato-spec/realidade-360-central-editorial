import React from 'react';
export default function PageHeader({ eyebrow='CENTRAL EDITORIAL', title, description, action }) {
 return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold tracking-[.24em] text-[#d4af55]">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>{description&&<p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>}</div>{action}</div>
}