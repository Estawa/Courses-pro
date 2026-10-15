import { CATEGORIES, PRODUITS } from '../data/defaults.js';

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

// Normalise un nom pour comparer : minuscules, sans accents, sans pluriel simple
export function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean)
    .map(w => (w.length > 3 ? w.replace(/(s|x)$/, '') : w))
    .join(' ');
}

export function findProduit(produits, nom) {
  const n = norm(nom);
  if (!n) return null;
  return produits.find(p => norm(p.nom) === n) || null;
}

// Devine une catégorie à partir du nom (mots du catalogue de départ + mots-clés)
const MOTS = {
  'fruits-legumes': 'fruit legume salade pomme poire peche abricot melon pasteque cerise prune mangue ananas epinard chou poireau navet radis betterave haricot frais persil basilic coriandre herbe echalote patate courge potiron aubergine fenouil celeri',
  boulangerie: 'pain baguette viennoiserie croissant chocolatine brioche',
  boucherie: 'boeuf porc veau agneau poulet dinde canard viande roti cote filet steak merguez chipolata',
  poissonnerie: 'poisson cabillaud colin truite moule huitre crevette saumon thon frais',
  traiteur: 'jambon charcuterie pate rillette quiche taboule pate brisee pate feuilletee chorizo',
  cremerie: 'lait yaourt yoghourt creme beurre oeuf dessert fromage blanc skyr petit suisse',
  fromages: 'fromage comte emmental gruyere brie chevre roquefort raclette parmesan feta',
  surgeles: 'surgele glace congele',
  'epicerie-salee': 'pate riz lentille quinoa farine huile vinaigre epice chip cracker aperitif bouillon',
  conserves: 'conserve sauce boite ketchup mayonnaise moutarde cornichon olive',
  'epicerie-sucree': 'sucre chocolat biscuit bonbon gateau levure vanille',
  'petit-dej': 'cafe the cereale confiture miel tartiner muesli capsule dosette',
  boissons: 'eau jus soda sirop limonade cola boisson',
  alcools: 'vin biere champagne cidre rhum whisky alcool aperitif',
  bebe: 'bebe couche lingette petit pot',
  hygiene: 'gel douche shampoing dentifrice brosse deodorant savon coton rasoir papier toilette mouchoir serviette',
  entretien: 'lessive vaisselle eponge javel nettoyant essuie sac poubelle adoucissant',
  animaux: 'chat chien croquette patee litiere',
  bazar: 'pile ampoule aluminium film bougie',
};

export function devinerCategorie(nom) {
  const n = norm(nom);
  if (!n) return 'autre';
  const exact = PRODUITS.find(p => norm(p.nom) === n);
  if (exact) return exact.cat;
  const mots = n.split(' ');
  const partiel = PRODUITS.find(p => mots.includes(norm(p.nom).split(' ')[0]));
  if (partiel) return partiel.cat;
  for (const [cat, liste] of Object.entries(MOTS)) {
    const cles = liste.split(' ').map(norm);
    if (mots.some(m => cles.includes(m))) return cat;
  }
  return 'autre';
}

export const categorie = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// Rayon d'un produit dans un magasin : article spécifique > catégorie > non classé
export function rayonDe(magasin, produit) {
  if (!magasin || !produit) return null;
  const ov = magasin.overrides?.[produit.id];
  if (ov && magasin.rayons.some(r => r.id === ov)) return ov;
  const r = magasin.rayons.find(r => r.cats.includes(produit.cat));
  return r ? r.id : null;
}

// "2 lait", "lait x2", "- 3 bananes", "500 g de farine"
export function parseTexte(texte) {
  return (texte || '')
    .split(/\n|;|•/)
    // Préfixes WhatsApp : "[14/10/2026 11:40] Chéri : lait" ou "14/10/2026 11:40 - Chéri: lait"
    .map(l => l
      .replace(/^\s*\[[^\]]{4,30}\]\s*[^:]{1,40}:\s*/, '')
      .replace(/^\s*\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*-\s*[^:]{1,40}:\s*/, ''))
    .flatMap(l => (l.includes(',') && !/\d,\d/.test(l) ? l.split(',') : [l]))
    .map(l => l.replace(/^[\s\-*–•☐☑✓✔□▢>\p{Extended_Pictographic}\uFE0F\u200D]+/u, '').replace(/\[[ xX]?\]/, '').trim())
    .filter(l => l && !/:\s*$/.test(l) && !/^(liste|courses|liste de courses|merci|bisous?)\b[\s!.]*$/i.test(l))
    .map(l => {
      let m = l.match(/^(\d+(?:[.,]\d+)?\s*(?:kg|g|l|cl|ml|x|×)?)\s+(?:de |d')?(.+)$/i);
      if (m) return { nom: cap(m[2]), qte: m[1].replace(/\s*[x×]$/i, '').trim() };
      m = l.match(/^(.+?)\s*[x×:]\s*(\d+(?:[.,]\d+)?)$/i);
      if (m) return { nom: cap(m[1]), qte: m[2] };
      return { nom: cap(l), qte: '' };
    });
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export const qteNum = q => {
  const n = parseFloat(String(q || '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && !/\s*(kg|g|gr|l|cl|ml)$/i.test(String(q).trim()) ? n : 1;
};

// Unités proposées à côté de la quantité
export const UNITES = ['Kg', 'Gr', 'Cl', 'L'];
const ALIAS_UNITE = { kg: 'Kg', kgs: 'Kg', g: 'Gr', gr: 'Gr', grs: 'Gr', cl: 'Cl', l: 'L' };
// "500 Gr" -> { n: '500', u: 'Gr' } ; "2" -> { n: '2', u: '' } ; "2 paquets" -> { n: '2 paquets', u: '' }
export function decouperQte(q) {
  const t = String(q || '').trim();
  const m = t.match(/^(\d+(?:[.,]\d*)?)\s*([a-zA-Z]+)$/);
  if (m && ALIAS_UNITE[m[2].toLowerCase()]) return { n: m[1], u: ALIAS_UNITE[m[2].toLowerCase()] };
  return { n: t, u: '' };
}
export const composerQte = (n, u) => { const x = String(n || '').trim(); return x ? (u ? `${x} ${u}` : x) : (u ? `1 ${u}` : ''); };
// Additionne deux quantités de même unité ("500 Gr" + "250 Gr" = "750 Gr") ; null si impossible
export function additionnerQte(a, b) {
  const x = decouperQte(a || '1'); const y = decouperQte(b || '1');
  const nx = Number(String(x.n).replace(',', '.')); const ny = Number(String(y.n).replace(',', '.'));
  if (x.u !== y.u || !Number.isFinite(nx) || !Number.isFinite(ny)) return null;
  return composerQte(String(Math.round((nx + ny) * 1000) / 1000).replace('.', ','), x.u);
}

export const euros = n =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

export const dateFr = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', opts);

export const aujourdhui = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const moisCle = iso => iso.slice(0, 7);
