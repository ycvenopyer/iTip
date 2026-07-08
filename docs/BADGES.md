# Badge 与图标规范

项目视觉标识基于 **纸墨色系**（`globals.css`）与 **朱文「書」+ iTip** 品牌图（JPEG 静态资源），Badge 使用 [Shields.io](https://shields.io/) 生成。

## 品牌色

| 名称 | 色值 | 用途 |
|------|------|------|
| 宣纸 | `#f2eadc` | 背景、浅色 badge |
| 墨 | `#1e1b18` | 深色 label、文字 |
| 朱砂 | `#9a2c2c` | 主色、印章边框 |
| 竹青 | `#4f6a42` | 部署 / 辅助色 |
| 墨灰 | `#524b41` | 中性 label |

## Shields.io Badge

### Static Badge（品牌定制）

[Static Badge 文档](https://shields.io/badges/static-badge)

```
https://img.shields.io/static/v1?style=for-the-badge&label=iTip&message=书法助手&color=9a2c2c&labelColor=1e1b18
```

参数说明：

| 参数 | 示例 | 说明 |
|------|------|------|
| `style` | `for-the-badge` / `flat-square` | 徽章样式 |
| `label` | `iTip` | 左侧标签 |
| `message` | `书法助手` | 右侧内容（URL 编码空格为 `%20`） |
| `color` | `9a2c2c` | 右侧背景色（不含 `#`） |
| `labelColor` | `1e1b18` | 左侧背景色 |

### Dynamic Badge（GitHub）

```
https://img.shields.io/github/stars/ycvenopyer/iTip?style=social
```

### Logo Badge（技术栈）

```
https://img.shields.io/badge/Next.js-15.2+-1e1b18?style=flat-square&logo=next.js&logoColor=white
```

Logo 列表见 [Shields.io Logo 文档](https://shields.io/docs/logos)。

## 图标文件

品牌图为朱文「書」印章 + **iTip** 字标，以 **JPEG / ICO** 静态资源形式存放在 `web/` 目录，由 Next.js 与 PWA manifest 直接引用。

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `web/app/icon.jpg` | 512×512 | Next.js 自动 favicon |
| `web/app/apple-icon.jpg` | 180×180 | iOS 主屏幕 |
| `web/public/favicon.jpg` | 32×32 | 浏览器 favicon 备用 |
| `web/public/favicon.ico` | 16/32 | 旧版浏览器 |
| `web/public/icons/icon-192.jpg` | 192×192 | PWA manifest |
| `web/public/icons/icon-512.jpg` | 512×512 | PWA manifest |
| `web/public/icons/apple-touch-icon.jpg` | 180×180 | Apple Touch 备用 |

更换图标时，用同路径、同文件名的新图片覆盖上述文件即可；若修改 PWA 尺寸或格式，同步更新 `web/public/manifest.json`。

## 维护

- 升级主要依赖版本时，同步更新 `README.md` 中对应 badge 的 `message`
- 更换仓库地址时，更新 GitHub stars / repo badge 中的 `ycvenopyer/iTip`
- 更换品牌图标时，覆盖 `web/` 下对应 JPEG / ICO 文件并更新 `manifest.json`（如有变更）
