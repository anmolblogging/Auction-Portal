interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  photo?: string | null;
}

export default function Avatar({ name, size = 36, color = '#00DC72', photo }: AvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, flexShrink: 0 }}
      />
    );
  }
  const initials = (name || '').split(' ').map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.36,
      color, flexShrink: 0, letterSpacing: 1,
    }}>
      {initials}
    </div>
  );
}
