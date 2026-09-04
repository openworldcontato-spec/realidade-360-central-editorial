import { drawArt, FORMATS } from '@/components/art/ArtCanvas';

function loadImage(url) {
  return new Promise(resolve => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}

// Renderiza a arte composta (1080xH) fora do DOM e retorna um PNG blob.
export async function composeArtBlob(cfg, imageUrl, format = 'feed') {
  const { w, h } = FORMATS[format] || FORMATS.feed;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = imageUrl ? await loadImage(imageUrl) : null;
  try { await document.fonts.load('900 80px Inter'); } catch { /* fontes já carregadas */ }
  drawArt(ctx, w, h, cfg, img);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('export failed')), 'image/png', 0.95);
  });
}