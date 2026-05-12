﻿import { useEffect, useRef, useCallback } from 'react';

interface Dot { lat: number; lng: number; color: string; label: string; size: number; }
interface Arc { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color: string; }

const DOTS: Dot[] = [
  { lat: 35.5, lng: 139.5, color: 'var(--matrix-green)', label: '东京', size: 6 },
  { lat: 39.9, lng: 116.4, color: '#00f0ff', label: '北京', size: 6 },
  { lat: 51.5, lng: -0.1, color: '#ff6b6b', label: '伦敦', size: 5 },
  { lat: 40.7, lng: -74.0, color: '#ffd93d', label: '纽约', size: 5 },
  { lat: -33.9, lng: 151.2, color: '#00ff88', label: '悉尼', size: 5 },
  { lat: 48.9, lng: 2.3, color: '#aa00ff', label: '巴黎', size: 4 },
  { lat: 37.5, lng: 127.0, color: 'var(--matrix-green)', label: '首尔', size: 4 },
  { lat: 55.7, lng: 37.6, color: '#ff6b6b', label: '莫斯科', size: 4 },
  { lat: 1.3, lng: 103.8, color: '#00f0ff', label: '新加坡', size: 4 },
  { lat: 30.0, lng: 31.2, color: '#ffd93d', label: '开罗', size: 3 },
  { lat: -22.9, lng: -43.2, color: '#00ff88', label: '里约', size: 3 },
  { lat: 52.5, lng: 13.4, color: '#aa00ff', label: '柏林', size: 3 },
  { lat: 25.0, lng: 121.5, color: 'var(--matrix-green)', label: '台北', size: 3 },
  { lat: 43.7, lng: -79.4, color: '#ff6b6b', label: '多伦多', size: 3 },
];

const ARCS: Arc[] = [
  { from: { lat: 39.9, lng: 116.4 }, to: { lat: 35.5, lng: 139.5 }, color: 'var(--matrix-green)' },
  { from: { lat: 39.9, lng: 116.4 }, to: { lat: 40.7, lng: -74.0 }, color: '#ffd93d' },
  { from: { lat: 39.9, lng: 116.4 }, to: { lat: 51.5, lng: -0.1 }, color: '#ff6b6b' },
  { from: { lat: 39.9, lng: 116.4 }, to: { lat: 1.3, lng: 103.8 }, color: '#00f0ff' },
  { from: { lat: 39.9, lng: 116.4 }, to: { lat: -33.9, lng: 151.2 }, color: '#00ff88' },
];

const CONTINENTS: { name: string; color: string; path: [number, number][] }[] = [
  {
    name: 'N.AMERICA', color: 'var(--matrix-green)',
    path: [
      [-168, 66], [-164, 54], [-160, 56], [-152, 60], [-144, 62], [-135, 57], [-128, 54], [-124, 50],
      [-120, 48], [-117, 33], [-112, 28], [-105, 20], [-98, 18], [-91, 20], [-84, 21], [-82, 24],
      [-80, 26], [-81, 29], [-83, 31], [-90, 30], [-89, 28], [-85, 41], [-83, 45], [-77, 43],
      [-75, 37], [-72, 40], [-70, 45], [-66, 47], [-62, 46], [-57, 50], [-56, 52], [-62, 58],
      [-70, 63], [-82, 60], [-88, 64], [-95, 67], [-108, 70], [-120, 72], [-135, 70], [-150, 62],
      [-160, 60], [-168, 66],
    ],
  },
  {
    name: 'S.AMERICA', color: '#00ff88',
    path: [
      [-80, 11], [-77, 8], [-73, 11], [-70, 7], [-67, 3], [-62, 2], [-55, 4], [-48, 0],
      [-40, -2], [-35, -6], [-34, -14], [-36, -18], [-40, -22], [-44, -26], [-48, -30],
      [-52, -33], [-58, -35], [-64, -39], [-68, -37], [-72, -41], [-74, -46], [-72, -50],
      [-68, -53], [-62, -51], [-55, -52], [-48, -50], [-42, -48], [-36, -45], [-30, -41],
      [-26, -35], [-28, -28], [-33, -22], [-36, -14], [-34, -6], [-38, 0], [-42, 3],
      [-47, 1], [-52, -2], [-56, 0], [-60, 3], [-64, 5], [-68, 3], [-72, 5], [-76, 9], [-80, 11],
    ],
  },
  {
    name: 'EUROPE', color: '#00f0ff',
    path: [
      [-10, 36], [-8, 43], [-3, 44], [2, 42], [4, 47], [0, 51], [2, 55], [6, 57],
      [9, 59], [12, 55], [17, 58], [22, 61], [26, 63], [30, 65], [32, 68], [28, 71],
      [21, 70], [14, 66], [7, 63], [2, 60], [-2, 57], [-5, 53], [-8, 50], [-9, 44], [-10, 40], [-10, 36],
    ],
  },
  {
    name: 'AFRICA', color: '#ffd93d',
    path: [
      [-16, 32], [-11, 34], [-6, 37], [0, 37], [5, 34], [9, 11], [11, 4], [15, -2],
      [20, -5], [26, -3], [30, -7], [33, -15], [35, -21], [37, -27], [33, -32], [28, -34],
      [22, -32], [17, -34], [14, -30], [11, -26], [7, -20], [4, -14], [2, -8], [0, -2],
      [-4, 3], [-7, 7], [-10, 9], [-13, 13], [-15, 17], [-17, 23], [-17, 28], [-16, 32],
    ],
  },
  {
    name: 'ASIA', color: '#ff6b6b',
    path: [
      [30, 42], [37, 42], [42, 38], [47, 35], [52, 38], [55, 35], [59, 32], [63, 29],
      [67, 22], [70, 16], [73, 10], [77, 7], [82, 9], [91, 16], [99, 20], [105, 18],
      [110, 16], [117, 21], [121, 26], [126, 33], [129, 35], [135, 36], [140, 37],
      [145, 42], [143, 49], [141, 55], [135, 57], [131, 59], [125, 57], [121, 55],
      [115, 57], [109, 59], [105, 64], [100, 68], [93, 69], [84, 69], [76, 67], [68, 65],
      [61, 61], [57, 59], [54, 55], [50, 53], [46, 50], [42, 47], [36, 43], [30, 41], [30, 42],
    ],
  },
  {
    name: 'AUSTRALIA', color: '#aa00ff',
    path: [
      [114, -21], [117, -18], [122, -15], [128, -13], [135, -11], [141, -13], [147, -15],
      [151, -21], [153, -27], [151, -32], [147, -36], [141, -38], [135, -37], [128, -33],
      [123, -31], [117, -29], [114, -25], [114, -21],
    ],
  },
];

interface Point2D { x: number; y: number; z: number; front: boolean }

function proj(lat: number, lng: number, ry: number, cx: number, cy: number, r: number): Point2D {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + ry) * Math.PI) / 180;
  const c = Math.cos(phi);
  const sx = r * c * Math.sin(theta);
  const sy = -r * Math.sin(phi);
  const sz = r * c * Math.cos(theta);
  return { x: cx + sx * 0.85, y: cy + sy * 0.85, z: sz, front: sz > 0 };
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function KasperskyGlobe({ width = 600, height = 380 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef(0);

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const cw = Math.floor(width * dpr);
  const ch = Math.floor(height * dpr);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = (Date.now() - startRef.current) / 1000;
    const ry = elapsed * 36;
    const tick = tickRef.current;

    const size = Math.min(height - 40, 300);
    const cx = width / 2;
    const cy = height / 2;
    const R = size / 2;
    const BUMP = 7;

    ctx.clearRect(0, 0, cw, ch);

    // 大气光晕
    const agRad = R + 14 + Math.sin(tick * 0.02) * 2;
    const agGrad = ctx.createRadialGradient(cx * dpr, cy * dpr, (R - 10) * dpr, cx * dpr, cy * dpr, agRad * dpr);
    agGrad.addColorStop(0.55, 'rgba(57,255,20,0)');
    agGrad.addColorStop(0.78, 'rgba(57, 255, 20, 0.04)');
    agGrad.addColorStop(1, 'rgba(57,255,20,0)');
    ctx.fillStyle = agGrad;
    ctx.fillRect(0, 0, cw, ch);

    // 球体
    const bgGrad = ctx.createRadialGradient((cx - R * 0.1) * dpr, (cy - R * 0.15) * dpr, 0, cx * dpr, cy * dpr, R * dpr);
    bgGrad.addColorStop(0, '#162838');
    bgGrad.addColorStop(0.55, '#0a1520');
    bgGrad.addColorStop(1, '#050a10');
    ctx.beginPath();
    ctx.arc(cx * dpr, cy * dpr, R * dpr, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.18)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    // 外环
    ctx.beginPath();
    ctx.arc(cx * dpr, cy * dpr, (R + 3) * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.lineWidth = 3 * dpr;
    ctx.stroke();

    // 裁剪到球内
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx * dpr, cy * dpr, (R + BUMP + 6) * dpr, 0, Math.PI * 2);
    ctx.clip();

    // === 大陆板块（凸起3D） ===
    for (const cont of CONTINENTS) {
      const base = cont.path.map(([lng, lat]) => proj(lat, lng, ry, cx, cy, R));
      const bump = cont.path.map(([lng, lat]) => proj(lat, lng, ry, cx, cy, R + BUMP));
      const fc = base.filter(p => p.front).length;
      if (fc < 2) continue;

      // 侧面墙
      for (let i = 0; i < base.length; i++) {
        const j = (i + 1) % base.length;
        const bp = base[i], bp2 = base[j];
        const tp = bump[i], tp2 = bump[j];
        if (!bp.front && !bp2.front) continue;
        ctx.beginPath();
        ctx.moveTo(bp.x * dpr, bp.y * dpr);
        ctx.lineTo(bp2.x * dpr, bp2.y * dpr);
        ctx.lineTo(tp2.x * dpr, tp2.y * dpr);
        ctx.lineTo(tp.x * dpr, tp.y * dpr);
        ctx.closePath();
        ctx.fillStyle = hexToRgba(cont.color, 0.12);
        ctx.strokeStyle = hexToRgba(cont.color, 0.15);
        ctx.lineWidth = 0.3 * dpr;
        ctx.fill();
        ctx.stroke();
      }

      // 顶部高亮边（光源方向）
      ctx.beginPath();
      for (let i = 0; i < bump.length; i++) {
        const tp = bump[i];
        if (!tp.front) continue;
        const j = (i + 1) % bump.length;
        const tp2 = bump[j];
        if (!tp2.front) continue;
        const dx = tp2.x - tp.x;
        const dy = tp2.y - tp.y;
        const edgeAngle = Math.atan2(dy, dx);
        const lightDot = Math.cos(edgeAngle + Math.PI / 2 + 3 * Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(tp.x * dpr, tp.y * dpr);
        ctx.lineTo(tp2.x * dpr, tp2.y * dpr);
        ctx.strokeStyle = hexToRgba(cont.color, lightDot > 0.15 ? lightDot * 0.55 : 0.18);
        ctx.lineWidth = (lightDot > 0.15 ? lightDot * 2.2 : 0.6) * dpr;
        ctx.stroke();
      }

      // 顶部填充
      ctx.beginPath();
      ctx.moveTo(bump[0].x * dpr, bump[0].y * dpr);
      for (let i = 1; i < bump.length; i++) {
        ctx.lineTo(bump[i].x * dpr, bump[i].y * dpr);
      }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(cont.color, 0.07);
      ctx.fill();

      // 板块名
      const frontBump = bump.filter(p => p.front);
      if (frontBump.length > 0) {
        const ax = frontBump.reduce((s, p) => s + p.x, 0) / frontBump.length;
        const ay = frontBump.reduce((s, p) => s + p.y, 0) / frontBump.length;
        ctx.fillStyle = hexToRgba(cont.color, 0.30);
        ctx.font = `${7 * dpr}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cont.name, ax * dpr, ay * dpr);
      }
    }

    // === 经纬网 ===
    for (const lat of [-60, -45, -30, -15, 0, 15, 30, 45, 60]) {
      const cl = Math.cos((lat * Math.PI) / 180);
      const sl = Math.sin((lat * Math.PI) / 180);
      const rLat = (R + BUMP) * 0.95;
      ctx.beginPath();
      ctx.ellipse(cx * dpr, (cy + (R + BUMP) * sl * 0.95) * dpr, rLat * cl * dpr, (R + BUMP) * 0.06 * dpr, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.06)';
      ctx.lineWidth = 0.4 * dpr;
      ctx.stroke();
    }

    // === 弧线 ===
    for (let i = 0; i < ARCS.length; i++) {
      const arc = ARCS[i];
      const from = proj(arc.from.lat, arc.from.lng, ry, cx, cy, R + BUMP);
      const to = proj(arc.to.lat, arc.to.lng, ry, cx, cy, R + BUMP);
      if (!from.front && !to.front) continue;
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.28;
      const phase = Math.abs(Math.sin(tick * 0.03 + i * 0.8));
      const alpha = phase * 0.5 + 0.12;
      ctx.beginPath();
      ctx.moveTo(from.x * dpr, from.y * dpr);
      ctx.quadraticCurveTo(mx * dpr, my * dpr, to.x * dpr, to.y * dpr);
      ctx.strokeStyle = hexToRgba(arc.color, alpha);
      ctx.lineWidth = 1.1 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.lineDashOffset = -(tick * 2) % 12;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // === 城市数据点 ===
    for (const d of DOTS) {
      const p = proj(d.lat, d.lng, ry, cx, cy, R + BUMP);
      const dr = d.size;
      const fa = p.front ? 0.9 : 0.03;

      // 光晕
      if (p.front) {
        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, dr * 2.2 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(d.color, 0.06);
        ctx.fill();
      }

      // 核心点
      const br = dr * (1 + 0.125 * Math.sin(tick * 0.8 + DOTS.indexOf(d)));
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, br * dpr, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(d.color, fa);
      ctx.fill();

      // 标签
      if (p.front) {
        ctx.fillStyle = hexToRgba(d.color, 0.8);
        ctx.font = `${9 * dpr}px "Courier New", monospace`;
        ctx.textAlign = 'start';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label, (p.x + dr + 3) * dpr, (p.y + dr / 2) * dpr);
      }
    }

    // === 地平粒子环 ===
    ctx.beginPath();
    ctx.ellipse(cx * dpr, cy * dpr, (R + BUMP + 6) * dpr, 3.5 * dpr, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.22)';
    ctx.lineWidth = 0.8 * dpr;
    ctx.setLineDash([2 * dpr, 6 * dpr]);
    ctx.lineDashOffset = -(tick * 4) % 16;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.ellipse(cx * dpr, cy * dpr, 3.5 * dpr, (R + BUMP + 6) * dpr, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,240,255,0.12)';
    ctx.lineWidth = 0.6 * dpr;
    ctx.setLineDash([2 * dpr, 8 * dpr]);
    ctx.lineDashOffset = -(tick * 4) % 20;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // === HUD文字 ===
    ctx.fillStyle = 'rgba(57, 255, 20, 0.45)';
    ctx.font = `bold ${9 * dpr}px "Courier New", monospace`;
    ctx.textAlign = 'start';
    ctx.fillText('KASPERSKY.NET.MON', 16 * dpr, 24 * dpr);

    ctx.textAlign = 'end';
    ctx.fillText('GLOBAL INTELLIGENCE', (width - 16) * dpr, 24 * dpr);

    ctx.fillStyle = 'rgba(0,240,255,0.32)';
    ctx.font = `${8 * dpr}px "Courier New", monospace`;
    ctx.textAlign = 'start';
    ctx.fillText(`NODES:${DOTS.length} · PLATES:${CONTINENTS.length} · LAT:18ms`, 16 * dpr, (height - 8) * dpr);

    ctx.fillStyle = 'rgba(57, 255, 20, 0.22)';
    ctx.textAlign = 'end';
    ctx.fillText('THREAT LEVEL: MONITORED', (width - 16) * dpr, (height - 8) * dpr);

    tickRef.current++;
  }, [width, height, dpr, cw, ch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={cw}
      height={ch}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}
