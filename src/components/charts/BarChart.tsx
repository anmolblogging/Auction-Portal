interface BarData { name: string; spent: number; remaining: number }
interface BarChartProps { data: BarData[] }

export default function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map((d) => (d.spent || 0) + (d.remaining || 0))) || 1;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, padding: '0 4px' }}>
      {data.map((d) => {
        const spentH = Math.round(((d.spent || 0) / max) * 120);
        const remH = Math.round(((d.remaining || 0) / max) * 120);
        return (
          <div key={d.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 120, gap: 1 }}>
              <div style={{ width: '100%', height: spentH, background: 'var(--g)', borderRadius: '3px 3px 0 0', transition: 'height .5s' }} />
              <div style={{ width: '100%', height: remH, background: 'var(--bd2)', borderRadius: remH > 0 && spentH === 0 ? '3px 3px 0 0' : 0, transition: 'height .5s' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
