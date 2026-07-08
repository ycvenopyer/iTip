# Badge 与图标规范

品牌色取自 `globals.css`（纸墨色系）；Badge 使用 [Shields.io](https://shields.io/)。

## 品牌色

| 名称 | 色值 | 用途 |
|------|------|------|
| 宣纸 | `#f2eadc` | 背景、浅色 badge |
| 墨 | `#1e1b18` | 深色 label |
| 朱砂 | `#9a2c2c` | 主色 |
| 竹青 | `#4f6a42` | 辅助色 |
| 墨灰 | `#524b41` | 中性 label |

## Shields.io

**Static**（品牌）：

```
https://img.shields.io/static/v1?style=for-the-badge&label=iTip&message=书法助手&color=9a2c2c&labelColor=1e1b18
```

| 参数 | 说明 |
|------|------|
| `style` | `for-the-badge` / `flat-square` |
| `label` / `message` | 左右文案（空格 URL 编码为 `%20`） |
| `color` / `labelColor` | 背景色，不含 `#` |

**Dynamic**：`https://img.shields.io/github/stars/ycvenopyer/iTip?style=social`

**Logo**：`https://img.shields.io/badge/Next.js-15.2+-1e1b18?style=flat-square&logo=next.js&logoColor=white`

Logo 列表见 [Shields.io 文档](https://shields.io/docs/logos)。

## 图标文件

JPEG 静态资源，Next.js 与 PWA manifest 直接引用。勿同时放置 `public/favicon.ico` 与 `app/icon.jpg`（会冲突）。

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `web/app/icon.jpg` | 512×512 | favicon（含 `/favicon.ico`） |
| `web/app/apple-icon.jpg` | 180×180 | iOS |
| `web/public/favicon.jpg` | 32×32 | 备用 |
| `web/public/icons/icon-192.jpg` | 192×192 | PWA |
| `web/public/icons/icon-512.jpg` | 512×512 | PWA |
| `web/public/icons/apple-touch-icon.jpg` | 180×180 | Apple Touch |

更换时同路径覆盖；若改 PWA 规格，同步 `manifest.json`。

## 维护

- 升级依赖：更新 `README.md` badge 版本文案
- 换仓库：更新 GitHub badge 中的 `ycvenopyer/iTip`
