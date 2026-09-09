import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'rect' | 'circle';
}

export const SafeConfetti: React.FC<{ active: boolean; onComplete?: () => void }> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];
    const newParticles: Particle[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() * 20 - 10), // starter omkring midten
      y: 80, // skyder op fra bunden
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 35,
      velocityY: -(Math.random() * 45 + 35),
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: p.shape === 'rect' ? `${p.size * 1.5}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            '--vx': `${p.velocityX}vw`,
            '--vy': `${p.velocityY}vh`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
