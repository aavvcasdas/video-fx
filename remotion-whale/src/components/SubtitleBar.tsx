import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { SubLine } from '../data/script';

// 卡拉OK字幕条：已读字符变暗蓝灰、当前句高亮白 —— 对应原片底部半透明条
// 正式版应改为 TTS 词级时间戳驱动；此处按匀速逐字推进近似
export const SubtitleBar: React.FC<{ subs: SubLine[] }> = ({ subs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const current = [...subs].reverse().find((s) => t >= s.at);
  if (!current) return null;
  const elapsed = t - current.at;
  const charsDone = Math.min(current.text.length, Math.floor(elapsed * 7)); // ~7 字/秒
  return (
    <div style={{
      position: 'absolute', bottom: 34, left: 90, maxWidth: 760, padding: '14px 22px',
      background: 'rgba(3,20,45,0.55)', border: '1.5px solid rgba(160,210,255,0.35)', borderRadius: 14,
      fontFamily: 'sans-serif', fontSize: 31, fontWeight: 800, lineHeight: 1.35,
    }}>
      {current.text.split('').map((ch, i) => (
        <span key={i} style={{ color: i < charsDone ? '#8fb6d9' : '#ffffff' }}>{ch}</span>
      ))}
    </div>
  );
};
