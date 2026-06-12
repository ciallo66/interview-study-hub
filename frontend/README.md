# 面试知识库

面试题管理平台，支持 CRUD、全文搜索、标签分类、收藏/错题本、随机刷题，帮助开发者系统化整理面试笔记。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 (Composition API) + Vue Router 4 + Pinia |
| **后端** | Node.js + Express 5 |
| **数据库** | MySQL 8（mysql2 连接池、FULLTEXT + ngram 全文索引） |
| **认证** | JWT + bcrypt |
| **校验** | Zod |
| **工具链** | Vite + TypeScript、marked + DOMPurify、axios、ESLint + Prettier + OxLint |
| **部署** | Railway |

## 功能

- **题目管理**：增删改查，支持标题、内容（Markdown）、难度（简单/中等/困难）、来源
- **Markdown 编辑器**：编辑 + 实时预览，DOMPurify 防 XSS
- **全文搜索**：基于 MySQL FULLTEXT + ngram 分词，搜索标题和内容
- **标签体系**：多对多关联，创建标签、按标签筛选、显示各标签题目数
- **难度筛选**：简单 / 中等 / 困难
- **收藏/错题本**：标记错题，独立收藏列表
- **随机一题**：从题库随机跳转一题
- **用户认证**：注册 / 登录，JWT 鉴权，路由守卫
- **分页**：列表分页，URL 参数同步
- **响应式布局**：移动端适配

## 快速开始

### 环境要求
- Node.js >= 20
- MySQL 8

### 1. 克隆项目
## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
