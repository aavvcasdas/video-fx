# video-fx

当前仓库主要是 MP4 样片，没有随片提供原始剪辑工程、分镜、提示词或渲染源码。

- 16 个 MP4，总时长约 65 分 12 秒；其中 15 个为带“抖音”命名的视频，另有一个独立的 82.6 秒视频。
- 样片以中文歌词动画 / 音乐可视化为主，包含像素游戏、水彩手绘、线稿和复古胶片等视觉风格。
- 逐文件元数据、可证实与不可证实的结论，以及用 Claude 复现此类制作的建议，见 [`VIDEO_ANALYSIS.md`](VIDEO_ANALYSIS.md)。
- 新增原创 15 秒静音像素 RPG 样片：[`renders/moonlight-post-office-pixel-rpg.mp4`](renders/moonlight-post-office-pixel-rpg.mp4)；渲染源码：[`scripts/render_pixel_rpg.py`](scripts/render_pixel_rpg.py)。借鉴 `_2.mp4` 的像素叙事语法，不复制原画面或歌词。在虚拟环境中安装 `requirements-video.txt` 后运行 `python scripts/render_pixel_rpg.py` 可重新渲染。
