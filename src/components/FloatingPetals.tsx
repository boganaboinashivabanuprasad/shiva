import { useEffect, useRef } from 'react';

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
  hueOffset: number;
}

export function FloatingPetals({ count = 35 }: { count?: number }) {
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

    const petals: Petal[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: 8 + Math.random() * 12,
      speedY: 0.6 + Math.random() * 1.2,
      speedX: -0.4 + Math.random() * 0.8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      opacity: 0.35 + Math.random() * 0.45,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      hueOffset: (Math.random() - 0.5) * 15,
    }));

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.sin(p.wobble) * 0.3 + 0.7, 1);

      // Lotus petal gradient
      const grad = ctx.createLinearGradient(0, -p.size, 0, p.size);
      grad.addColorStop(0, `rgba(255, 220, 235, ${p.opacity})`);
      grad.addColorStop(0.5, `rgba(244, 114, 182, ${p.opacity * 0.85})`);
      grad.addColorStop(1, `rgba(219, 39, 119, ${p.opacity * 0.7})`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Curved organic lotus petal path
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.4, p.size * 0.9, p.size * 0.5, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.5, -p.size * 0.8, -p.size * 0.4, 0, -p.size);
      ctx.fill();

      // Soft center petal vein
      ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.4})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.lineTo(0, p.size * 0.6);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.6;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        drawPetal(p);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      id="floating-petals-canvas"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full opacity-80"
    />
  );
}
