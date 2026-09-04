import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export const FORMATS = { feed: { w: 1080, h: 1350, label: 'Feed 4:5' }, square: { w: 1080, h: 1080, label: 'Quadrado 1:1' }, story: { w: 1080, h: 1920, label: 'Story/Reels 9:16' } };
export const TEMPLATES = [
  { id: 'destaque', name: 'Destaque' }, { id: 'urgente', name: 'Urgente' }, { id: 'entenda', name: 'Entenda' },
  { id: 'institucional', name: 'Política/Justiça' }, { id: 'moderno', name: 'Mundo/Tecnologia' }
];
const C = { bg1: '#0b1424', bg2: '#02060c', blue: '#2563eb', blueBright: '#3b82f6', gold: '#d4af55', white: '#f8fafc', slate: '#94a3b8', panel: '#0f1a2e', red: '#dc2626' };

function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawCover(ctx, img, x, y, w, h, fx = 50, fy = 50, r = 0) {
  if (!img || !img.width) return;
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  const dx = x - (dw - w) * (fx / 100), dy = y - (dh - h) * (fy / 100);
  ctx.save(); if (r) { roundRect(ctx, x, y, w, h, r); ctx.clip(); }
  ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
}
function layoutHead(ctx, text, highlights, maxWidth, maxLines = 4) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const norm = w => w.toLowerCase().replace(/[^a-zà-ú0-9]/gi, '');
  const hl = new Set((highlights || []).map(h => norm(h)).filter(Boolean));
  const space = ctx.measureText(' ').width;
  const lines = []; let cur = [], curW = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    const add = cur.length ? space + ww : ww;
    if (curW + add > maxWidth && cur.length) { lines.push(cur); cur = [{ word: w, h: hl.has(norm(w)) }]; curW = ww; }
    else { cur.push({ word: w, h: hl.has(norm(w)) }); curW += add; }
  }
  if (cur.length) lines.push(cur);
  const overflow = lines.length > maxLines;
  return { lines: overflow ? lines.slice(0, maxLines) : lines, overflow, wordCount: words.length };
}
function drawHeadline(ctx, lines, x, y, maxWidth, lineHeight, alignment, font, color, hlColor) {
  ctx.font = font; ctx.textBaseline = 'top';
  const space = ctx.measureText(' ').width;
  lines.forEach((line, i) => {
    const lineW = line.reduce((a, w) => a + ctx.measureText(w.word).width, 0) + Math.max(0, line.length - 1) * space;
    let cx = alignment === 'center' ? x + (maxWidth - lineW) / 2 : alignment === 'right' ? x + (maxWidth - lineW) : x;
    line.forEach(w => {
      ctx.fillStyle = w.h ? hlColor : color;
      ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2;
      ctx.fillText(w.word, cx, y + i * lineHeight);
      cx += ctx.measureText(w.word).width + space;
    });
  });
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}
function drawEditoria(ctx, W, M, editoria, accent, y) {
  ctx.textBaseline = 'top';
  ctx.fillStyle = accent; ctx.fillRect(M, y, 56, 6);
  ctx.font = '800 26px Inter, Arial, sans-serif'; ctx.fillStyle = C.white;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
  ctx.fillText((editoria || '').toUpperCase(), M + 72, y - 5);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
}
function drawSignature(ctx, W, H, M, show) {
  if (!show) return;
  const baseY = H - M;
  ctx.textBaseline = 'bottom';
  ctx.font = '900 30px Inter, Arial, sans-serif';
  ctx.fillStyle = C.white; ctx.fillText('REALIDADE', M, baseY - 28);
  const rw = ctx.measureText('REALIDADE ').width;
  ctx.fillStyle = C.blueBright; ctx.fillText('360', M + rw, baseY - 28);
  ctx.font = '600 16px Inter, Arial, sans-serif'; ctx.fillStyle = C.gold;
  ctx.fillText('Informação com contexto. Sempre.', M, baseY - 6);
}
function graphicBg(ctx, W, H, editoria) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0d1830'); g.addColorStop(1, '#02060c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(59,130,246,0.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < W; i += 80) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  ctx.fillStyle = 'rgba(37,99,235,0.10)'; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.3, 260, 0, Math.PI * 2); ctx.fill();
}

function drawArt(ctx, W, H, cfg, img) {
  const M = 80, topY = M, footerH = 90;
  const middleY = M + 90, middleH = H - middleY - footerH - M;
  const fontPx = Math.round((W === 1080 && H >= 1500 ? 70 : 64) * (cfg.fontSize || 1));
  const font = `900 ${fontPx}px Inter, Arial, sans-serif`;
  const lineHeight = Math.round(fontPx * 1.18);
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, C.bg1); bg.addColorStop(1, C.bg2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const t = cfg.template;
  if (t === 'destaque') {
    const imgH = middleH * 0.6, hy = middleY + imgH + 28;
    if (cfg.image_url && img) { drawCover(ctx, img, 0, 0, W, imgH + 90, cfg.image_pos_x, cfg.image_pos_y); const sc = ctx.createLinearGradient(0, imgH - 120, 0, imgH + 90); sc.addColorStop(0, 'rgba(2,6,12,0)'); sc.addColorStop(1, 'rgba(2,6,12,0.95)'); ctx.fillStyle = sc; ctx.fillRect(0, imgH - 120, W, 210); }
    else graphicBg(ctx, W, imgH + 90, cfg.editoria);
    drawEditoria(ctx, W, M, cfg.editoria, C.gold, topY);
    const { lines } = layoutHead(ctx, cfg.headline, cfg.highlights, W - 2 * M, 4);
    drawHeadline(ctx, lines, M, hy, W - 2 * M, lineHeight, cfg.alignment, font, C.white, C.gold);
  } else if (t === 'urgente') {
    ctx.fillStyle = C.red; ctx.fillRect(0, 0, W, 100); ctx.fillStyle = C.blue; ctx.fillRect(0, 100, W, 6);
    ctx.textBaseline = 'middle'; ctx.font = '900 34px Inter, Arial, sans-serif'; ctx.fillStyle = C.white;
    ctx.fillText('URGENTE', M, 50); ctx.font = '700 24px Inter, Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText((cfg.editoria || '').toUpperCase(), M + 220, 52);
    const imgY = 150, imgH = middleH * 0.5;
    if (cfg.image_url && img) drawCover(ctx, img, M, imgY, W - 2 * M, imgH, cfg.image_pos_x, cfg.image_pos_y, 16);
    else { ctx.fillStyle = C.panel; roundRect(ctx, M, imgY, W - 2 * M, imgH, 16); ctx.fill(); }
    const hy = imgY + imgH + 30;
    ctx.fillStyle = C.red; ctx.fillRect(M, hy - 6, 60, 6);
    const { lines } = layoutHead(ctx, cfg.headline, cfg.highlights, W - 2 * M, 4);
    drawHeadline(ctx, lines, M, hy + 8, W - 2 * M, lineHeight, cfg.alignment, font, C.white, C.blueBright);
  } else if (t === 'entenda') {
    ctx.font = '800 24px Inter, Arial, sans-serif'; ctx.fillStyle = C.blueBright; ctx.textBaseline = 'top';
    ctx.fillText('ENTENDA', M, topY + 4);
    const imgY = middleY + 10, imgH = middleH * 0.48;
    if (cfg.image_url && img) drawCover(ctx, img, M, imgY, W - 2 * M, imgH, cfg.image_pos_x, cfg.image_pos_y, 20);
    else { ctx.fillStyle = C.panel; roundRect(ctx, M, imgY, W - 2 * M, imgH, 20); ctx.fill(); }
    const hy = imgY + imgH + 28;
    ctx.fillStyle = C.panel; roundRect(ctx, M - 12, hy - 16, W - 2 * M + 24, middleH - imgH - 12, 20); ctx.fill();
    const { lines } = layoutHead(ctx, cfg.headline, cfg.highlights, W - 2 * M, 4);
    drawHeadline(ctx, lines, M, hy + 8, W - 2 * M, lineHeight, cfg.alignment, font, C.white, C.gold);
  } else if (t === 'institucional') {
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '800 26px Inter, Arial, sans-serif'; ctx.fillStyle = C.gold;
    ctx.fillText((cfg.editoria || '').toUpperCase(), W / 2, topY + 4); ctx.textAlign = 'left';
    const imgY = middleY + 10, imgH = middleH * 0.5;
    if (cfg.image_url && img) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; drawCover(ctx, img, M + 20, imgY, W - 2 * M - 40, imgH, cfg.image_pos_x, cfg.image_pos_y, 8); ctx.strokeRect(M + 20, imgY, W - 2 * M - 40, imgH); }
    else { ctx.fillStyle = C.panel; roundRect(ctx, M + 20, imgY, W - 2 * M - 40, imgH, 8); ctx.fill(); }
    const hy = imgY + imgH + 36;
    const { lines } = layoutHead(ctx, cfg.headline, cfg.highlights, W - 2 * M - 40, 4);
    drawHeadline(ctx, lines, M + 20, hy, W - 2 * M - 40, lineHeight, 'center', font, C.white, C.gold);
  } else if (t === 'moderno') {
    ctx.strokeStyle = 'rgba(59,130,246,0.18)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < W; i += 90) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    drawEditoria(ctx, W, M, cfg.editoria, C.blueBright, topY);
    const imgY = middleY + 10, imgH = middleH * 0.52;
    if (cfg.image_url && img) { drawCover(ctx, img, M, imgY, W - 2 * M, imgH, cfg.image_pos_x, cfg.image_pos_y, 12); ctx.fillStyle = 'rgba(37,99,235,0.18)'; roundRect(ctx, M, imgY, W - 2 * M, imgH, 12); ctx.fill(); }
    else graphicBg(ctx, W, imgH, cfg.editoria);
    const hy = imgY + imgH + 30;
    ctx.fillStyle = C.gold; ctx.fillRect(M, hy - 4, 80, 4);
    const { lines } = layoutHead(ctx, cfg.headline, cfg.highlights, W - 2 * M, 4);
    drawHeadline(ctx, lines, M, hy + 12, W - 2 * M, lineHeight, cfg.alignment, font, C.white, C.gold);
  }
  drawSignature(ctx, W, H, M, cfg.show_signature);
}

const ArtCanvas = forwardRef(function ArtCanvas({ cfg, img }, ref) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { let m = true; document.fonts.load('900 80px Inter').then(() => { if (m) setReady(true); }).catch(() => setReady(true)); return () => { m = false; }; }, []);
  useEffect(() => {
    if (!ready) return;
    const { w, h } = FORMATS[cfg.format] || FORMATS.feed;
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, w, h);
    drawArt(ctx, w, h, cfg, img);
  }, [cfg, img, ready]);
  useImperativeHandle(ref, () => ({
    toBlob: (type = 'image/png', quality = 0.95) => new Promise((res, rej) => {
      const canvas = canvasRef.current; if (!canvas) return rej(new Error('canvas'));
      canvas.toBlob(b => b ? res(b) : rej(new Error('export')), type, quality);
    }),
    checkOverflow: () => {
      const { w, h } = FORMATS[cfg.format] || FORMATS.feed;
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      return layoutHead(ctx, cfg.headline, cfg.highlights, w - 2 * 80, 4).overflow;
    },
    getCanvas: () => canvasRef.current
  }));
  const { w, h } = FORMATS[cfg.format] || FORMATS.feed;
  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', aspectRatio: `${w}/${h}` }} className="rounded-2xl border border-white/10 bg-[#02060c] shadow-2xl" />;
});
export default ArtCanvas;