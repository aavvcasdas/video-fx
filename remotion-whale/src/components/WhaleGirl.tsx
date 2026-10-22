import React from 'react';
import { Img, staticFile, useCurrentFrame, interpolate } from 'remotion';
import type { Pose } from '../data/script';

// 角色层：优先加载 public/char/whale-<pose>.png（原片同款 AI 生图透明 PNG）
// 无素材时回退到内置 SVG 占位（仅示意构图/浮动动画，正式复刻请替换 PNG）
const POSE_EMOJI: Record<Pose, string> = { wave: '👋', proud: '😤', worried: '😳', laptop: '💻', wink: '😉', heart: '💙' };

export const WhaleGirl: React.FC<{ pose: Pose; usePng?: boolean }> = ({ pose, usePng = false }) => {
  const frame = useCurrentFrame();
  const floatY = Math.sin(frame / 22) * 7;               // 原片角色呼吸浮动
  const pop = interpolate(frame, [0, 10], [0.92, 1], { extrapolateRight: 'clamp' }); // 入场弹跳
  return (
    <div style={{ position: 'absolute', right: 40, bottom: 24, width: 430, height: 560, transform: `translateY(${floatY}px) scale(${pop})`, transformOrigin: 'bottom center' }}>
      {usePng ? (
        <Img src={staticFile(`char/whale-${pose}.png`)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(120,200,255,0.45))' }} />
      ) : (
        <svg viewBox="0 0 430 560" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 18px rgba(120,200,255,0.45))' }}>
          <ellipse cx="300" cy="500" rx="120" ry="42" fill="#1b4f8a" />
          <path d="M330 380 Q430 420 400 300 Q440 460 340 510 Z" fill="#2a6db3" />
          <circle cx="215" cy="215" r="118" fill="#ffe9ec" />
          <path d="M97 215 Q80 90 215 82 Q350 90 333 215 Q355 380 300 430 Q330 280 300 210 Q260 300 215 300 Q170 300 130 210 Q100 280 130 430 Q75 380 97 215Z" fill="#2f6fc2" />
          <path d="M130 120 Q215 60 300 120 L300 92 Q215 40 130 92Z" fill="#ffffff" />
          <circle cx="172" cy="225" r="13" fill="#123a6b" /><circle cx="258" cy="225" r="13" fill="#123a6b" />
          <ellipse cx="150" cy="258" rx="20" ry="10" fill="#ffb3c1" opacity="0.8" /><ellipse cx="280" cy="258" rx="20" ry="10" fill="#ffb3c1" opacity="0.8" />
          <path d="M200 262 Q215 274 230 262" stroke="#123a6b" strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="140" y="330" width="150" height="118" rx="22" fill="#16283f" />
          <path d="M165 330 h100 l14 78 a20 20 0 0 1 -20 24 h-88 a20 20 0 0 1 -20 -24Z" fill="#ffffff" />
          <text x="215" y="405" textAnchor="middle" fontSize="30">🐋</text>
          <text x="215" y="505" textAnchor="middle" fontSize="34">{POSE_EMOJI[pose]}</text>
        </svg>
      )}
    </div>
  );
};
