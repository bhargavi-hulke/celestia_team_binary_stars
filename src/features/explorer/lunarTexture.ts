import * as THREE from 'three';
import type { VisualStyle } from '../../data/types';

// Generate procedural lunar albedo or sculpted clay texture
export function createProceduralLunarTexture(style: VisualStyle = 'realistic'): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  if (style === 'sculpted') {
    // Sculpted / Clay preset: Uniform cool chalky grey surface highlighting pure geometry and shadows
    ctx.fillStyle = '#b0b3b8';
    ctx.fillRect(0, 0, width, height);

    // Subtle fine micro-grain
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 8;
      data[i] = Math.min(255, Math.max(0, 176 + n));
      data[i + 1] = Math.min(255, Math.max(0, 179 + n));
      data[i + 2] = Math.min(255, Math.max(0, 184 + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // Realistic mode: LROC WAC morphology mosaic style
  ctx.fillStyle = '#9c9993';
  ctx.fillRect(0, 0, width, height);

  // Regolith mottling
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const pseudoNoise = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const n1 = pseudoNoise(x * 0.05, y * 0.05);
      const n2 = pseudoNoise(x * 0.015, y * 0.015);
      const noise = (n1 * 0.4 + n2 * 0.6 - 0.5) * 36;

      data[idx] = Math.min(255, Math.max(0, 156 + noise));
      data[idx + 1] = Math.min(255, Math.max(0, 153 + noise));
      data[idx + 2] = Math.min(255, Math.max(0, 147 + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Paint Lunar Maria (volcanic basaltic basins)
  const maria: { cx: number; cy: number; rx: number; ry: number; angle?: number }[] = [
    { cx: width * 0.38, cy: height * 0.38, rx: width * 0.12, ry: height * 0.22, angle: 0.2 }, // Oceanus Procellarum
    { cx: width * 0.45, cy: height * 0.32, rx: width * 0.08, ry: height * 0.14 }, // Mare Imbrium
    { cx: width * 0.55, cy: height * 0.36, rx: width * 0.06, ry: height * 0.10 }, // Mare Serenitatis
    { cx: width * 0.58, cy: height * 0.48, rx: width * 0.07, ry: height * 0.10, angle: -0.2 }, // Mare Tranquillitatis
    { cx: width * 0.62, cy: height * 0.55, rx: width * 0.06, ry: height * 0.09 }, // Mare Fecunditatis
    { cx: width * 0.68, cy: height * 0.40, rx: width * 0.045, ry: height * 0.07 }, // Mare Crisium
    { cx: width * 0.45, cy: height * 0.60, rx: width * 0.06, ry: height * 0.09 }, // Mare Nubium
    { cx: width * 0.39, cy: height * 0.62, rx: width * 0.04, ry: height * 0.06 }, // Mare Humorum
    { cx: width * 0.95, cy: height * 0.80, rx: width * 0.12, ry: height * 0.14 }, // SPA Basin
  ];

  ctx.save();
  for (const m of maria) {
    ctx.save();
    ctx.translate(m.cx, m.cy);
    if (m.angle) ctx.rotate(m.angle);

    const grad = ctx.createRadialGradient(0, 0, m.rx * 0.1, 0, 0, m.rx);
    grad.addColorStop(0, 'rgba(42, 44, 48, 0.88)');
    grad.addColorStop(0.5, 'rgba(52, 54, 58, 0.72)');
    grad.addColorStop(0.8, 'rgba(68, 70, 74, 0.45)');
    grad.addColorStop(1, 'rgba(110, 110, 110, 0.0)');

    ctx.fillStyle = grad;
    ctx.scale(1, m.ry / m.rx);
    ctx.beginPath();
    ctx.arc(0, 0, m.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Ray Craters (Tycho, Copernicus, Kepler, Aristarchus)
  const rayCraters: { cx: number; cy: number; r: number; rayLen: number; rayCount: number }[] = [
    { cx: width * 0.47, cy: height * 0.75, r: 14, rayLen: width * 0.28, rayCount: 36 }, // Tycho
    { cx: width * 0.44, cy: height * 0.42, r: 11, rayLen: width * 0.14, rayCount: 26 }, // Copernicus
    { cx: width * 0.39, cy: height * 0.44, r: 8, rayLen: width * 0.09, rayCount: 18 },  // Kepler
    { cx: width * 0.37, cy: height * 0.37, r: 7, rayLen: width * 0.07, rayCount: 16 },  // Aristarchus
  ];

  for (const rc of rayCraters) {
    ctx.save();
    ctx.strokeStyle = 'rgba(235, 235, 240, 0.32)';
    ctx.lineWidth = 1.6;
    for (let a = 0; a < rc.rayCount; a++) {
      const angle = (a / rc.rayCount) * Math.PI * 2 + (pseudoNoise(a, rc.cx) - 0.5) * 0.3;
      const len = rc.rayLen * (0.65 + pseudoNoise(a * 2, rc.cy) * 0.7);
      ctx.beginPath();
      ctx.moveTo(rc.cx, rc.cy);
      ctx.lineTo(rc.cx + Math.cos(angle) * len, rc.cy + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const cgrad = ctx.createRadialGradient(rc.cx, rc.cy, 1, rc.cx, rc.cy, rc.r * 1.6);
    cgrad.addColorStop(0, 'rgba(38, 38, 42, 0.9)');
    cgrad.addColorStop(0.35, 'rgba(180, 182, 188, 0.9)');
    cgrad.addColorStop(0.7, 'rgba(240, 242, 246, 0.95)');
    cgrad.addColorStop(1, 'rgba(200, 202, 208, 0.0)');
    ctx.fillStyle = cgrad;
    ctx.beginPath();
    ctx.arc(rc.cx, rc.cy, rc.r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// Generate bump map for global lunar relief
export function createProceduralLunarBumpMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 220; i++) {
    const s = Math.sin(i * 53.12) * 10000;
    const rnd1 = s - Math.floor(s);
    const s2 = Math.sin(i * 91.73) * 10000;
    const rnd2 = s2 - Math.floor(s2);

    const cx = rnd1 * width;
    const cy = rnd2 * height;
    const r = 3 + (i % 14);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(0.7, '#606060');
    grad.addColorStop(0.9, '#e8e8e8');
    grad.addColorStop(1, '#808080');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
