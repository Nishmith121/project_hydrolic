import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── WATER PARTICLES ──
function WaterParticles({ count = 2000, gateOpen = 50 }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const a = [];
    for (let i = 0; i < count; i++)
      a.push({ phase: Math.random()*Math.PI*2, radius: 2.8+Math.random()*1.8, speed: 0.4+Math.random()*0.6, y: 4+Math.random()*8, yStart: 4+Math.random()*8 });
    return a;
  }, [count]);

  const intensity = Math.max(0.1, gateOpen / 100);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.phase += dt * p.speed * 2 * intensity;
      p.y -= dt * p.speed * 5 * intensity;
      if (p.y < -8) { p.y = p.yStart; p.phase = Math.random()*Math.PI*2; }
      let r = p.radius;
      if (p.y < 3 && p.y > -1) r = p.radius*(0.3+0.7*((p.y+1)/4));
      else if (p.y <= -1) r = 0.4+Math.random()*0.5;
      dummy.position.set(Math.cos(p.phase)*r, p.y, Math.sin(p.phase)*r);
      dummy.scale.setScalar(0.04+Math.random()*0.02);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#00bfff" transparent opacity={0.55} emissive="#006994" emissiveIntensity={0.6} />
    </instancedMesh>
  );
}

// ── TURBINE RUNNER (Green) ──
function TurbineRunner({ hasAlert, gateOpen = 50 }) {
  const ref = useRef();
  const speed = Math.max(0.3, (gateOpen / 100) * 3);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * speed; });
  const col = hasAlert ? '#ff2222' : '#22c55e';
  return (
    <group ref={ref} position={[0, 0.5, 0]}>
      <mesh><coneGeometry args={[0.6, 2.2, 24]} /><meshStandardMaterial color={col} metalness={0.85} roughness={0.2} emissive={hasAlert ? '#ff0000' : '#000'} emissiveIntensity={hasAlert ? 0.4 : 0} /></mesh>
      <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.55, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={col} metalness={0.9} roughness={0.15} /></mesh>
      {Array.from({ length: 13 }).map((_, i) => (
        <group key={i} rotation={[0, (i/13)*Math.PI*2, 0]}>
          <mesh position={[1.2, 0.2, 0]} rotation={[0.3, 0, -0.6]}>
            <boxGeometry args={[1.8, 0.06, 0.7]} /><meshStandardMaterial color={col} metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.3, 0]}><torusGeometry args={[2.0, 0.12, 8, 48]} /><meshStandardMaterial color={hasAlert ? '#ff4444' : '#16a34a'} metalness={0.85} roughness={0.2} /></mesh>
    </group>
  );
}

// ── WICKET GATES (Amber/Orange) ──
function WicketGates({ gateOpen = 50, hasAlert }) {
  const openAngle = 0.1 + (gateOpen / 100) * 0.8;
  const col = hasAlert ? '#ff2222' : '#f59e0b';
  return (
    <group position={[0, 1, 0]}>
      {Array.from({ length: 20 }).map((_, i) => {
        const a = (i/20)*Math.PI*2;
        return (
          <mesh key={i} position={[Math.cos(a)*2.7, 0, Math.sin(a)*2.7]} rotation={[0, a + openAngle, 0]}>
            <boxGeometry args={[0.08, 1.8, 0.65]} /><meshStandardMaterial color={col} metalness={0.8} roughness={0.25} emissive={hasAlert ? '#ff0000' : '#000'} emissiveIntensity={hasAlert ? 0.3 : 0} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.85, 0]}><torusGeometry args={[2.7, 0.08, 8, 48]} /><meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.2} /></mesh>
      <mesh position={[0, -0.85, 0]}><torusGeometry args={[2.7, 0.08, 8, 48]} /><meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.2} /></mesh>
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
    { text: 'SCROLL CASING', pos: [6, 2.5, 3], color: '#22d3ee' },
    { text: 'WICKET GATES', pos: [3.5, 2.5, -2], color: '#f59e0b' },
    { text: 'RUNNER', pos: [-3, -0.5, 2], color: '#22c55e' },
    { text: 'DRAFT TUBE', pos: [2.5, -5, 2], color: '#a855f7' },
    { text: 'SHAFT', pos: [-2, 5, 0], color: '#c0c0c0' },
    { text: 'GENERATOR', pos: [4, 11, 0], color: '#60a5fa' },
    { text: 'BEARINGS', pos: [2, 8.5, 2], color: '#eab308' },
    { text: 'INLET', pos: [9, 2, 0], color: '#f472b6' },
  ];
  return (
    <group>{labels.map((l, i) => (
      <Float key={i} speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
        <Text position={l.pos} fontSize={0.3} color={l.color} anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.02} outlineColor="#000">{l.text}</Text>
      </Float>
    ))}</group>
  );
}

// ── SCENE ──
function TurbineScene({ latest, alertMap, gateOpen, waterLevel, gateConnected }) {
  return (
    <group position={[0, -2, 0]}>
      <ScrollCasing hasAlert={alertMap.casing} />
      <WicketGates gateOpen={gateConnected ? gateOpen : 5} hasAlert={alertMap.gate} />
      <TurbineRunner hasAlert={alertMap.vibration} gateOpen={gateConnected ? gateOpen : 5} />
      <DraftTube hasAlert={alertMap.draft} />
      <Shaft gateOpen={gateConnected ? gateOpen : 5} />
      <GeneratorHousing hasAlert={alertMap.stator || alertMap.frequency} />
      <Bearings hasAlert={alertMap.bearing} />
      <SupportStructure />
      <WaterParticles count={gateConnected ? 2000 : 200} gateOpen={gateConnected ? gateOpen : 5} />
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
  const waterLevel = Math.min(100, Math.max(5, (latest?.cooling_water_flow_ls ?? 35) * 2));

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

      <Canvas camera={{ position: [14, 8, 14], fov: 50, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#071520']} />
        <fog attach="fog" args={['#071520', 25, 55]} />
        <ambientLight intensity={0.35} color="#87ceeb" />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color="#ffffff" castShadow />
        <directionalLight position={[-8, 10, -5]} intensity={0.5} color="#06b6d4" />
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#00d4ff" distance={15} />
        <pointLight position={[0, -5, 0]} intensity={0.4} color="#004466" distance={12} />
        <TurbineScene latest={latest} alertMap={alertMap} gateOpen={gateOpen} waterLevel={waterLevel} gateConnected={gateConnected} />
        <gridHelper args={[30, 30, '#1a3040', '#0d1e28']} position={[0, -10, 0]} />
        <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.5} minDistance={6} maxDistance={40} />
      </Canvas>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
