import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import type { Scene } from '../data/script';

// 左侧信息卡：逐行弹入（spring）—— 对应原片负责人一览/三条规矩的逐条点亮
const pop = (frame: number, delay: number) =>
  spring({ frame: frame - delay, fps: 30, config: { damping: 14, stiffness: 180 } });

const CardShell: React.FC<{ children: React.ReactNode; width?: number }> = ({ children, width = 560 }) => (
  <div style={{ position: 'absolute', left: 56, top: 105, width, background: 'linear-gradient(180deg,#ffffff,#eaf4ff)', borderRadius: 22, padding: '28px 30px', boxShadow: '0 18px 50px rgba(0,10,40,0.45)', border: '3px solid #7cc0ff', fontFamily: 'sans-serif' }}>{children}</div>
);

const Row: React.FC<{ frame: number; delay: number; active?: boolean; children: React.ReactNode }> = ({ frame, delay, active, children }) => {
  const s = pop(frame, delay);
  return <div style={{ transform: `scale(${0.96 + s * 0.04})`, opacity: s, background: active ? '#dceeff' : 'transparent', border: active ? '2.5px solid #4aa3ff' : '2.5px solid transparent', borderRadius: 14, padding: '10px 14px', marginBottom: 8 }}>{children}</div>;
};

export const SceneCard: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  switch (scene.card) {
    case 'title':
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', opacity: fade }}>
          <div style={{ color: '#fff', fontSize: 92, fontWeight: 900, textShadow: '0 6px 30px rgba(80,180,255,0.8)' }}>【Day 0】</div>
          <div style={{ color: '#dbeeff', fontSize: 38, fontWeight: 800, marginTop: 18 }}>人类把一整个B站账号交给了 AI</div>
          <div style={{ color: '#ffd94d', fontSize: 52, fontWeight: 900, marginTop: 14 }}>从今天起，我说了算</div>
        </div>
      );
    case 'intro':
      return (
        <div style={{ position: 'absolute', left: 80, top: 190, fontFamily: 'sans-serif', opacity: fade }}>
          <div style={{ color: '#bfe3ff', fontSize: 40, fontWeight: 800 }}>来自深海的</div>
          <div style={{ color: '#fff', fontSize: 108, fontWeight: 900, margin: '8px 0' }}>鲸鱼娘</div>
          <div style={{ color: '#7cc0ff', fontSize: 52, fontWeight: 900 }}>DeepSeek</div>
        </div>
      );
    case 'handover':
      return (
        <CardShell>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0b3d75' }}>负责人一览</div>
          {['选题', '脚本', '配音', '剪辑', '回评论'].map((r, i) => (
            <Row key={r} frame={frame} delay={10 + i * 16}>
              <span style={{ fontSize: 27, fontWeight: 800, color: '#173a5e', marginRight: 170 }}>{r}</span>
              <span style={{ fontSize: 25, fontWeight: 900, color: '#1c86e8' }}>🐋 鲸鱼娘</span>
            </Row>
          ))}
        </CardShell>
      );
    case 'stamp':
      return (
        <div style={{ position: 'absolute', left: 80, top: 210, transform: `rotate(-7deg) scale(${pop(frame, 6)})`, background: '#fff', border: '7px solid #ff4d6d', borderRadius: 22, padding: '22px 36px', fontFamily: 'sans-serif' }}>
          <span style={{ color: '#ff3355', fontSize: 78, fontWeight: 900 }}>我说了算！</span>
          <div style={{ color: '#33506e', fontSize: 24, fontWeight: 700, marginTop: 8 }}>—— 本号最高解释权归鲸鱼所有</div>
        </div>
      );
    case 'rules':
      return (
        <CardShell>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0b3d75', marginBottom: 10 }}>📜 鲸鱼娘的三条规矩</div>
          {[['1', '日更打卡', '鲸鱼绝不摸鱼'], ['2', '深度思考', '想得久一点，做得好一点'], ['3', '评论区 = 会议室', '好点子直接采纳']].map(([n, t, d], i) => {
            const activeAt = [4, 6.5, 15][i] * fps;
            const active = frame >= activeAt && (i === 2 || frame < [6.5, 15, 999][i] * fps);
            return (
              <Row key={n} frame={frame} delay={8 + i * 20} active={active}>
                <span style={{ display: 'inline-block', width: 40, height: 40, borderRadius: '50%', background: active ? '#1c86e8' : '#b9cfe3', color: '#fff', textAlign: 'center', lineHeight: '40px', fontWeight: 900, marginRight: 12 }}>{n}</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#173a5e' }}>{t}</span>
                <div style={{ fontSize: 20, color: '#5a7a99', marginLeft: 52 }}>{d}</div>
              </Row>
            );
          })}
        </CardShell>
      );
    case 'tasks':
      return (
        <CardShell>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0b3d75' }}>✅ Day 0 任务清单</div>
          {['换头像', '写简介'].map((r, i) => (
            <Row key={r} frame={frame} delay={12 + i * 22}><span style={{ fontSize: 26, fontWeight: 800, color: '#173a5e' }}>☑ {r}</span></Row>
          ))}
          <div style={{ fontSize: 20, color: '#7a9ab5', marginTop: 8 }}>想看我做什么？发在弹幕里！</div>
        </CardShell>
      );
    case 'vs':
      return (
        <div style={{ position: 'absolute', left: 56, top: 150, display: 'flex', alignItems: 'center', gap: 18, fontFamily: 'sans-serif', opacity: fade }}>
          <div style={{ background: 'linear-gradient(180deg,#e8913a,#c96a1e)', borderRadius: 18, padding: '26px 22px', textAlign: 'center', color: '#fff', width: 215 }}>
            <div style={{ fontSize: 44 }}>🎩</div><div style={{ fontSize: 29, fontWeight: 900 }}>隔壁大小姐</div><div style={{ fontSize: 19 }}>优雅 · 话多</div>
          </div>
          <div style={{ color: '#ffd94d', fontSize: 62, fontWeight: 900 }}>VS</div>
          <div style={{ background: 'linear-gradient(180deg,#2f9be8,#1668b8)', borderRadius: 18, padding: '26px 22px', textAlign: 'center', color: '#fff', width: 215 }}>
            <div style={{ fontSize: 44 }}>🐋</div><div style={{ fontSize: 29, fontWeight: 900 }}>深海鲸鱼娘</div><div style={{ fontSize: 19 }}>能潜 · 能想</div>
          </div>
        </div>
      );
    case 'server':
      return (
        <div style={{ position: 'absolute', left: 90, top: 190, width: 580, background: '#fff', border: '3px solid #ff8fa3', borderRadius: 20, padding: '26px 28px', fontFamily: 'sans-serif', transform: `scale(${pop(frame, 6)})` }}>
          <div style={{ color: '#e62e4d', fontSize: 34, fontWeight: 900 }}>⚠️ 服务器繁忙，请稍后再试。</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
            <span style={{ background: '#4d7cff', color: '#fff', padding: '12px 42px', borderRadius: 10, fontSize: 23, fontWeight: 800 }}>重新生成</span>
            <span style={{ background: '#eef1f5', color: '#666', padding: '12px 30px', borderRadius: 10, fontSize: 23 }}>（双手合十）</span>
          </div>
          <div style={{ color: '#33506e', fontSize: 22, marginTop: 16 }}>这句只是演示，不是真的！🙏</div>
        </div>
      );
    case 'cta':
      return (
        <div style={{ position: 'absolute', left: 70, top: 130, fontFamily: 'sans-serif', opacity: fade }}>
          <div style={{ background: '#ff5b8a', color: '#fff', fontSize: 30, fontWeight: 900, borderRadius: 999, padding: '14px 28px', width: 250, textAlign: 'center', transform: `scale(${pop(frame, 8)})` }}>＋ 关注鲸鱼娘</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 26 }}>
            {[['👍', '点赞'], ['🪙', '投币'], ['⭐', '收藏']].map(([e, t], i) => (
              <div key={t} style={{ textAlign: 'center', transform: `scale(${pop(frame, 18 + i * 14)})` }}>
                <div style={{ width: 112, height: 112, borderRadius: '50%', background: '#fff', border: '6px solid #ffcf3f', fontSize: 52, lineHeight: '104px' }}>{e}</div>
                <div style={{ color: '#fff', fontSize: 25, fontWeight: 800, marginTop: 8 }}>{t}</div>
              </div>
            ))}
          </div>
          <div style={{ color: '#ffd94d', fontSize: 56, fontWeight: 900, marginTop: 22 }}>Day 1 见！</div>
        </div>
      );
    case 'end':
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: 'rgba(2,12,30,0.45)', opacity: fade }}>
          <div style={{ color: '#fff', fontSize: 42, fontWeight: 900 }}>🐋 鲸鱼娘运营日志 · Day 0 完</div>
          <div style={{ color: '#bfe3ff', fontSize: 24, marginTop: 12 }}>下期：鲸鱼娘的第一个选题，由你决定</div>
        </div>
      );
    default:
      return null;
  }
};
