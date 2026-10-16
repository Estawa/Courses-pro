// Estimations par portion : calories, protéines et coût, calculées à partir des ingrédients.
import { TABLE_NUTRITION, POIDS_UNITE } from '../data/nutrition.js';
import { uniteStd, estBasique } from './recettes.js';
import { norm } from './utils.js';

// --- Lecture de la table ---------------------------------------------------
let INDEX = null; // [{ cle, info }] trié du plus long au plus court
function index() {
  if (INDEX) return INDEX;
  const map = new Map();
  TABLE_NUTRITION.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
    const [cles, kcal, prot, prix, piece, unites = ''] = l.split('|').map(s => s.trim());
    const info = {
      kcal: Number(kcal) || 0, prot: Number(prot) || 0, prix: Number(prix) || 0,
      piece: piece ? Number(piece) : null, unites: {},
    };
    unites.split('/').map(s => s.trim()).filter(Boolean).forEach(x => {
      const [u, g] = x.split('=').map(s => s.trim());
      info.unites[norm(u)] = Number(g);
    });
    cles.split('/').map(s => norm(s)).filter(Boolean).forEach(k => map.set(k, info));
  });
  INDEX = [...map.entries()].map(([cle, info]) => ({ cle, info })).sort((a, b) => b.cle.length - a.cle.length);
  return INDEX;
}
const CACHE_ING = new Map();
// Valeurs de référence d'un ingrédient (la clé la plus longue contenue dans le nom gagne)
export function infoIngredient(nom) {
  const n = norm(String(nom || '').replace(/\(.*?\)/g, ' '));
  if (CACHE_ING.has(n)) return CACHE_ING.get(n);
  const pad = ' ' + n + ' ';
  const hit = index().find(e => pad.includes(' ' + e.cle + ' '));
  const res = hit ? hit.info : null;
  CACHE_ING.set(n, res);
  return res;
}

// Poids en grammes d'une ligne d'ingrédient (null si impossible à estimer)
export function grammes(ing, info, k = 1) {
  const q = parseFloat(String(ing.qte ?? '').replace(',', '.'));
  if (!Number.isFinite(q) || q <= 0) return null;
  const u = uniteStd(ing.unite);
  const x = q * k;
  switch (u) {
    case 'g': return x;
    case 'kg': return x * 1000;
    case 'ml': return x;
    case 'cl': return x * 10;
    case 'dl': return x * 100;
    case 'l': return x * 1000;
    default: {
      const nu = norm(u);
      const w = info?.unites?.[nu] ?? (u === 'pièce' || u === '' ? info?.piece : null) ?? POIDS_UNITE[u] ?? 100;
      return x * w;
    }
  }
}

// --- Recette ---------------------------------------------------------------
const CACHE_R = new WeakMap();
// remplacements : { index ingrédient : nouveau nom } (comme dans la fiche / le repas)
export function nutrition(r, remplacements = null) {
  const simple = !remplacements || !Object.keys(remplacements).length;
  if (simple && CACHE_R.has(r)) return CACHE_R.get(r);
  let kcal = 0, prot = 0, cout = 0, connus = 0, total = 0;
  const inconnus = [];
  (r.ingredients || []).forEach((ing, i) => {
    if (ing.optionnel && !(remplacements && remplacements[i])) return;
    const nom = (remplacements && remplacements[i]) || ing.nom;
    if (estBasique(nom)) return;
    const info = infoIngredient(nom);
    total++;
    if (!info) { inconnus.push(nom); return; }
    const g = grammes(ing, info);
    if (g === null) { connus++; return; } // « un peu » : négligeable
    connus++;
    kcal += info.kcal * g / 100;
    prot += info.prot * g / 100;
    cout += info.prix * g / 1000;
  });
  const p = Math.max(1, Number(r.personnes) || 4);
  const res = {
    kcal: Math.round(kcal / p / 10) * 10,
    prot: Math.round(prot / p),
    cout: Math.round(cout / p * 100) / 100,
    fiable: total ? connus / total : 1,
    inconnus,
  };
  if (simple) CACHE_R.set(r, res);
  return res;
}

export const eurosTxt = n => (n >= 10 ? Math.round(n) + ' €' : n.toFixed(2).replace('.', ',') + ' €');
export const nutriTxt = n => `${n.kcal} kcal · ${n.prot} g prot. · ${eurosTxt(n.cout)}`;

// Critères de tri « par portion »
export const CRITERES = [
  { id: 'stock', nom: 'Mon stock', emoji: '🏠' },
  { id: 'cout', nom: 'Moins cher', emoji: '💶' },
  { id: 'prot', nom: 'Plus de protéines', emoji: '💪' },
  { id: 'kcal', nom: 'Moins de calories', emoji: '🪶' },
  { id: 'kcalplus', nom: 'Plus nourrissant', emoji: '🔋' },
  { id: 'note', nom: 'Mieux notées', emoji: '⭐' },
];
// Valeur à MINIMISER selon le critère (pour trier)
export function valeurCritere(critere, r, noteDe) {
  const n = nutrition(r);
  switch (critere) {
    case 'cout': return n.cout;
    case 'prot': return -n.prot;
    case 'kcal': return n.kcal;
    case 'kcalplus': return -n.kcal;
    case 'note': return -(noteDe ? noteDe(r.id) : 0);
    default: return 0;
  }
}
