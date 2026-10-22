# video-fx

当前仓库包含 MP4 样片、分析报告，以及一个基于本地视频素材制作的鲸鱼娘卡点复刻。

- 原始素材：16 个 MP4，总时长约 65 分 12 秒；其中 15 个为带“抖音”命名的视频，另有一个独立的 82.6 秒视频。
- 样片以中文歌词动画 / 音乐可视化为主，包含像素游戏、水彩手绘、线稿和复古胶片等视觉风格。
- 逐文件元数据、可证实与不可证实的结论，以及用 Claude 复现此类制作的建议，见 [`VIDEO_ANALYSIS.md`](VIDEO_ANALYSIS.md)。
- 当前复刻：[`renders/whale-girl-beatcut.mp4`](renders/whale-girl-beatcut.mp4)（15 秒、1280×720、30 fps、H.264 + AAC）。画面直接取自 `42868804351-1-192.mp4` 的鲸鱼娘镜头，配乐取自 `每天每天的抖音 - 抖音_6.mp4`；短脉冲约 0.38 秒（双倍拍约 158 BPM / 半拍约 79 BPM），每四个短脉冲切镜，并在各段切换调色风格。没有新编故事或生成角色。分镜与复刻说明：[`renders/whale-girl-beatcut-storyboard.md`](renders/whale-girl-beatcut-storyboard.md)。
- 重渲染：安装 `requirements-video.txt` 后运行 `python scripts/render_whale_girl_beatcut.py`。
