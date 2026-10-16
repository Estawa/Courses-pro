// Catalogue de recettes intégré à l'appli (lots rédigés au fil des versions)
import { lireCatalogue } from '../../lib/recettes.js';
import lot01 from './lot01.js';
import lot02 from './lot02.js';

const LOTS = [lot01, lot02];

let cache;
export function catalogue() {
  if (!cache) {
    const vus = new Set();
    cache = LOTS.flatMap(t => lireCatalogue(t)).filter(r => (vus.has(r.id) ? false : (vus.add(r.id), true)));
  }
  return cache;
}
