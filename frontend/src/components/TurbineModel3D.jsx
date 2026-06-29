import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── WATER PARTICLES (Vortex & Flow) ──
function WaterParticles({ count = 3000, gateOpen = 50 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const a = [];
    for (let i = 0; i < count; i++) {
      a.push({
        t: Math.random(), // position along flow (0 to 1)
        speed: 0.15 + Math.random() * 0.15,
        radius: Math.random() * 1.8,
        angle: Math.random() * Math.PI * 2,
      });
    }
    return a;
  }, [count]);

  const intensity = Math.max(0.05, gateOpen / 100);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.t += dt * p.speed * intensity;
      if (p.t > 1) p.t = 0;
      
      let x, y, z;
      if (p.t < 0.4) {
        // 1. Flowing down the penstock pipe
        const pt = p.t / 0.4;
        const startX = 22, startY = 12, startZ = 0;
        const endX = 6.5, endY = 1, endZ = 0;
        const cx = startX + (endX - startX) * pt;
        const cy = startY + (endY - startY) * pt;
        const cz = startZ + (endZ - startZ) * pt;
        
        // Offset within pipe (pipe radius ~ 1.8)
        x = cx + Math.sin(p.angle) * p.radius * Math.sin(Math.PI/5.5);
        y = cy + Math.cos(p.angle) * p.radius;
        z = cz + Math.sin(p.angle) * p.radius * Math.cos(Math.PI/5.5);
      } else if (p.t < 0.7) {
        // 2. Spiraling through the casing and runner
        const pt = (p.t - 0.4) / 0.3; // 0 to 1
        const spiralAngle = pt * Math.PI * 4; // 2 revolutions
        const currentRadius = 5.0 - pt * 3.5 + p.radius * 0.2;
        x = Math.cos(spiralAngle + p.angle) * currentRadius;
        y = 1 - pt * 1.5 + (Math.cos(p.angle) * 0.4);
        z = Math.sin(spiralAngle + p.angle) * currentRadius;
      } else {
        // 3. Falling down the draft tube
        const pt = (p.t - 0.7) / 0.3;
        const spiralAngle = pt * Math.PI * 2;
        const currentRadius = 1.5 + pt * 0.8 + p.radius * 0.4;
        x = Math.cos(spiralAngle + p.angle) * currentRadius;
        y = -0.5 - pt * 5.5;
        z = Math.sin(spiralAngle + p.angle) * currentRadius;
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.04 + Math.random() * 0.04);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#00bfff" transparent opacity={0.65} emissive="#006994" emissiveIntensity={0.8} />
    </instancedMesh>
  );
}

// ── DAM & PENSTOCK ──
function DamAndPenstock() {
  return (
    <group>
      {/* ── MAIN DAM BODY (concrete grey, gravity dam shape) ── */}
      {/* Base - wider at bottom for gravity dam profile */}
      <mesh position={[26, -2, 0]}>
        <boxGeometry args={[10, 12, 42]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Middle section */}
      <mesh position={[26, 10, 0]}>
        <boxGeometry args={[7, 14, 42]} />
        <meshStandardMaterial color="#929292" roughness={0.92} metalness={0.05} />
      </mesh>
      {/* Upper section - narrower */}
      <mesh position={[25.5, 22, 0]}>
        <boxGeometry args={[5, 12, 42]} />
        <meshStandardMaterial color="#9a9a9a" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Dam crest / walkway on top */}
      <mesh position={[25, 28.5, 0]}>
        <boxGeometry args={[6, 1.5, 44]} />
        <meshStandardMaterial color="#a3a3a3" roughness={0.85} metalness={0.08} />
      </mesh>

      {/* ── BUTTRESSES on downstream face ── */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`buttress-${i}`} position={[21, 6, -17.5 + i * 5]}>
          <boxGeometry args={[3, 22, 1.2]} />
          <meshStandardMaterial color="#7a7a7a" roughness={0.95} metalness={0.05} />
        </mesh>
      ))}

      {/* ── CONSTRUCTION JOINTS (horizontal lines on face) ── */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`joint-${i}`} position={[22.4, -5 + i * 3.4, 0]}>
          <boxGeometry args={[0.08, 0.08, 42.5]} />
          <meshStandardMaterial color="#666666" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* ── SPILLWAY LIP at top ── */}
      <mesh position={[23.5, 27.8, 0]}>
        <boxGeometry args={[1.5, 0.6, 20]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Spillway curved edge */}
      <mesh position={[22.5, 27, 0]} rotation={[0, 0, -Math.PI/6]}>
        <cylinderGeometry args={[0.8, 0.8, 20, 16, 1, false, 0, Math.PI/2]} />
        <meshStandardMaterial color="#a0a0a0" roughness={0.85} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* ── GUARDRAILS on top ── */}
      {Array.from({ length: 14 }).map((_, i) => (
        <group key={`rail-${i}`} position={[24.5, 29.8, -19 + i * 3]}>
          <mesh><cylinderGeometry args={[0.06, 0.06, 2.2, 8]} /><meshStandardMaterial color="#6b6b6b" metalness={0.6} roughness={0.4} /></mesh>
        </group>
      ))}
      {/* Top rail bar */}
      <mesh position={[24.5, 30.8, 0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 42, 8]} />
        <meshStandardMaterial color="#6b6b6b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── RESERVOIR WATER BODY ── */}
      <mesh position={[38, 22, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[22, 42]} />
        <meshStandardMaterial color="#1a8fcb" transparent opacity={0.6} roughness={0.1} metalness={0.4} emissive="#0369a1" emissiveIntensity={0.15} />
      </mesh>
      {/* Reservoir depth visual (vertical plane behind dam) */}
      <mesh position={[28.5, 8, 0]}>
        <boxGeometry args={[0.2, 30, 42]} />
        <meshStandardMaterial color="#0c4a6e" transparent opacity={0.3} />
      </mesh>

      {/* ── DOWNSTREAM TAILWATER POOL ── */}
      <mesh position={[4, -9.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0e7490" transparent opacity={0.35} roughness={0.2} metalness={0.3} emissive="#06b6d4" emissiveIntensity={0.08} />
      </mesh>

      {/* ── PENSTOCK PIPE (dark steel) ── */}
      <mesh position={[14.5, 6.7, 0]} rotation={[0, 0, Math.PI/5.5]}>
        <cylinderGeometry args={[1.8, 1.8, 22, 32]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.55} metalness={0.7} />
      </mesh>
      {/* Inner pipe for depth effect */}
      <mesh position={[14.5, 6.7, 0]} rotation={[0, 0, Math.PI/5.5]}>
        <cylinderGeometry args={[1.6, 1.6, 22.1, 32]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.3} metalness={0.9} side={THREE.BackSide} />
      </mesh>
      
      {/* Metal Reinforcement Rings around Penstock */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[7.5 + i*1.9, 1.8 + i*1.42, 0]} rotation={[0, 0, Math.PI/5.5]}>
          <torusGeometry args={[1.9, 0.12, 12, 48]} />
          <meshStandardMaterial color="#52525b" roughness={0.5} metalness={0.85} />
        </mesh>
      ))}

      {/* Penstock intake structure at dam face */}
      <mesh position={[22, 4, 0]}>
        <boxGeometry args={[3, 5, 5]} />
        <meshStandardMaterial color="#71717a" roughness={0.85} metalness={0.15} />
      </mesh>
      {/* Trash rack (intake grate) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`grate-${i}`} position={[20.4, 3.5, -1.8 + i * 0.72]}>
          <boxGeometry args={[0.08, 4, 0.04]} />
          <meshStandardMaterial color="#525252" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── TURBINE RUNNER (Hydrodynamic Blades) ──
function TurbineRunner({ hasAlert, gateOpen = 50 }) {
  const ref = useRef();
  const speed = Math.max(0.3, (gateOpen / 100) * 3);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * speed; });
  const col = hasAlert ? '#ff2222' : '#22c55e';
  return (
    <group ref={ref} position={[0, 0.5, 0]}>
      {/* Central Cone */}
      <mesh><coneGeometry args={[0.7, 2.5, 32]} /><meshStandardMaterial color={col} metalness={0.85} roughness={0.2} emissive={hasAlert ? '#ff0000' : '#000'} emissiveIntensity={hasAlert ? 0.4 : 0} /></mesh>
      <mesh position={[0, 1.25, 0]}><sphereGeometry args={[0.65, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={col} metalness={0.9} roughness={0.15} /></mesh>
      
      {/* Curved Francis Blades using squashed spheres */}
      {Array.from({ length: 15 }).map((_, i) => (
        <group key={i} rotation={[0, (i/15)*Math.PI*2, 0]}>
          <mesh position={[1.3, 0.1, 0]} rotation={[0.4, 0.3, -0.6]} scale={[1, 0.05, 0.45]}>
            <sphereGeometry args={[1.8, 32, 16]} />
            <meshStandardMaterial color={col} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      
      {/* Bottom Shroud Ring */}
      <mesh position={[0, -0.6, 0]}><torusGeometry args={[2.0, 0.15, 16, 64]} /><meshStandardMaterial color={hasAlert ? '#ff4444' : '#16a34a'} metalness={0.85} roughness={0.2} /></mesh>
    </group>
  );
}

// ── WICKET GATES (Hydrofoil shape) ──
function WicketGates({ gateOpen = 50, hasAlert }) {
  const openAngle = 0.1 + (gateOpen / 100) * 0.8;
  const col = hasAlert ? '#ff2222' : '#f59e0b';
  return (
    <group position={[0, 1, 0]}>
      {/* Hydrofoil Gates */}
      {Array.from({ length: 20 }).map((_, i) => {
        const a = (i/20)*Math.PI*2;
        return (
          <mesh key={i} position={[Math.cos(a)*2.8, 0, Math.sin(a)*2.8]} rotation={[0, a + openAngle, 0]} scale={[1, 1, 4]}>
            <cylinderGeometry args={[0.08, 0.02, 1.8, 16]} />
            <meshStandardMaterial color={col} metalness={0.8} roughness={0.25} emissive={hasAlert ? '#ff0000' : '#000'} emissiveIntensity={hasAlert ? 0.3 : 0} />
          </mesh>
        );
      })}
      {/* Linkage Rings */}
      <mesh position={[0, 0.95, 0]}><torusGeometry args={[2.8, 0.08, 16, 64]} /><meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.2} /></mesh>
      <mesh position={[0, -0.95, 0]}><torusGeometry args={[2.8, 0.08, 16, 64]} /><meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.2} /></mesh>
    </group>
  );
}

// ── SCROLL CASING (Teal/Cyan) ──
function ScrollCasing({ hasAlert }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i/80, a = t*1.15*Math.PI*2, r = 5.0-t*1.6;
      pts.push(new THREE.Vector3(Math.cos(a)*r, 1, Math.sin(a)*r));
    }
    return pts;
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points, false), [points]);
  const col = hasAlert ? '#ff2222' : '#06b6d4';
  return (
    <group>
      <mesh><tubeGeometry args={[curve, 80, 0.85, 16, false]} /><meshStandardMaterial color={col} metalness={0.7} roughness={0.3} transparent opacity={0.5} side={THREE.DoubleSide} emissive={hasAlert ? '#ff0000' : '#003344'} emissiveIntensity={hasAlert ? 0.4 : 0.15} /></mesh>
      <mesh position={[0, 1, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[4.2, 0.95, 16, 64]} /><meshStandardMaterial color={hasAlert ? '#991111' : '#0e7490'} metalness={0.6} roughness={0.4} transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh position={[6.5, 1, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.9, 0.9, 4, 24]} /><meshStandardMaterial color={col} metalness={0.7} roughness={0.3} transparent opacity={0.5} /></mesh>
      <mesh position={[8.5, 1, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[1.2, 1.2, 0.15, 24]} /><meshStandardMaterial color="#155e75" metalness={0.85} roughness={0.2} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i/8)*Math.PI*2;
        return <mesh key={i} position={[8.55, 1+Math.sin(a)*1.05, Math.cos(a)*1.05]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} /></mesh>;
      })}
    </group>
  );
}

// ── DRAFT TUBE (Purple) ──
function DraftTube({ hasAlert }) {
  const col = hasAlert ? '#ff2222' : '#a855f7';
  return (
    <group position={[0, -3, 0]}>
      <mesh><cylinderGeometry args={[2.0, 1.2, 3, 24, 1, true]} /><meshStandardMaterial color={col} metalness={0.6} roughness={0.35} transparent opacity={0.4} side={THREE.DoubleSide} emissive={hasAlert ? '#ff0000' : '#6b21a8'} emissiveIntensity={hasAlert ? 0.3 : 0.1} /></mesh>
      <mesh position={[0, -2.5, 0]}><cylinderGeometry args={[1.2, 1.6, 2.5, 24, 1, true]} /><meshStandardMaterial color={col} metalness={0.6} roughness={0.35} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.5, 0]}><torusGeometry args={[2.05, 0.07, 8, 48]} /><meshStandardMaterial color="#7e22ce" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, -3.7, 0]}><torusGeometry args={[1.65, 0.07, 8, 48]} /><meshStandardMaterial color="#7e22ce" metalness={0.8} roughness={0.2} /></mesh>
    </group>
  );
}

// ── SHAFT (Silver) ──
function Shaft({ gateOpen = 50 }) {
  const ref = useRef();
  const speed = Math.max(0.3, (gateOpen / 100) * 3);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * speed; });
  return (
    <group ref={ref}>
      <mesh position={[0, 5, 0]}><cylinderGeometry args={[0.3, 0.3, 8, 16]} /><meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.08} /></mesh>
      <mesh position={[0, 8.5, 0]}><cylinderGeometry args={[0.6, 0.6, 0.3, 16]} /><meshStandardMaterial color="#a0a0a0" metalness={0.9} roughness={0.1} /></mesh>
    </group>
  );
}

// ── GENERATOR (Blue) ──
function GeneratorHousing({ hasAlert }) {
  const col = hasAlert ? '#ff2222' : '#3b82f6';
  return (
    <group position={[0, 10, 0]}>
      <mesh><cylinderGeometry args={[2.5, 2.5, 3, 32]} /><meshStandardMaterial color={col} metalness={0.7} roughness={0.3} emissive={hasAlert ? '#ff0000' : '#1e40af'} emissiveIntensity={hasAlert ? 0.4 : 0.1} /></mesh>
      <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[2.6, 2.6, 0.15, 32]} /><meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.2} /></mesh>
      <mesh position={[0, -1.7, 0]}><cylinderGeometry args={[2.6, 2.6, 0.15, 32]} /><meshStandardMaterial color="#1d4ed8" metalness={0.8} roughness={0.2} /></mesh>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i/16)*Math.PI*2;
        return <mesh key={i} position={[Math.cos(a)*2.55, 0, Math.sin(a)*2.55]} rotation={[0, a, 0]}><boxGeometry args={[0.04, 2.8, 0.3]} /><meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} /></mesh>;
      })}
      <mesh position={[2.8, 0.3, 0]}><boxGeometry args={[0.8, 0.6, 0.5]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh>
      <Text position={[0, 2.1, 0]} fontSize={0.3} color="#60a5fa" anchorX="center" anchorY="middle">GENERATOR</Text>
    </group>
  );
}

// ── BEARINGS (Gold) ──
function Bearings({ hasAlert }) {
  const col = hasAlert ? '#ff2222' : '#eab308';
  return (
    <group>
      <mesh position={[0, 8, 0]}><torusGeometry args={[0.55, 0.18, 12, 32]} /><meshStandardMaterial color={col} metalness={0.85} roughness={0.2} emissive={hasAlert ? '#ff0000' : '#000'} emissiveIntensity={hasAlert ? 0.5 : 0} /></mesh>
      <mesh position={[0, 8.2, 0]}><cylinderGeometry args={[0.8, 0.8, 0.2, 24]} /><meshStandardMaterial color={col} metalness={0.85} roughness={0.2} /></mesh>
      <mesh position={[0, 2.5, 0]}><torusGeometry args={[0.45, 0.14, 12, 32]} /><meshStandardMaterial color={col} metalness={0.85} roughness={0.2} /></mesh>
    </group>
  );
}

// ── SUPPORT (Gray) ──
function SupportStructure() {
  return (
    <group>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i/12)*Math.PI*2, r = 3.6;
        return <mesh key={i} position={[Math.cos(a)*r, 1, Math.sin(a)*r]} rotation={[0, a, 0]}><boxGeometry args={[0.1, 1.5, 0.8]} /><meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} /></mesh>;
      })}
      <mesh position={[0, -7, 0]}><cylinderGeometry args={[3, 3.5, 1.5, 24]} /><meshStandardMaterial color="#475569" roughness={0.8} metalness={0.1} /></mesh>
      {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((a, i) => (
        <mesh key={i} position={[Math.cos(a)*3, 4, Math.sin(a)*3]}><cylinderGeometry args={[0.15, 0.15, 14, 8]} /><meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.3} /></mesh>
      ))}
      <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[3.3, 3.3, 0.15, 32]} /><meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} /></mesh>
    </group>
  );
}

// ── WATER LEVEL INDICATOR (animated rising/falling) ──
function WaterLevel({ level = 70, gateConnected }) {
  const ref = useRef();
  const fillRef = useRef();
  const currentLevel = useRef(gateConnected ? level : 10);

  useFrame(({ clock }, dt) => {
    const target = gateConnected ? level : 10;
    currentLevel.current += (target - currentLevel.current) * dt * 0.8;
    const cl = currentLevel.current;
    const h = Math.max(0.5, (cl / 100) * 10);
    const yPos = -2 + h / 2;

    if (ref.current) ref.current.position.y = yPos + Math.sin(clock.getElapsedTime() * 0.5) * 0.08;
    if (fillRef.current) {
      fillRef.current.scale.y = h;
      fillRef.current.position.y = -3 + h / 2;
    }
  });

  const col = level < 30 ? '#ef4444' : level < 60 ? '#f59e0b' : '#22d3ee';
  const displayCol = gateConnected ? col : '#ef4444';

  return (
    <group>
      <mesh ref={ref} rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]}>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color={displayCol} transparent opacity={gateConnected ? 0.2 : 0.05} side={THREE.DoubleSide} emissive={displayCol} emissiveIntensity={0.2} />
      </mesh>
      {/* Level gauge on side */}
      <group position={[-6, 0, 0]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[0.15, 12, 0.15]} /><meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} /></mesh>
        <mesh ref={fillRef} position={[0, -2, 0]}><boxGeometry args={[0.4, 1, 0.4]} /><meshStandardMaterial color={displayCol} transparent opacity={0.7} emissive={displayCol} emissiveIntensity={0.5} /></mesh>
        <Text position={[0, 8.5, 0.5]} fontSize={0.25} color="#94a3b8" anchorX="center">WATER LEVEL</Text>
        <Text position={[0, -3.8, 0.5]} fontSize={0.3} color={displayCol} anchorX="center">{gateConnected ? `${level}%` : 'LOW'}</Text>
      </group>
    </group>
  );
}

// ── ALERT INDICATOR (flashing red sphere) ──
function AlertMarker({ position, label }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 0.8 + Math.sin(clock.getElapsedTime() * 6) * 0.3;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref}><sphereGeometry args={[0.25, 12, 12]} /><meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
      <Text position={[0, 0.6, 0]} fontSize={0.22} color="#ff4444" anchorX="center" fontWeight="bold" outlineWidth={0.02} outlineColor="#000">⚠ {label}</Text>
    </group>
  );
}

// ── LABELS ──
function Labels() {
  const labels = [
    { text: 'DAM & RESERVOIR', pos: [26, 23, 0], color: '#94a3b8' },
    { text: 'PENSTOCK', pos: [14.5, 9.5, 0], color: '#64748b' },
    { text: 'SCROLL CASING', pos: [6, 2.5, 4], color: '#22d3ee' },
    { text: 'WICKET GATES', pos: [3.8, 2.5, -2.5], color: '#f59e0b' },
    { text: 'FRANCIS RUNNER', pos: [-3.5, -0.5, 2], color: '#22c55e' },
    { text: 'DRAFT TUBE', pos: [2.5, -5, 2], color: '#a855f7' },
    { text: 'SHAFT', pos: [-2, 5, 0], color: '#c0c0c0' },
    { text: 'GENERATOR', pos: [4, 11, 0], color: '#60a5fa' },
    { text: 'BEARINGS', pos: [2, 8.5, 2], color: '#eab308' },
  ];
  return (
    <group>{labels.map((l, i) => (
      <Float key={i} speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Text position={l.pos} fontSize={0.4} color={l.color} anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.03} outlineColor="#000">{l.text}</Text>
      </Float>
    ))}</group>
  );
}

// ── SCENE ──
function TurbineScene({ latest, alertMap, gateOpen, waterLevel, gateConnected }) {
  // Center everything slightly to the left to fit the giant dam on the right
  return (
    <group position={[-5, -4, 0]}>
      <DamAndPenstock />
      <ScrollCasing hasAlert={alertMap.casing} />
      <WicketGates gateOpen={gateConnected ? gateOpen : 5} hasAlert={alertMap.gate} />
      <TurbineRunner hasAlert={alertMap.vibration} gateOpen={gateConnected ? gateOpen : 5} />
      <DraftTube hasAlert={alertMap.draft} />
      <Shaft gateOpen={gateConnected ? gateOpen : 5} />
      <GeneratorHousing hasAlert={alertMap.stator || alertMap.frequency} />
      <Bearings hasAlert={alertMap.bearing} />
      <SupportStructure />
      <WaterParticles count={gateConnected ? 4000 : 400} gateOpen={gateConnected ? gateOpen : 5} />
      <WaterLevel level={waterLevel} gateConnected={gateConnected} />
      <Labels />
      {alertMap.vibration && <AlertMarker position={[0, 0, 3]} label="VIBRATION" />}
      {alertMap.bearing && <AlertMarker position={[2, 8, 0]} label="BEARING TEMP" />}
      {alertMap.stator && <AlertMarker position={[-2, 10, 0]} label="STATOR TEMP" />}
      {alertMap.gate && <AlertMarker position={[3, 1, 0]} label="GATE FAULT" />}
      {alertMap.frequency && <AlertMarker position={[0, 11, 2]} label="FREQUENCY" />}
    </group>
  );
}

// ── MAIN EXPORT ──
export default function TurbineModel3D({ latest, alerts = [], gateConnected = false }) {
  const gateOpen = latest?.wicket_gate_opening_pct ?? 50;
  const waterLevel = Math.min(100, Math.max(5, latest?.water_flow_rate_m3s ?? 35));

  const alertMap = useMemo(() => {
    const m = { vibration: false, bearing: false, stator: false, gate: false, casing: false, draft: false, frequency: false };
    alerts.forEach(a => {
      if (a.level === 'ok') return;
      const t = (a.title || '').toLowerCase();
      if (t.includes('vibration')) m.vibration = true;
      if (t.includes('bearing')) m.bearing = true;
      if (t.includes('stator')) m.stator = true;
      if (t.includes('shaft')) m.draft = true;
      if (t.includes('frequency')) m.frequency = true;
    });
    return m;
  }, [alerts]);

  const legendItems = [
    { label: 'Runner', color: '#22c55e' }, { label: 'Wicket Gates', color: '#f59e0b' },
    { label: 'Scroll Casing', color: '#06b6d4' }, { label: 'Draft Tube', color: '#a855f7' },
    { label: 'Generator', color: '#3b82f6' }, { label: 'Bearings', color: '#eab308' },
    { label: 'Water Flow', color: '#00bfff' }, { label: 'Alert', color: '#ef4444' },
  ];

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: 600, background: 'linear-gradient(180deg, #071520 0%, #0a1e2e 50%, #061018 100%)', borderRadius: 12, border: '1px solid #1c2a38', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>
        <span style={{ color: '#e8f4f8', fontSize: 20, fontWeight: 'bold', display: 'block' }}>Francis Turbine — Live 3D Model</span>
        <span style={{ color: '#6a9bb5', fontSize: 13 }}>Drag to rotate 360° • Scroll to zoom • Live alerts shown in red</span>
      </div>

      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: 8, padding: '6px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#10b981', fontSize: 13, fontWeight: 'bold' }}>Gate: {gateConnected ? `${gateOpen?.toFixed(0)}%` : 'OFF'} | Water: {gateConnected ? `${waterLevel.toFixed(0)}%` : 'LOW'}</span>
        </div>
        {!gateConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', borderRadius: 8, padding: '6px 14px' }}>
            <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 'bold' }}>⚠ GATE DISCONNECTED</span>
          </div>
        )}
        {Object.values(alertMap).some(v => v) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 8, padding: '6px 14px', animation: 'pulse 1s infinite' }}>
            <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 'bold' }}>🚨 ALERTS ACTIVE</span>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 20, left: 24, zIndex: 10, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {legendItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', boxShadow: `0 0 6px ${item.color}60` }} />
            <span style={{ color: '#a3c4d4', fontSize: 12 }}>{item.label}</span>
          </div>
        ))}
      </div>

      <Canvas camera={{ position: [20, 12, 26], fov: 45, near: 0.1, far: 200 }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#071520']} />
        <fog attach="fog" args={['#071520', 25, 65]} />
        <ambientLight intensity={0.35} color="#87ceeb" />
        <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffff" castShadow />
        <directionalLight position={[-8, 10, -5]} intensity={0.5} color="#06b6d4" />
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#00d4ff" distance={25} />
        <pointLight position={[0, -5, 0]} intensity={0.4} color="#004466" distance={22} />
        <TurbineScene latest={latest} alertMap={alertMap} gateOpen={gateOpen} waterLevel={waterLevel} gateConnected={gateConnected} />
        <gridHelper args={[60, 60, '#1a3040', '#0d1e28']} position={[-5, -12, 0]} />
        <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.3} minDistance={10} maxDistance={80} target={[-2, 2, 0]} />
      </Canvas>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
