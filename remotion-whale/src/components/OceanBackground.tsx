import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

// 程序化海底背景：径向/线性渐变 + 倾斜光束 + 上升气泡（确定性伪随机，可复现）
// 对应原片：深蓝渐变、海面光束、气泡粒子、底部海床暗弧
const bubbles = Array.from({ length: 42 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  return {
    x: (rnd * 1280 + i * 37) % 1280,
    size: 4 + (i % 5) * 3,
    speed: 0.25 + (i % 7) * 0.09,
    phase: (i * 1.7) % (Math.PI * 2),
  };
});

export const OceanBackground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% -10%, #2f7fd0 0%, #14539e 42%, #082f63 78%, #041c3d 100%)', overflow: 'hidden' }}>
      {/* 海面光束 */}
      {[180, 420, 660, 900].map((x, i) => (
        <div key={i} style={{
          position: 'absolute', top: -120, left: x, width: 130, height: 900,
          background: 'linear-gradient(to bottom, rgba(160,220,255,0.20), rgba(160,220,255,0))',
          transform: `rotate(14deg) translateX(${Math.sin(frame / 90 + i) * 6}px)`, transformOrigin: 'top center',
          filter: 'blur(6px)',
        }} />
      ))}
      {/* 气泡 */}
      {bubbles.map((b, i) => {
        const y = 760 - ((frame * b.speed + b.phase * 60) % 820);
        const x = b.x + Math.sin(frame / 40 + b.phase) * 10;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, width: b.size, height: b.size, borderRadius: '50%',
            border: '1.5px solid rgba(200,235,255,0.55)', background: 'rgba(200,235,255,0.10)',
          }} />
        );
      })}
      {/* 海床 */}
      <div style={{ position: 'absolute', bottom: -140, left: '-10%', width: '120%', height: 240, borderRadius: '50%', background: '#03122b', opacity: 0.85 }} />
    </AbsoluteFill>
  );
};

export const Header: React.FC = () => (
  <div style={{ position: 'absolute', top: 22, left: 26, right: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ background: '#fff', color: '#0b3d75', fontWeight: 900, fontSize: 24, padding: '5px 14px', borderRadius: 10 }}>Day 0</span>
      <span style={{ color: '#ff5b5b', fontSize: 14 }}>●</span>
      <span style={{ color: '#dbeeff', fontSize: 19, fontWeight: 700 }}>AI 接管中 · 鲸鱼娘运营日志</span>
    </div>
    <span style={{ color: 'rgba(219,238,255,0.75)', fontSize: 16 }}>本视频含 AI 生成内容</span>
  </div>
);
