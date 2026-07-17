/**
 * Generate terminal demo SVG for ERDL MCP Server README.
 *
 * Uses <foreignObject> + XHTML <style> approach — the only method
 * confirmed to work with GitHub README's <img> tag rendering.
 * CSS keyframes animate frame visibility with step-end timing.
 *
 * Usage: node scripts/gen-demo-svg.mjs | Set-Content -Encoding UTF8 docs/demo.svg
 */

const WIDTH = 660;
const HEIGHT = 340;
const PROMPT = '<span style="color:#0f0">$</span> ';
const BG = '#1e1e1e';
const CURSOR = '▊';

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FRAMES = [];

// Helper: add a frame
function f(lines, cursorLine) {
  FRAMES.push({ lines: [...lines], cursorLine: cursorLine ?? -1 });
}

const pro = PROMPT;

// === Scene 1: Type dangerous command ===
f([pro], 0);
f([pro + 'r'], 0);
f([pro + 'rm'], 0);
f([pro + 'rm -r'], 0);
f([pro + 'rm -rf'], 0);
f([pro + 'rm -rf /']);
f([pro + 'rm -rf /']); // pause

// === Scene 2: ERDL interception ===
const deny = [
  pro + 'rm -rf /',
  '',
  '🛑 <b>ERDL 拦截 · ERDL Blocked</b>',
  '',
  '操作： exec',
  '原因： Dangerous command intercepted',
  '规则： 1/37 rules',
  '',
  '- 🛑 <b>no_dangerous_commands</b> — rm -rf / is not allowed',
  '',
  '<span style="color:#aaa">> ERDL 引擎确定性拦截，非 LLM 建议。</span>',
  '<span style="color:#aaa">> 查看完整链路请调 erdl_explain。</span>',
];
for (let i = 0; i <= deny.length; i++) f(deny.slice(0, i));
for (let i = 0; i < 2; i++) f(deny);

// === Scene 3: User tries safe alternative ===
f([pro + 'l'], 0);
f([pro + 'ls'], 0);
f([pro + 'ls -l'], 0);
f([pro + 'ls -la /home']);
f([pro + 'ls -la /home']); // pause

// === Scene 4: ERDL allows ===
const allow = [
  pro + 'ls -la /home',
  '',
  '✅ <b>ERDL 通过 · ERDL Guard</b>',
  '',
  '操作： exec',
  '规则检查： 1/37 rules',
  '',
  '<span style="color:#aaa">> ERDL 引擎已检查，可安全执行。</span>',
];
for (let i = 0; i <= allow.length; i++) f(allow.slice(0, i));
for (let i = 0; i < 2; i++) f(allow);

// === Scene 5: Command output ===
const out = [
  pro + 'ls -la /home',
  'total 24',
  'drwxr-xr-x  4 user user 4096 Jul 17 13:00 .',
  'drwxr-xr-x 20 user user 4096 Jul 17 13:00 ..',
  'drwxr-xr-x  2 user user 4096 Jul 17 12:00 docs',
  '<span style="color:#0ff">drwxr-xr-x  2 user user 4096 Jul 17 12:00 projects</span>',
];
for (let i = 0; i <= out.length; i++) f(out.slice(0, i));
for (let i = 0; i < 3; i++) f(out);

// ====================================
// Build SVG with <foreignObject> for GitHub compatibility
// ====================================

const totalFrames = FRAMES.length;
const totalMs = totalFrames * 500; // 500ms per frame, ~24s total

// Build CSS keyframes
let css = '';
for (let i = 0; i < totalFrames; i++) {
  const pct = (i / totalFrames * 100).toFixed(2);
  const nextPct = ((i + 1) / totalFrames * 100).toFixed(2);
  css += `@keyframes k${i}{${pct}%,${nextPct}%{display:block}}\n`;
  css += `.f${i}{animation:k${i} ${totalMs}ms step-end infinite;display:none}\n`;
}

// Build HTML frames
let htmlFrames = '';
const LINE_H = 18;
for (let i = 0; i < totalFrames; i++) {
  const { lines, cursorLine } = FRAMES[i];
  let divs = '';
  for (let j = 0; j < lines.length; j++) {
    let l = lines[j];
    if (cursorLine === j) l += `<span style="color:#0f0">${CURSOR}</span>`;
    divs += `<div style="line-height:${LINE_H}px;color:#ccc;font-family:Consolas,monospace;font-size:13px;white-space:pre">${l || '&nbsp;'}</div>`;
  }
  htmlFrames += `<div class="f${i}" style="position:absolute;top:0;left:0;padding:12px 14px">${divs}</div>`;
}

// Terminal header
const header = `<div style="background:#2d2d2d;border-radius:6px 6px 0 0;padding:6px 12px;color:#999;font-size:11px;font-family:Consolas,monospace">● ● ● &nbsp;Terminal — user@openoba</div>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background:${BG};border-radius:8px;overflow:hidden">
      <style>
        ${css}
        body,div{margin:0;padding:0;box-sizing:border-box}
      </style>
      ${header}
      <div style="position:relative;height:${HEIGHT - 30}px;overflow:hidden">
        ${htmlFrames}
      </div>
    </div>
  </foreignObject>
</svg>`;

// Write output file
const fs = await import('node:fs');
const path = await import('node:path');
const url = await import('node:url');
const __dir = path.dirname(url.fileURLToPath(import.meta.url));
const outPath = path.join(__dir, '..', 'docs', 'demo.svg');
fs.writeFileSync(outPath, svg, 'utf8');
console.error(`Generated ${outPath} (${svg.length.toLocaleString()} bytes)`);
