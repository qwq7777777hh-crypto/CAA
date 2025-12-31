
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';
import { SacredEmergenceScore } from '../utils/audio';

interface EmergenceVisualizerProps {
  onComplete: () => void;
}

const EmergenceVisualizer: React.FC<EmergenceVisualizerProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<boolean>(false);
  const musicRef = useRef<SacredEmergenceScore | null>(null);

  useEffect(() => {
    if (mountRef.current || !containerRef.current) return;
    mountRef.current = true;

    // --- 初始化音频 ---
    musicRef.current = new SacredEmergenceScore();
    musicRef.current.start();

    // --- 初始化参数 ---
    const particleCount = 30000; // 稍微提升一点密度，视觉效果更好
    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- 场景设置 ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 4000);
    camera.position.z = 800;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 2.8, 0.6, 0.7);
    bloomPass.threshold = 0.0;
    bloomPass.strength = 1.8;
    bloomPass.radius = 1.0;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const brainPositions = new Float32Array(particleCount * 3);
    const textPositions = new Float32Array(particleCount * 3);
    const randomDirs = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const purpleMain = new THREE.Color(0xA855F7);
    const purpleAccent = new THREE.Color(0xE879F9); // 更明亮的粉紫
    const techBlue = new THREE.Color(0x3B82F6);

    for (let i = 0; i < particleCount; i++) {
      // 初始分散状态
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      // 1. 大脑形状算法 (双半球)
      const hemisphere = Math.random() > 0.5 ? 1 : -1;
      const u = Math.random();
      const v = Math.random();
      const phi = u * Math.PI * 2;
      const theta = Math.acos(2 * v - 1);
      
      const rX = 220, rY = 260, rZ = 180;
      const wrinkle = 1.0 + 
        0.1 * Math.sin(phi * 10) * Math.cos(theta * 10) + 
        0.05 * Math.sin(phi * 20) * Math.sin(theta * 15);

      const offsetX = hemisphere * 30; 
      brainPositions[i * 3] = (rX * wrinkle * Math.sin(theta) * Math.cos(phi)) + offsetX;
      brainPositions[i * 3 + 1] = (rY * wrinkle * Math.sin(theta) * Math.sin(phi));
      brainPositions[i * 3 + 2] = (rZ * wrinkle * Math.cos(theta)) * 0.9;

      // 2. 随机爆发方向
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * 800;
      randomDirs[i * 3] = Math.cos(angle) * dist;
      randomDirs[i * 3 + 1] = Math.sin(angle) * dist;
      randomDirs[i * 3 + 2] = (Math.random() - 0.5) * dist;

      // 3. 颜色梯度
      const mixT = Math.random();
      const color = mixT < 0.7 
        ? purpleMain.clone().lerp(purpleAccent, Math.random()) 
        : techBlue.clone().lerp(purpleAccent, 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    // 文字采样 (涌现)
    const sampleText = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 1024; canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 180px "Fira Code", monospace';
        ctx.fillText('涌现', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = 'bold 46px "Fira Code", monospace';
        ctx.fillText('算法逻辑的无声觉醒', canvas.width / 2, canvas.height / 2 + 80);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pts: [number, number][] = [];
        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x += 2) {
            if (imgData[(y * canvas.width + x) * 4 + 3] > 128) {
              pts.push([x - canvas.width / 2, (canvas.height / 2 - y)]);
            }
          }
        }
        for (let i = 0; i < particleCount; i++) {
          const pt = pts[i % pts.length];
          textPositions[i * 3] = pt[0] * 1.8;
          textPositions[i * 3 + 1] = pt[1] * 1.8;
          textPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
      }
    };
    sampleText();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aBrain', new THREE.BufferAttribute(brainPositions, 3));
    geometry.setAttribute('aText', new THREE.BufferAttribute(textPositions, 3));
    geometry.setAttribute('aRandomDir', new THREE.BufferAttribute(randomDirs, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMixBrain: { value: 0 },
        uMixText: { value: 0 },
        uDisperse: { value: 0 },
        uExplode: { value: 0 },
        uPointSize: { value: 2.2 },
        uBloomFactor: { value: 1.0 }
      },
      vertexShader: `
        attribute vec3 aBrain;
        attribute vec3 aText;
        attribute vec3 aRandomDir;
        attribute vec3 color;
        
        uniform float uTime;
        uniform float uMixBrain;
        uniform float uMixText;
        uniform float uDisperse;
        uniform float uExplode;
        uniform float uPointSize;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vec3 pos = mix(position, aBrain, uMixBrain);
          pos = mix(pos, aText, uMixText);
          pos += aRandomDir * uDisperse;
          
          // 脉动效果
          float pulse = sin(uTime * 3.0 + length(pos) * 0.01) * 3.5 * uMixBrain * (1.0 - uMixText);
          pos += normalize(pos) * pulse;
          
          // 最终爆发
          pos += normalize(pos) * uExplode * 2000.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uPointSize * (1000.0 / -mvPosition.z);
          
          vAlpha = 1.0 - clamp(uExplode * 1.5, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float glow = pow(1.0 - d * 2.0, 2.5);
          gl_FragColor = vec4(vColor, glow * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- 同步动画序列 ---
    const mainTl = gsap.timeline({ 
      onComplete: () => {
        if (musicRef.current) musicRef.current.stop();
        setTimeout(onComplete, 800);
      } 
    });

    // 0. 进场
    mainTl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 });

    // 1. 凝聚大脑 (0-4s)
    mainTl.to(material.uniforms.uMixBrain, { value: 1, duration: 4.5, ease: "expo.inOut" }, 0);
    mainTl.to(points.rotation, { y: Math.PI * 0.4, duration: 4.5, ease: "none" }, 0);

    // 2. 音频高潮与大脑爆发 (4.5 - 7s)
    mainTl.to(material.uniforms.uPointSize, { 
      value: 6.0, 
      duration: 1.2, 
      repeat: 1, 
      yoyo: true,
      onStart: () => {
        if (musicRef.current) musicRef.current.triggerClimax();
      }
    }, 4.5);
    mainTl.to(bloomPass, { strength: 4.0, duration: 1.2, repeat: 1, yoyo: true }, 4.5);

    // 3. 散开并聚拢为文字 & 音频转平静 (7.5 - 11s)
    const morphSequence = gsap.timeline({
      onStart: () => {
        if (musicRef.current) musicRef.current.goCalm();
      }
    });
    morphSequence.to(material.uniforms.uMixBrain, { value: 0, duration: 0.8, ease: "power2.in" });
    morphSequence.to(material.uniforms.uDisperse, { value: 1.8, duration: 1.5, ease: "expo.out" }, 0);
    morphSequence.to(material.uniforms.uMixText, { value: 1, duration: 2.5, ease: "expo.inOut" }, 0.8);
    morphSequence.to(material.uniforms.uDisperse, { value: 0, duration: 1.8, ease: "power2.inOut" }, 1.5);
    
    mainTl.add(morphSequence, 7.5);
    mainTl.to(points.rotation, { y: 0, duration: 2.5, ease: "power2.inOut" }, 8.5);

    // 4. 彻底消失
    mainTl.to(material.uniforms.uExplode, { value: 1, duration: 2.5, ease: "power4.in" }, 12);
    mainTl.to(containerRef.current, { opacity: 0, duration: 1.5 }, 12.5);

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h); composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    let raf: number;
    const animate = (t: number) => {
      raf = requestAnimationFrame(animate);
      material.uniforms.uTime.value = t * 0.001;
      composer.render();
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      if (musicRef.current) musicRef.current.stop();
      geometry.dispose(); material.dispose(); renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-black"
      style={{ touchAction: 'none' }}
    />
  );
};

export default EmergenceVisualizer;
