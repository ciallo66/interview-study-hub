/**
 * Markdown → HTML（使用 marked + DOMPurify）
 * 支持 GFM 标准语法 + XSS 防护
 */
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * 将 Markdown 文本转为安全的 HTML
 * @param {string} md - Markdown 原始文本
 * @returns {string} 安全的 HTML 字符串
 */
export function markdownToHtml(md) {
  if (!md) return '';

  // 1. marked 解析 Markdown → HTML
  const rawHtml = marked.parse(md);

  // 2. DOMPurify 过滤 XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  return cleanHtml;
}
