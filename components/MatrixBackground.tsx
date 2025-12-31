
import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      layers.forEach(layer => {
        const columnSpacing = layer.spacing;
        const layerColumns = Math.floor(width / columnSpacing);
        layer.drops = new Array(layerColumns).fill(0).map(() => Math.random() * -100);
      });
    };

    const layers = [
      { 
        drops: [] as number[], 
        speed: 0.12, 
        size: 14, 
        spacing: 32, 
        opacity: 0.22, 
        chars: ["0", "1", "010", "110", "001", "1011", "00"],
        color: '168, 85, 247' // Purple
      },
      { 
        drops: [] as number[], 
        speed: 0.20, 
        size: 11, 
        spacing: 24, 
        opacity: 0.18, 
        chars: ["0", "1", "1001", "011", "11", "000", "101"],
        color: '59, 130, 246' // Blue
      },
      { 
        drops: [] as number[], 
        speed: 0.08, 
        size: 18, 
        spacing: 55, 
        opacity: 0.12, 
        chars: ["日", "ﾊ", "0101", "11001", "ﾐ", "ﾋ", "ｳ", "ｼ", "101"],
        color: '139, 92, 246' // Indigo/Mix
      }
    ];

    updateSize();

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
      ctx.fillRect(0, 0, width, height);

      layers.forEach((layer) => {
        ctx.font = `${layer.size}px 'Fira Code'`;
        
        for (let i = 0; i < layer.drops.length; i++) {
          const x = i * layer.spacing;
          const y = layer.drops[i] * layer.size;

          if (y > -layer.size * 5) { // Adjusted offset to allow for vertical fragments
            const text = layer.chars[Math.floor(Math.random() * layer.chars.length)];
            const textLength = text.length;
            
            // Calculate gradient for the entire vertical block
            const blockHeight = textLength * layer.size;
            const gradient = ctx.createLinearGradient(x, y - 100, x, y + blockHeight);
            gradient.addColorStop(0, 'rgba(5, 5, 5, 0)');
            gradient.addColorStop(0.5, `rgba(${layer.color}, ${layer.opacity * 0.6})`);
            gradient.addColorStop(1, `rgba(${layer.color}, ${layer.opacity})`);

            ctx.fillStyle = gradient;
            
            // Draw each character in the fragment vertically
            for (let charIdx = 0; charIdx < textLength; charIdx++) {
              const char = text[charIdx];
              const charY = y + (charIdx * layer.size);
              ctx.fillText(char, x, charY);
              
              // Subtle leading character "glimmer" for the very tip of the stream
              if (charIdx === textLength - 1 && Math.random() > 0.98) {
                ctx.fillStyle = `rgba(255, 255, 255, ${layer.opacity * 1.5})`;
                ctx.fillText(char, x, charY);
              }
            }
          }

          // Reset drop when the entire vertical block goes off screen
          if (y > height && Math.random() > 0.985) {
            layer.drops[i] = -5; // Reset to just above view
          }
          layer.drops[i] += layer.speed;
        }
      });
      animationFrame = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', updateSize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ background: '#050505' }}
    />
  );
};

export default MatrixBackground;
