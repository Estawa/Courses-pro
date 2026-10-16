// Catalogue de recettes intégré à l'appli (lots rédigés au fil des versions)
import { lireCatalogue } from '../../lib/recettes.js';
import lot01 from './lot01.js';
import lot02 from './lot02.js';
import lot03 from './lot03.js';
import lot04 from './lot04.js';
import lot05 from './lot05.js';
import lot06 from './lot06.js';
import lot07 from './lot07.js';
import lot08 from './lot08.js';

const LOTS = [lot01, lot02, lot03, lot04, lot05, lot06, lot07, lot08];

let cache;
export function catalogue() {
  if (!cache) {
    const vus = new Set();
    cache = LOTS.flatMap(t => lireCatalogue(t)).filter(r => (vus.has(r.id) ? false : (vus.add(r.id), true)));
  }
  return cache;
}
