import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SCENES, FPS } from './data/script';
import { OceanBackground, Header } from './components/OceanBackground';
import { WhaleGirl } from './components/WhaleGirl';
import { SceneCard } from './components/Cards';
import { SubtitleBar } from './components/SubtitleBar';

// 主合成：深海背景（全程）+ Header（除开场外常驻）+ 逐场景 Sequence 叠加
// 每场景 = SceneCard（左）+ WhaleGirl（右下）+ SubtitleBar（底部卡拉OK字幕）
export const WhaleDay0: React.FC<{ usePng?: boolean }> = ({ usePng = false }) => {
  return (
    <AbsoluteFill>
      <OceanBackground />
      {SCENES.map((scene) => (
        <Sequence key={scene.id} from={Math.round(scene.start * FPS)} durationInFrames={Math.round(scene.duration * FPS)} name={`${scene.id}-${scene.title}`}>
          {scene.card !== 'title' && <Header />}
          <SceneCard scene={scene} />
          {scene.card !== 'title' && <WhaleGirl pose={scene.pose} usePng={usePng} />}
          <SubtitleBar subs={scene.subs} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
