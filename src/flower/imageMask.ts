import { FLOWER_CONFIG } from './config';

export interface MaskResult { width: number; height: number; rgba: Uint8ClampedArray; alpha: Float32Array }

const saturation = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

export function buildForegroundMask(data: Uint8ClampedArray, width: number, height: number): MaskResult {
  const count = width * height;
  const bg = new Uint8Array(count);
  const queue = new Int32Array(count);
  let qr = 0, qw = 0, sr = 0, sg = 0, sb = 0, samples = 0;
  const sample = (i: number) => { sr += data[i * 4]; sg += data[i * 4 + 1]; sb += data[i * 4 + 2]; samples++; };
  for (let x = 0; x < width; x++) { sample(x); sample((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { sample(y * width); sample(y * width + width - 1); }
  const br = sr / samples, bgc = sg / samples, bb = sb / samples;
  const canBeBackground = (idx: number, from: number) => {
    const i = idx * 4, f = from * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const delta = Math.hypot(r - br, g - bgc, b - bb) / 1.732;
    const grad = Math.hypot(r - data[f], g - data[f + 1], b - data[f + 2]) / 1.732;
    const lum = .2126 * r + .7152 * g + .0722 * b;
    const sat = saturation(r, g, b);
    // High brightness is required: this deliberately protects cream petals.
    return lum > 238 && sat < .075 && delta < FLOWER_CONFIG.backgroundTolerance && grad < FLOWER_CONFIG.edgeGradientLimit;
  };
  const push = (idx: number) => { if (!bg[idx]) { bg[idx] = 1; queue[qw++] = idx; } };
  for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { push(y * width); push(y * width + width - 1); }
  while (qr < qw) {
    const p = queue[qr++], x = p % width, y = (p / width) | 0;
    if (x && !bg[p - 1] && canBeBackground(p - 1, p)) push(p - 1);
    if (x + 1 < width && !bg[p + 1] && canBeBackground(p + 1, p)) push(p + 1);
    if (y && !bg[p - width] && canBeBackground(p - width, p)) push(p - width);
    if (y + 1 < height && !bg[p + width] && canBeBackground(p + width, p)) push(p + width);
  }
  const alpha = new Float32Array(count);
  for (let i = 0; i < count; i++) alpha[i] = bg[i] ? 0 : 1;
  // One conservative feather pass only on pixels touching the outside background.
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    if (!bg[i] && (bg[i - 1] || bg[i + 1] || bg[i - width] || bg[i + width])) {
      const c = i * 4, delta = Math.hypot(data[c] - br, data[c + 1] - bgc, data[c + 2] - bb) / 1.732;
      alpha[i] = Math.max(.25, Math.min(1, delta / (FLOWER_CONFIG.backgroundTolerance * FLOWER_CONFIG.maskFeather)));
    }
  }
  return { width, height, rgba: data, alpha };
}

export async function loadAndMask(url: string): Promise<MaskResult> {
  const image = new Image(); image.decoding = 'async'; image.src = url;
  await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.drawImage(image, 0, 0);
  return buildForegroundMask(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
}
