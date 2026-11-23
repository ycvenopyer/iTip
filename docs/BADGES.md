# 品牌素材与图标

站点的纸墨基础色定义在 [`frontend/app/globals.css`](../frontend/app/globals.css)。对话工作台的明暗模式与可选主题色位于 [`frontend/app/workspace.css`](../frontend/app/workspace.css)。下面的色值用于站点基础视觉和仓库徽章。徽章可使用 [Shields.io](https://shields.io/)。

## 品牌色

| 名称 | 色值 | 用途 |
|------|------|------|
| 宣纸 | `#f2eadc` | 背景、浅色 badge |
| 墨 | `#1e1b18` | 深色 label |
| 朱砂 | `#9a2c2c` | 主色 |
| 竹青 | `#4f6a42` | 辅助色 |
| 墨灰 | `#524b41` | 中性 label |

## Shields.io

品牌静态徽章示例

```
https://img.shields.io/static/v1?style=for-the-badge&label=iTip&message=书法助手&color=9a2c2c&labelColor=1e1b18
```

| 参数 | 说明 |
|------|------|
| `style` | `for-the-badge` / `flat-square` |
| `label` / `message` | 左右文案（空格 URL 编码为 `%20`） |
| `color` / `labelColor` | 背景色，不含 `#` |

**Dynamic**：`https://img.shields.io/github/stars/ycvenopyer/iTip?style=social`

**Next.js 徽章**可使用 `https://img.shields.io/badge/Next.js-15-1e1b18?style=flat-square&logo=next.js&logoColor=white`。

Logo 列表见 [Shields.io 文档](https://shields.io/docs/logos)。

## 图标文件

Next.js 从 App Router 目录读取站点图标，PWA 图标由 [manifest](../frontend/public/manifest.json) 引用。

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `frontend/app/favicon.ico` | ICO | 浏览器标签页图标 |
| `frontend/app/icon.jpg` | 512×512 | App Router 站点图标 |
| `frontend/app/apple-icon.jpg` | 180×180 | iOS 主屏幕 |
| `frontend/public/icons/icon-192.jpg` | 192×192 | PWA |
| `frontend/public/icons/icon-512.jpg` | 512×512 | PWA |

更换时同路径覆盖；若改 PWA 规格，同步 `manifest.json`。

## 书法图像与署名

风格图像放在 [`frontend/public/style-art/`](../frontend/public/style-art)，用于登录页、对话空状态和设置缩略图。

| 风格 | 图像 | 署名 |
|---|---|---|
| 展卷 | `mi-fu.jpg` | 北宋米芾《吴江舟中诗》局部，大都会艺术博物馆，1984.174。 [藏品页](https://www.metmuseum.org/art/collection/search/39919) |
| 碑拓 | `yan-stele.jpg` | 颜真卿《颜氏家庙碑》，二十世纪拓片局部，大都会艺术博物馆。 [藏品页](https://www.metmuseum.org/art/collection/search/64029) |
| 日课 | `jade-desk.jpg` | 为 iTip 生成的原创青瓷习字案静物图 |

- 使用馆藏书迹或文房器物时，记录作品名称、作者或年代、藏馆、馆藏编号、原始链接和使用许可。将局部截取标为「局部」。
- 使用生成的静物或装饰图时，标明为原创生成素材。正式界面应为承载信息的图片提供中文替代文本。
- 设计预览的图片参考和来源见 [iTip 初稿品牌记录](../design-demos/brand-spec.md)。

## 维护

- 添加带版本号的徽章时，根据实际依赖更新版本。
- 更换仓库地址后，同步更新双语 README 的 GitHub 链接和徽章。
- 更新品牌标识时，一并核对导航、浏览器标签页和 PWA 安装图标。用于显示的图像若不在图标文件中，应保留独立的来源记录。
