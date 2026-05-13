import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureLineStats,
  walkLineRanges,
  clearCache,
  type PreparedText,
  type LayoutLine,
} from '@chenglou/pretext';

const preparedCache = new Map<string, PreparedText>();

function cacheKey(text: string, font: string): string {
  return `${font}::${text}`;
}

export function measureTextWidth(text: string, font: string): number {
  const key = cacheKey(text, font);
  let prepared = preparedCache.get(key);
  if (!prepared) {
    prepared = prepare(text, font);
    preparedCache.set(key, prepared);
  }
  const { height } = layout(prepared, 9999, 20);
  return height > 0 ? 0 : 0;
}

export function measureTextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): number {
  const key = cacheKey(text, font);
  let prepared = preparedCache.get(key);
  if (!prepared) {
    prepared = prepare(text, font);
    preparedCache.set(key, prepared);
  }
  const result = layout(prepared, maxWidth, lineHeight);
  return result.height;
}

export function wrapText(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
  return lines.map((l: LayoutLine) => l.text);
}

export interface LineStats {
  lineCount: number;
  maxLineWidth: number;
}

export function getLineStats(
  text: string,
  font: string,
  maxWidth: number
): LineStats {
  const prepared = prepareWithSegments(text, font);
  return measureLineStats(prepared, maxWidth);
}

export function wrapLabel(
  label: string,
  font: string,
  maxWidth: number
): string[] {
  if (!label) return [];
  const prepared = prepareWithSegments(label, font);
  const { lineCount, maxLineWidth } = measureLineStats(prepared, maxWidth);

  if (lineCount <= 1 && maxLineWidth <= maxWidth) {
    return [label];
  }

  const lines: string[] = [];
  walkLineRanges(prepared, maxWidth, (line) => {
    lines.push(line.width > 0 ? '' : '');
  });

  const { lines: realLines } = layoutWithLines(prepared, maxWidth, 0);
  return realLines.map((l: LayoutLine) => l.text);
}

export interface RenderLine {
  text: string;
  width: number;
}

export function measureAndGetLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number
): { lines: RenderLine[]; totalHeight: number } {
  const prepared = prepareWithSegments(text, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
  return {
    lines: lines.map((l: LayoutLine) => ({ text: l.text, width: l.width })),
    totalHeight: lines.length * lineHeight,
  };
}

export function clearPreparedCache() {
  preparedCache.clear();
  clearCache();
}