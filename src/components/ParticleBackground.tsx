import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface MedicalFloatingGlyph {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
  color: string;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes
    const colors = ['#06b6d4', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981'];
    const particleCount = Math.min(42, Math.floor((width * height) / 32000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.35 + 0.15,
      });
    }

    // Floating subtle medical symbols & DNA glyphs
    const medicalSymbols = ['+', '🧬', '⚕', '🔬', '🛡', '+', '⬡'];
    const glyphCount = 14;
    const glyphs: MedicalFloatingGlyph[] = [];

    for (let i = 0; i < glyphCount; i++) {
      glyphs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        char: medicalSymbols[Math.floor(Math.random() * medicalSymbols.length)],
        size: Math.random() * 10 + 12,
        alpha: Math.random() * 0.18 + 0.08,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.005,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let pulsePhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle cyber-grid background dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
      const step = 64;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Draw subtle ECG pulse-wave along bottom third
      pulsePhase += 0.025;
      const ecgY = height * 0.88;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.07)';
      ctx.lineWidth = 1.2;

      for (let x = 0; x < width; x += 6) {
        // Form a periodic P-Q-R-S-T heartbeat wave
        const cycle = ((x * 0.005 - pulsePhase) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        let spike = 0;
        if (cycle > 2.0 && cycle < 2.2) spike = -12; // P wave
        else if (cycle > 2.2 && cycle < 2.3) spike = 4; // Q
        else if (cycle > 2.3 && cycle < 2.45) spike = -45; // R peak
        else if (cycle > 2.45 && cycle < 2.6) spike = 18; // S drop
        else if (cycle > 2.7 && cycle < 3.0) spike = -14; // T wave

        const y = ecgY + spike;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw particle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const linkAlpha = (1 - dist / 135) * 0.1;
            ctx.strokeStyle = `rgba(139, 92, 246, ${linkAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update medical glyphs
      glyphs.forEach((g) => {
        g.x += g.vx;
        g.y += g.vy;
        g.rotation += g.vRot;

        if (g.x < -30) g.x = width + 30;
        else if (g.x > width + 30) g.x = -30;
        if (g.y < -30) g.y = height + 30;
        else if (g.y > height + 30) g.y = -30;

        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rotation);
        ctx.font = `${g.size}px monospace, 'Segoe UI Symbol'`;
        ctx.fillStyle = g.color;
        ctx.globalAlpha = g.alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.char, 0, 0);
        ctx.restore();
      });

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
