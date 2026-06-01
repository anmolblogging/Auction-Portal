interface DonutData { name: string; value: number; color: string }
interface DonutChartProps { data: DonutData[] }

export default function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '40px 0', fontSize: 13 }}>No data yet</div>;
  }
  const r = 55, cx = 80, cy = 80, strokeW = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 160 160" width="100%" height={160}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color} strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            style={{ transition: 'all .5s' }}
          />
        );
        offset += pct;
        return el;
      })}
      <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="var(--t1)"
        fontFamily="'Bebas Neue', sans-serif" fontSize={18} letterSpacing={1}>
        ₹{total}L
      </text>
    </svg>
  );
}
