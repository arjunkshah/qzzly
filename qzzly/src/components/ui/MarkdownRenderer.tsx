import React from 'react';

// A simple markdown parser
const parseMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text
    // escape html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  // Unordered lists
  html = html.replace(/^\s*\n\* (.*)/gim, '<ul>\n<li>$1</li>');
  html = html.replace(/^\* (.*)/gim, '<ul>\n<li>$1</li>');
  html = html.replace(/<\/ul>\n<ul>/gim, '');
  // List items
  html = html.replace(/\n\* (.*)/gim, '<li>$1</li>');
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');

  // Handle code blocks
   html = html.replace(/```(.*?)\n(.*?)```/gs, (match, lang, code) => {
    const safeCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang}">${safeCode}</code></pre>`;
  });
  
  // Cleanup
  html = `<p>${html}</p>`;
  html = html.replace(/<\/li><li>/g, '</li>\n<li>');
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><ul>/g, '<ul>');
  html = html.replace(/<\/ul><\/p>/g, '</ul>');
  
  return html;
};

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processedHtml = parseMarkdown(content);

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default MarkdownRenderer; 