export interface LevelInfo {
  level: number;
  label: string;
  pointsIntoLevel: number;
  pointsForNextLevel: number | null;
}

const THRESHOLDS = [0, 50, 150, 300, 500, 1000] as const;

export function getLevelInfo(points: number): LevelInfo {
  const p = Math.max(0, points);

  let level = 1;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (p >= THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = THRESHOLDS[level - 1];
  const nextThreshold = level < THRESHOLDS.length ? THRESHOLDS[level] : null;

  return {
    level,
    label: `Level ${level}`,
    pointsIntoLevel: p - currentThreshold,
    pointsForNextLevel: nextThreshold !== null ? nextThreshold - p : null,
  };
}
