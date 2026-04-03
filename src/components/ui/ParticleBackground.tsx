import React, { useEffect, useRef } from 'react';
import { useAudioEffects } from '@/hooks/use-audio-effects';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseX: number;
  baseY: number;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000 };
    
    // Hyper-Intense Constants
    const PARTICLE_COUNT = 400; 
    const CONNECTION_RADIUS = 160;
    const MOUSE_ATTRACT_RADIUS = 300;
    const PARTICLE_COLOR = 'rgba(0, 212, 255, 1)'; 
    const LINE_COLOR = '0, 212, 255'; 

    // Optimized Glow Sprite
    const glowCanvas = document.createElement('canvas');
    const glowCtx = glowCanvas.getContext('2d');
    const glowSize = 40;
    glowCanvas.width = glowSize;
    glowCanvas.height = glowSize;
    if (glowCtx) {
        const gradient = glowCtx.createRadialGradient(glowSize/2, glowSize/2, 0, glowSize/2, glowSize/2, glowSize/2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)'); // More pure cyan
        gradient.addColorStop(0.3, 'rgba(0, 180, 255, 0.4)');
        gradient.addColorStop(1, 'transparent');
        glowCtx.fillStyle = gradient;
        glowCtx.fillRect(0, 0, glowSize, glowSize);
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const densityFactor = (window.innerWidth * window.innerHeight) / 4500;
      const count = Math.min(PARTICLE_COUNT, densityFactor);
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 1.2; // Aggressive base speeds
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 1.8 + 0.8,
          baseX: 0,
          baseY: 0
        });
      }
    };

    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let hasStartedAudio = false;

    const initAudio = () => {
      if (hasStartedAudio) return;
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(40, audioCtx.currentTime); // Deep Bass Hum
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        hasStartedAudio = true;
      } catch (e) {
        console.warn("Audio hum blocked by browser policy");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasStartedAudio) initAudio();
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Audio Response logic
      if (gainNode && audioCtx) {
          const dx = mouse.x - (canvas.width / 2);
          const dy = mouse.y - (canvas.height / 2);
          const distToCenter = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
          
          // Hum gets louder and slightly higher pitched as you interact
          const intensity = Math.max(0, 1 - distToCenter / maxDist);
          gainNode.gain.setTargetAtTime(intensity * 0.05, audioCtx.currentTime, 0.1);
          oscillator?.frequency.setTargetAtTime(40 + intensity * 20, audioCtx.currentTime, 0.1);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Kinetic Movement
        p.x += p.vx;
        p.y += p.vy;

        // Snappy Bounce
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > canvas.width) { p.x = canvas.width; p.vx *= -1; }
        
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > canvas.height) { p.y = canvas.height; p.vy *= -1; }

        // Strong Mouse Interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        let pullFactor = 1;

        if (dist < MOUSE_ATTRACT_RADIUS) {
          const force = (MOUSE_ATTRACT_RADIUS - dist) / MOUSE_ATTRACT_RADIUS;
          p.vx += (dx / dist) * force * 0.45; // High G attraction
          p.vy += (dy / dist) * force * 0.45;
          p.radius = Math.min(3.5, p.radius + 0.2);
          pullFactor = 1 + force * 2; // Intensity multiplier
        } else {
          if (p.radius > 1.2) p.radius -= 0.1;
        }

        // Low friction for persistent energy
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        // Dynamic speed clamping
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > 5) { // Cap at higher speed
            p.vx *= 0.9;
            p.vy *= 0.9;
        } else if (currentSpeed < 1) {
            p.vx *= 1.1; 
            p.vy *= 1.1;
        }

        // HIGH INTENSITY CONNECTIONS
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const d2 = dx2 * dx2 + dy2 * dy2;

          if (d2 < CONNECTION_RADIUS * CONNECTION_RADIUS) {
            const dist2 = Math.sqrt(d2);
            // Hyper-vibrant lines near mouse
            const opacity = (1 - (dist2 / CONNECTION_RADIUS)) * 0.8 * (pullFactor > 1.5 ? 1.2 : 1);
            
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${LINE_COLOR}, ${Math.min(0.9, opacity)})`;
            ctx.lineWidth = 1.2 * opacity;
            ctx.stroke();
          }
        }

        // Rendering with Proximity Overload
        const s = p.radius * 12 * Math.min(1.5, pullFactor);
        ctx.globalAlpha = Math.min(1, 0.4 + (pullFactor - 1));
        ctx.drawImage(glowCanvas, p.x - s/2, p.y - s/2, s, s);
        ctx.globalAlpha = 1;

        // Solid neon core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = PARTICLE_COLOR;
        ctx.fill();
        
        // Core glow hit
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; // White hot core
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen opacity-80"
    />
  );
};

export default ParticleBackground;
