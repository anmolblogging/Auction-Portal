export default function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid #333', borderTopColor: 'var(--g)',
      borderRadius: '50%', animation: 'spin .7s linear infinite', verticalAlign: 'middle',
    }} />
  );
}
