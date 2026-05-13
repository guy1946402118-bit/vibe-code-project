﻿﻿﻿import { useEffect, useRef, useCallback, useMemo } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

export interface RadarDimension {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
}

const LABEL_FONT = '"Courier New", monospace';
const LABEL_SIZE = 11;
const LABEL_LINE_HEIGHT = 14;
const LABEL_MAX_WIDTH = 120;

export function RadarChart({ dimensions, width = 500, height = 380, title, subtitle }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const tickRef = useRef(0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = Math.floor(width * dpr);
  const ch = Math.floor(height * dpr);

  const fontShort = useMemo(() => `${LABEL_SIZE}px ${LABEL_FONT}`, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = tickRef.current;
    const n = dimensions.length;
    if (n < 3) return;

    const cx = width / 2;
    const cy = height / 2;
    const topOffset = title ? 30 : 10;
    const R = Math.min(width, height - topOffset - 25) / 2 - 10;
    const centerY = cy + topOffset / 2;

    ctx.clearRect(0, 0, cw, ch);

    const bgGrad = ctx.createRadialGradient(cx * dpr, centerY * dpr, 0, cx * dpr, centerY * dpr, (R + 20) * dpr);
    bgGrad.addColorStop(0, 'rgba(57, 255, 20, 0.03)');
    bgGrad.addColorStop(0.7, 'rgba(57, 255, 20, 0.01)');
    bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    const getPoint = (i: number, r: number) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
    };

    const gridLevels = [0.25, 0.5, 0.75, 1.0];
    for (const level of gridLevels) {
      const gr = R * level;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = getPoint(i, gr);
        if (i === 0) ctx.moveTo(p.x * dpr, p.y * dpr);
        else ctx.lineTo(p.x * dpr, p.y * dpr);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(57,255,20,${0.04 + level * 0.04})`;
      ctx.lineWidth = (level === 1.0 ? 1.0 : 0.4) * dpr;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
      const p = getPoint(i, R);
      ctx.beginPath();
      ctx.moveTo(cx * dpr, centerY * dpr);
      ctx.lineTo(p.x * dpr, p.y * dpr);
      ctx.strokeStyle = 'rgba(57,255,20,0.15)';
      ctx.lineWidth = 0.5 * dpr;
      ctx.stroke();
    }

    const minVisibleRatio = 0.08;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      let ratio = Math.min(Math.max(dimensions[i].value / dimensions[i].maxValue, 0), 1);
      if (ratio < minVisibleRatio && ratio > 0) ratio = minVisibleRatio;
      const p = getPoint(i, R * ratio);
      if (i === 0) ctx.moveTo(p.x * dpr, p.y * dpr);
      else ctx.lineTo(p.x * dpr, p.y * dpr);
    }
    ctx.closePath();

    const fillGrad = ctx.createRadialGradient(cx * dpr, centerY * dpr, 0, cx * dpr, centerY * dpr, R * 0.8 * dpr);
    fillGrad.addColorStop(0, 'rgba(57, 255, 20, 0.18)');
    fillGrad.addColorStop(0.5, 'rgba(57,255,20,0.08)');
    fillGrad.addColorStop(1, 'rgba(57, 255, 20, 0.02)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    const pulse = 1 + 0.03 * Math.sin(tick * 0.04);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      let ratio = Math.min(Math.max(dimensions[i].value / dimensions[i].maxValue, 0), 1);
      if (ratio < minVisibleRatio && ratio > 0) ratio = minVisibleRatio;
      const p = getPoint(i, R * ratio);
      if (i === 0) ctx.moveTo(p.x * dpr, p.y * dpr);
      else ctx.lineTo(p.x * dpr, p.y * dpr);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(57,255,20,${0.55 * pulse})`;
    ctx.lineWidth = 1.8 * dpr;
    ctx.shadowColor = 'rgba(57, 255, 20, 0.6)';
    ctx.shadowBlur = 10 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < n; i++) {
      let ratio = Math.min(Math.max(dimensions[i].value / dimensions[i].maxValue, 0), 1);
      if (ratio < minVisibleRatio && ratio > 0) ratio = minVisibleRatio;
      const p = getPoint(i, R * ratio);
      const dColor = dimensions[i].color || '#39ff14';
      const dpulse = 1 + 0.15 * Math.sin(tick * 0.06 + i);

      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, 5 * dpulse * dpr, 0, Math.PI * 2);
      if (dColor.startsWith('#')) {
        const r = parseInt(dColor.slice(1, 3), 16);
        const g = parseInt(dColor.slice(3, 5), 16);
        const b = parseInt(dColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
      } else {
        ctx.fillStyle = 'rgba(57,255,20,0.18)';
      }
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, 3 * dpr, 0, Math.PI * 2);
      if (dColor.startsWith('#')) {
        const r = parseInt(dColor.slice(1, 3), 16);
        const g = parseInt(dColor.slice(3, 5), 16);
        const b = parseInt(dColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      } else {
        ctx.fillStyle = '#39ff14';
      }
      ctx.fill();
    }

    // 使用 Pretext 计算多行标签的精确尺寸
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < n; i++) {
      const p = getPoint(i, R + 22);
      const label = dimensions[i].label;

      const prepared = prepareWithSegments(label, fontShort, { whiteSpace: 'pre-wrap', wordBreak: 'keep-all' });
      const labelResult = layoutWithLines(prepared, LABEL_MAX_WIDTH, LABEL_LINE_HEIGHT);
      const lines = labelResult.lines;

      const maxTextWidth = Math.max(...lines.map(l => l.width), 0);
      const boxH = lines.length * LABEL_LINE_HEIGHT + 4;
      const boxW = maxTextWidth + 12;
      const boxX = p.x - boxW / 2;
      const boxY = p.y - boxH / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(boxX * dpr, boxY * dpr, boxW * dpr, boxH * dpr);
      ctx.strokeStyle = 'rgba(57,255,20,0.3)';
      ctx.lineWidth = 0.5 * dpr;
      ctx.strokeRect(boxX * dpr, boxY * dpr, boxW * dpr, boxH * dpr);

      ctx.font = `${LABEL_SIZE * dpr}px ${LABEL_FONT}`;
      ctx.fillStyle = 'rgba(57, 255, 20, 0.7)';
      for (let li = 0; li < lines.length; li++) {
        const lineY = p.y - ((lines.length - 1) * LABEL_LINE_HEIGHT) / 2 + li * LABEL_LINE_HEIGHT;
        ctx.fillText(lines[li].text, p.x * dpr, lineY * dpr);
      }
    }

    // 中心得分
    const avgScore = Math.round(
      dimensions.reduce((sum, d) => sum + (d.value / d.maxValue) * 100, 0) / n
    );
    ctx.fillStyle = 'rgba(57,255,20,0.15)';
    ctx.beginPath();
    ctx.arc(cx * dpr, centerY * dpr, 18 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
    ctx.lineWidth = 0.8 * dpr;
    ctx.stroke();

    ctx.fillStyle = '#39ff14';
    ctx.font = `bold ${13 * dpr}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${avgScore}`, cx * dpr, centerY * dpr - 3 * dpr);

    ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
    ctx.font = `${7 * dpr}px "Courier New", monospace`;
    ctx.fillText('得分', cx * dpr, centerY * dpr + 8 * dpr);

    // 四角数值标注
    for (let i = 0; i < n; i++) {
      let ratio = Math.min(Math.max(dimensions[i].value / dimensions[i].maxValue, 0), 1);
      if (ratio < minVisibleRatio && ratio > 0) ratio = minVisibleRatio;
      const p = getPoint(i, R * ratio);
      const score = Math.round(dimensions[i].value);
      const dColor = dimensions[i].color || '#39ff14';

      if (dColor.startsWith('#')) {
        const r = parseInt(dColor.slice(1, 3), 16);
        const g = parseInt(dColor.slice(3, 5), 16);
        const b = parseInt(dColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
      } else {
        ctx.fillStyle = '#39ff14';
      }
      ctx.font = `bold ${8 * dpr}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${score}`, p.x * dpr, (p.y - 4) * dpr);
    }

    // HUD
    if (title) {
      ctx.fillStyle = 'rgba(57, 255, 20, 0.5)';
      ctx.font = `bold ${9 * dpr}px "Courier New", monospace`;
      ctx.textAlign = 'start';
      ctx.fillText(title, 12 * dpr, 16 * dpr);
    }
    if (subtitle) {
      ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
      ctx.font = `${7 * dpr}px "Courier New", monospace`;
      ctx.textAlign = 'end';
      ctx.fillText(subtitle, (width - 12) * dpr, 16 * dpr);
    }

    ctx.fillStyle = 'rgba(0,240,255,0.25)';
    ctx.font = `${8 * dpr}px "Courier New", monospace`;
    ctx.textAlign = 'start';
    ctx.fillText(`${n} DIMENSIONS · ${avgScore}%`, 12 * dpr, (height - 6) * dpr);

    ctx.textAlign = 'end';
    ctx.fillText('RADAR.ACTIVE.SCAN', (width - 12) * dpr, (height - 6) * dpr);

    tickRef.current++;
  }, [dimensions, width, height, title, subtitle, dpr, cw, ch]);

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