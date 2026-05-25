import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

function getActualPathFromRoot(targetPath: string): string {
  const root = process.cwd();
  // Get relative path from project root
  const relativePath = path.relative(root, targetPath);
  if (relativePath.startsWith('..')) {
    return targetPath;
  }
  
  const parts = relativePath.split(path.sep);
  let resolvedPath = root;
  
  for (const part of parts) {
    if (!part || part === '.') continue;
    try {
      const items = fs.readdirSync(resolvedPath);
      const lowerPart = part.toLowerCase();
      const match = items.find(item => item.toLowerCase() === lowerPart);
      resolvedPath = path.join(resolvedPath, match || part);
    } catch {
      resolvedPath = path.join(resolvedPath, part);
    }
  }
  return resolvedPath;
}

function caseInsensitiveResolvePlugin() {
  return {
    name: 'case-insensitive-resolve',
    resolveId(source: string, importer?: string) {
      // Handle the main file when resolved from index.html
      if (source.toLowerCase().endsWith('main.tsx')) {
        const target = path.resolve(process.cwd(), 'src', 'main.tsx');
        return getActualPathFromRoot(target);
      }
      
      // Handle other source paths pointing inside src/ or our project files
      if (source.startsWith('./') || source.startsWith('../') || source.startsWith('/') || source.startsWith('@/')) {
        let targetPath = '';
        if (source.startsWith('@/')) {
          targetPath = path.resolve(process.cwd(), source.slice(2));
        } else if (source.startsWith('/')) {
          targetPath = path.resolve(process.cwd(), source.slice(1));
        } else if (importer) {
          targetPath = path.resolve(path.dirname(importer), source);
        } else {
          targetPath = path.resolve(process.cwd(), source);
        }
        
        if (targetPath.startsWith(process.cwd())) {
          return getActualPathFromRoot(targetPath);
        }
      }
      return null;
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), caseInsensitiveResolvePlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
