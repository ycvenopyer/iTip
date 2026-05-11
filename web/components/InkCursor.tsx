"use client";

import { useEffect, useRef, useCallback } from "react";

interface InkDrop {
  x: number;
  y: number;
  size: number;
  opacity: number;
  growth: number;
  life: number;
  maxLife: number;
}

export function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<InkDrop[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });
  const animationRef = useRef<number | null>(null);
  const lastDropTime = useRef(0);

  const createDrop = useCallback((x: number, y: number, speed: number) => {
    const baseSize = Math.random() * 15 + 8;
    const size = Math.min(baseSize + speed * 0.5, 40);
    const drop: InkDrop = {
      x,
      y,
      size,
      opacity: Math.random() * 0.3 + 0.2,
      growth: Math.random() * 0.3 + 0.2,
      life: 0,
      maxLife: Math.random() * 60 + 40,
    };
    dropsRef.current.push(drop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      const { x, y, lastX, lastY } = mouseRef.current;
      const dx = x - lastX;
      const dy = y - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);

      // 创建新的墨滴
      const now = Date.now();
      if (speed > 2 && now - lastDropTime.current > 30) {
        createDrop(x, y, speed);
        lastDropTime.current = now;

        // 快速移动时创建额外的小墨滴
        if (speed > 20 && Math.random() > 0.5) {
          const offsetX = (Math.random() - 0.5) * 30;
          const offsetY = (Math.random() - 0.5) * 30;
          createDrop(x + offsetX, y + offsetY, speed * 0.5);
        }
      }

      mouseRef.current.lastX = x;
      mouseRef.current.lastY = y;

      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新和绘制墨滴
      dropsRef.current = dropsRef.current.filter((drop) => {
        drop.life++;
        drop.size += drop.growth;

        if (drop.life >= drop.maxLife) {
          return false;
        }

        const progress = drop.life / drop.maxLife;
        const fadeOpacity = drop.opacity * (1 - progress);

        // 绘制墨滴 - 使用径向渐变模拟水墨扩散
        const gradient = ctx.createRadialGradient(
          drop.x,
          drop.y,
          0,
          drop.x,
          drop.y,
          drop.size
        );
        gradient.addColorStop(0, `rgba(40, 35, 30, ${fadeOpacity * 0.8})`);
        gradient.addColorStop(0.4, `rgba(50, 45, 40, ${fadeOpacity * 0.4})`);
        gradient.addColorStop(0.7, `rgba(60, 55, 50, ${fadeOpacity * 0.15})`);
        gradient.addColorStop(1, `rgba(70, 65, 60, 0)`);

        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 添加不规则边缘效果
        if (drop.size > 20) {
          ctx.save();
          ctx.globalAlpha = fadeOpacity * 0.1;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = drop.size * (0.9 + Math.random() * 0.2);
            const px = drop.x + Math.cos(angle) * r;
            const py = drop.y + Math.sin(angle) * r;
            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
          ctx.fillStyle = "rgba(40, 35, 30, 0.3)";
          ctx.filter = "blur(2px)";
          ctx.fill();
          ctx.restore();
        }

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createDrop]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
