import { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

export function CursorSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    let lastSparkleTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      
      // Create sparkles every 30ms to avoid too many
      if (now - lastSparkleTime > 30) {
        const newSparkle: Sparkle = {
          id: nextId,
          x: e.clientX + (Math.random() - 0.5) * 40,
          y: e.clientY + (Math.random() - 0.5) * 40,
          size: Math.random() * 6 + 2,
          duration: Math.random() * 600 + 400,
        };

        setSparkles(prev => {
          const updated = [...prev, newSparkle];
          // Keep only the last 20 sparkles to avoid performance issues
          return updated.slice(-20);
        });

        setNextId(prev => prev + 1);
        lastSparkleTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [nextId]);

  // Remove sparkles after their animation completes
  useEffect(() => {
    const timers = sparkles.map(sparkle => {
      return setTimeout(() => {
        setSparkles(prev => prev.filter(s => s.id !== sparkle.id));
      }, sparkle.duration);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [sparkles]);

  return (
    <>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="pointer-events-none fixed"
          style={{
            left: `${sparkle.x}px`,
            top: `${sparkle.y}px`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animation: `sparkleFloat ${sparkle.duration}ms ease-out forwards`,
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(255, 158, 203, 0.8), rgba(255, 158, 203, 0))`,
              boxShadow: '0 0 6px rgba(255, 158, 203, 0.6)',
            }}
          />
        </div>
      ))}
    </>
  );
}
