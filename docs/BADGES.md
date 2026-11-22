# Badge 与图标规范

纸墨色系定义在 [`frontend/app/globals.css`](../frontend/app/globals.css)。徽章可使用 [Shields.io](https://shields.io/)。

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

## 维护

- 添加带版本号的徽章时，根据实际依赖更新版本。
- 更换仓库地址后，同步更新双语 README 的 GitHub 链接和徽章。
