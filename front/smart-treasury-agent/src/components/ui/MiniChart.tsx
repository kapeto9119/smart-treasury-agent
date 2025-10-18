"use client";

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniChart({ data, color = "#3b82f6", height = 40 }: MiniChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((value - min) / range) * height;
    return `${x},${height - y}`;
  }).join(" ");

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        fill={`url(#gradient-${color})`}
        points={`0,${height} ${points} 100,${height}`}
      />
    </svg>
  );
}

