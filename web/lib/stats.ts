import type { Prediction, LabelScore } from "./types";

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export function topEmotions(preds: Prediction[], topN = 8): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of preds) {
    for (const l of p.labelsOverThreshold) {
      map.set(l.label, (map.get(l.label) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function emotionDistribution(preds: Prediction[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of preds) {
    // Count all top labels (not only thresholded) to give a stable distribution
    for (const l of p.top) {
      map.set(l.label, (map.get(l.label) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function rollingTrend(preds: Prediction[], labels: string[], windowSize = 10) {
  // Returns chart-friendly points: [{ i, <label1>, <label2>, ... }]
  const out: Array<Record<string, number>> = [];
  const ordered = [...preds].sort((a, b) => a.createdAt - b.createdAt);

  for (let i = 0; i < ordered.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = ordered.slice(start, i + 1);
    const point: Record<string, number> = { i: i + 1 };
    for (const label of labels) point[label] = 0;
    for (const p of slice) {
      for (const l of p.labelsOverThreshold) {
        if (labels.includes(l.label)) point[l.label] += 1;
      }
    }
    out.push(point);
  }
  return out;
}
