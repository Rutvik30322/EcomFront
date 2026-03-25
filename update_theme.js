import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'src', 'pages');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.module.css') && !dirFile.includes('Dashboard.module.css') && !dirFile.includes('Login.module.css')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const cssFiles = walkSync(pagesDir);

let updatedFiles = 0;

cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Table Headers (.th)
  content = content.replace(/\.th\s*{[^}]*background:[^;]*;[^}]*color:[^;]*;[^}]*}/g, (match) => {
    return match
      .replace(/background:\s*linear-gradient\([^)]+\)/g, 'background: #F8FAFF')
      .replace(/background:\s*#[0-9a-fA-F]+/g, 'background: #F8FAFF')
      .replace(/background-color:\s*#[0-9a-fA-F]+/g, 'background-color: #F8FAFF')
      .replace(/color:\s*#[0-9a-fA-F]+/g, 'color: #1E293B');
  });

  // Specifically for Products.module.css style th
  content = content.replace(/(?:\.th\s*{[^}]*)background:\s*linear-gradient\([^)]+\)([^}]*})/g, '$1background: #F8FAFF$2');

  // 2. Table Rows Hover
  content = content.replace(/\.table\s+tbody\s+tr:hover\s*{[^}]*background-color:\s*#[0-9a-fA-F]+;[^}]*}/g, (match) => {
    return match.replace(/background-color:\s*#[0-9a-fA-F]+/, 'background-color: rgba(59, 130, 246, 0.03)');
  });

  // 3. Pagination Button Hover
  content = content.replace(/\.paginationBtn:hover:not\(:disabled\)\s*{[^}]*}/g, (match) => {
    return `.paginationBtn:hover:not(:disabled) {\n  background-color: rgba(59, 130, 246, 0.1);\n  border-color: #3b82f6;\n  transform: translateY(-1px);\n}`;
  });

  // 4. Primary Buttons (e.g. #381230 -> #3b82f6, #10b981 -> #3b82f6)
  content = content.replace(/background(?:-color)?:\s*#381230/g, 'background-color: #3b82f6');
  content = content.replace(/background(?:-color)?:\s*#10b981/g, 'background-color: #3b82f6');
  content = content.replace(/background(?:-color)?:\s*#7C4168/g, 'background-color: #2563eb');
  content = content.replace(/background(?:-color)?:\s*#059669/g, 'background-color: #2563eb');
  content = content.replace(/border-color:\s*#381230/g, 'border-color: #3b82f6');
  content = content.replace(/rgba\(56,\s*18,\s*48,/g, 'rgba(59, 130, 246,');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated CSS colors in: ${path.basename(file)}`);
    updatedFiles++;
  }
});

console.log(`Complete. Modified ${updatedFiles} files.`);
