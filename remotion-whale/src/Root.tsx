import React from 'react';
import { Composition } from 'remotion';
import { WhaleDay0 } from './WhaleDay0';
import { DURATION_SEC, FPS } from './data/script';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="WhaleDay0" component={WhaleDay0} durationInFrames={Math.round(DURATION_SEC * FPS)} fps={FPS} width={1280} height={720} defaultProps={{ usePng: false }} />
    {/* 有透明 PNG 素材后用这个：把 6 张图放 public/char/whale-<pose>.png */}
    <Composition id="WhaleDay0-Png" component={WhaleDay0} durationInFrames={Math.round(DURATION_SEC * FPS)} fps={FPS} width={1280} height={720} defaultProps={{ usePng: true }} />
  </>
);
