import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".css")) acc.push(p);
  }
  return acc;
}

const skip = new Set([
  path.join(root, "index.css"),
  path.join(root, "components", "ui", "ThemeToggle.css"),
]);

const files = walk(root).filter((f) => !skip.has(f));

const pairs = [
  [/background:\s*#ffffff\b/gi, "background: var(--bg-surface)"],
  [/background-color:\s*#ffffff\b/gi, "background-color: var(--bg-surface)"],
  [/background:\s*white\b/g, "background: var(--bg-surface)"],
  [/background-color:\s*white\b/g, "background-color: var(--bg-surface)"],
  [/background:\s*#fff\b(?![0-9a-fA-F])/g, "background: var(--bg-surface)"],
  [/background-color:\s*#fff\b(?![0-9a-fA-F])/g, "background-color: var(--bg-surface)"],
  [/background:\s*#f8fafc\b/gi, "background: var(--bg-primary)"],
  [/background-color:\s*#f8fafc\b/gi, "background-color: var(--bg-primary)"],
  [/background:\s*#f9fafb\b/gi, "background: var(--bg-surface-alt)"],
  [/background:\s*#f1f5f9\b/gi, "background: var(--bg-surface-hover)"],
  [/background-color:\s*#f1f5f9\b/gi, "background-color: var(--bg-surface-hover)"],
  [/border:\s*1px solid #e2e8f0/g, "border: 1px solid var(--border-primary)"],
  [/border:\s*1px solid #e5e7eb/g, "border: 1px solid var(--border-primary)"],
  [/border-bottom:\s*1px solid #e2e8f0/g, "border-bottom: 1px solid var(--border-primary)"],
  [/border-bottom:\s*1px solid #e5e7eb/g, "border-bottom: 1px solid var(--border-primary)"],
  [/border-top:\s*1px solid #e2e8f0/g, "border-top: 1px solid var(--border-primary)"],
  [/border-top:\s*1px solid #f1f5f9/g, "border-top: 1px solid var(--border-primary)"],
  [/border-bottom:\s*1px solid #f1f5f9/g, "border-bottom: 1px solid var(--border-primary)"],
  [/border-bottom:\s*2px solid #f1f5f9/g, "border-bottom: 2px solid var(--border-primary)"],
  [/border:\s*1px solid #f0f0f0/g, "border: 1px solid var(--border-secondary)"],
  [/border:\s*1px solid #f3f4f6/g, "border: 1px solid var(--border-secondary)"],
  [/border-bottom:\s*1px solid #f3f4f6/g, "border-bottom: 1px solid var(--border-secondary)"],
  [/border:\s*1px solid #d1d5db/g, "border: 1px solid var(--border-primary)"],
  [/border:\s*2px solid #e2e8f0/g, "border: 2px solid var(--border-primary)"],
  [/color:\s*#1e293b\b/g, "color: var(--text-primary)"],
  [/color:\s*#111827\b/g, "color: var(--text-primary)"],
  [/color:\s*#64748b\b/g, "color: var(--text-secondary)"],
  [/color:\s*#6b7280\b/g, "color: var(--text-secondary)"],
  [/color:\s*#94a3b8\b/g, "color: var(--text-tertiary)"],
  [/color:\s*#374151\b/g, "color: var(--text-primary)"],
  [/color:\s*#4b5563\b/g, "color: var(--text-secondary)"],
  [/color:\s*#475569\b/g, "color: var(--text-secondary)"],
];

let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const orig = s;
  for (const [re, rep] of pairs) s = s.replace(re, rep);
  if (s !== orig) {
    fs.writeFileSync(f, s);
    console.log("updated", path.relative(root, f));
    n++;
  }
}
console.log("files changed:", n);
