import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// Injecte dans dist/sw.js la liste des fichiers générés, pour que l'appli soit
// entièrement disponible hors connexion dès la première ouverture.
function swHorsLigne() {
  let fichiers = [];
  let outDir = 'dist';
  return {
    name: 'sw-hors-ligne',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    generateBundle(_, bundle) { fichiers = Object.keys(bundle).map(f => '/' + f); },
    closeBundle() {
      const p = resolve(outDir, 'sw.js');
      const sw = readFileSync(p, 'utf8')
        .replace('__FICHIERS__', JSON.stringify(fichiers))
        .replace('__VERSION__', pkg.version + '-' + Date.now().toString(36));
      writeFileSync(p, sw);
    },
  };
}

export default defineConfig({
  plugins: [react(), swHorsLigne()],
});
