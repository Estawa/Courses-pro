// Moteur de l'onglet Recettes : format commun, lien avec le stock maison, repas complet,
// remplacements, mise à jour du stock après cuisson, planning et consigne pour une IA.
import {
  APPAREILS, CATS_RECETTE, STYLES, TAGS, UNITES_RECETTE, BASIQUES, EXCLUS_DEFAUT,
  SUBSTITUTIONS, CONTENANCES, POIDS_PIECE, AUTONOMES,
} from '../data/cuisine.js';
import { norm } from './utils.js';

// ---------------------------------------------------------------------------
// Petits outils
// ---------------------------------------------------------------------------
export const slug = t => norm(t).replace(/ /g, '-').slice(0, 60) || 'recette';
const arrondi = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p;
const num = v => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const t = String(v).trim().replace(',', '.');
  const f = t.match(/^(\d+)\s*\/\s*(\d+)$/); // 1/2
  if (f) return Number(f[1]) / Number(f[2]);
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
};
// a contient la suite de mots b (formes normalisées)
export function contientMots(a, b) {
  if (!a || !b) return false;
  return (' ' + a + ' ').includes(' ' + b + ' ');
}
// Cherche une clé d'un dictionnaire (clés en français courant) contenue dans un nom : la plus longue gagne
function cleDans(dico, nom) {
  const n = norm(nom);
  let best = null;
  for (const k of Object.keys(dico)) {
    const nk = norm(k);
    if (contientMots(n, nk) && (!best || nk.length > norm(best).length)) best = k;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Unités : tout est ramené à une « base » comparable
//   m = masse (g), v = volume (ml), n = nombre (pièces, boîtes…), p = « un peu » (c. à soupe, pincée…)
// ---------------------------------------------------------------------------
const UNITE_ALIAS = {
  g: 'g', gr: 'g', grs: 'g', gramme: 'g', grammes: 'g', kg: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'ml', cl: 'cl', l: 'l', litre: 'l', litres: 'l', dl: 'dl',
  piece: 'pièce', pieces: 'pièce', pc: 'pièce', pcs: 'pièce', u: 'pièce', unite: 'pièce',
  gousse: 'gousse', gousses: 'gousse', tranche: 'tranche', tranches: 'tranche', botte: 'botte', bottes: 'botte',
  brin: 'brin', brins: 'brin', feuille: 'feuille', feuilles: 'feuille', boite: 'boîte', boites: 'boîte',
  sachet: 'sachet', sachets: 'sachet', paquet: 'paquet', paquets: 'paquet', pot: 'pot', pots: 'pot',
  rouleau: 'rouleau', rouleaux: 'rouleau', verre: 'verre', verres: 'verre', bol: 'bol', bols: 'bol',
  cas: 'c. à soupe', 'c a s': 'c. à soupe', 'c a soupe': 'c. à soupe', 'cuillere a soupe': 'c. à soupe', cs: 'c. à soupe', 'c soupe': 'c. à soupe',
  cac: 'c. à café', 'c a c': 'c. à café', 'c a cafe': 'c. à café', 'cuillere a cafe': 'c. à café', cc: 'c. à café', 'c cafe': 'c. à café',
  pincee: 'pincée', pincees: 'pincée',
};
export function uniteStd(u) {
  const t = String(u || '').trim();
  if (!t) return '';
  if (UNITE_ALIAS[t]) return UNITE_ALIAS[t];
  const k = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.'’]/g, ' ').replace(/\s+/g, ' ').trim();
  return UNITE_ALIAS[k] || UNITE_ALIAS[k.replace(/s$/, '')] || (UNITES_RECETTE.includes(t) ? t : 'pièce');
}
const PRESENCE = ['c. à soupe', 'c. à café', 'pincée', 'gousse', 'brin', 'feuille', ''];
export function enBase(qte, unite) {
  const u = uniteStd(unite);
  const q = num(qte);
  if (q === null || PRESENCE.includes(u)) return { d: 'p', v: 0 };
  switch (u) {
    case 'g': return { d: 'm', v: q };
    case 'kg': return { d: 'm', v: q * 1000 };
    case 'ml': return { d: 'v', v: q };
    case 'cl': return { d: 'v', v: q * 10 };
    case 'dl': return { d: 'v', v: q * 100 };
    case 'l': return { d: 'v', v: q * 1000 };
    default: return { d: 'n', v: q, mot: u };
  }
}
// Base du stock d'un produit de l'onglet Maison
function contenanceDe(p) {
  const brut = p.contenance || CONTENANCES[cleDans(CONTENANCES, p.nom) || ''] || '';
  const m = String(brut).trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  return m ? enBase(m[1], m[2] || 'pièce') : null;
}
function uniteStock(p) {
  const u = uniteStd(p.unite);
  if (['g', 'kg', 'ml', 'cl', 'l', 'dl'].includes(u)) return { dir: enBase(1, u) }; // 1 unité de stock = …
  return { compte: true, c: contenanceDe(p) }; // stock en nombre (paquets, pièces…)
}
// Convertit un besoin {d,v} dans la dimension du stock du produit. null = incomparable.
function versDim(b, cible, nom, produit) {
  if (b.d === cible) return b.v;
  // « 2 boîtes de thon » face à un stock compté en boîtes de 140 g : 1 boîte = 1 unité du stock
  const pp0 = POIDS_PIECE[cleDans(POIDS_PIECE, nom) || ''];
  if (b.d === 'n' && (!b.mot || b.mot === 'pièce') && pp0 && cible === 'm') return b.v * pp0;
  if (b.d === 'n' && produit) {
    const us = uniteStock(produit);
    if (us.compte && us.c && us.c.d === cible) return b.v * us.c.v;
  }
  const pp = POIDS_PIECE[cleDans(POIDS_PIECE, nom) || ''];
  if (b.d === 'n' && cible === 'm' && pp) return b.v * pp;
  if (b.d === 'm' && cible === 'n' && pp) return b.v / pp;
  if (b.d === 'n' && cible === 'v' && pp) return b.v * pp; // fruits pressés… approximation
  return null;
}
// Quantité disponible du produit, exprimée dans une base {d, v}
export function stockBase(p) {
  const s = Math.max(0, Number(p.stock) || 0);
  const us = uniteStock(p);
  if (us.dir) return { d: us.dir.d, v: s * us.dir.v };
  if (us.c && us.c.d !== 'p') return { d: us.c.d, v: s * us.c.v };
  return { d: 'n', v: s };
}
// Combien d'unités de stock représente une quantité de base (pour décompter)
function versUnitesStock(p, d, v) {
  const us = uniteStock(p);
  if (us.dir) return us.dir.d === d ? v / us.dir.v : null;
  if (us.c && us.c.d !== 'p') return us.c.d === d ? v / us.c.v : null;
  return d === 'n' ? v : null;
}
export function afficherBase(d, v, mot) {
  if (d === 'p') return 'un peu';
  if (d === 'm') return v >= 1000 ? `${arrondi(v / 1000, 2)} kg`.replace('.', ',') : `${Math.round(v)} g`;
  if (d === 'v') return v >= 1000 ? `${arrondi(v / 1000, 2)} L`.replace('.', ',') : v >= 10 ? `${arrondi(v / 10, 1)} cl`.replace('.', ',') : `${Math.round(v)} ml`;
  const n = arrondi(v, 1);
  const m = mot && mot !== 'pièce' ? ' ' + mot + (n > 1 && !/[sx]$/.test(mot) ? 's' : '') : '';
  return `${String(n).replace('.', ',')}${m}`;
}
export function afficherQte(qte, unite) {
  const q = num(qte);
  const u = uniteStd(unite);
  if (q === null) return u && !PRESENCE.includes(u) ? u : '';
  const n = String(arrondi(q, q < 10 ? 2 : 0)).replace('.', ',');
  if (!u || u === 'pièce') return n;
  const pluriel = q > 1 && !['g', 'kg', 'ml', 'cl', 'l', 'dl', 'c. à soupe', 'c. à café'].includes(u) && !/[sx]$/.test(u);
  return `${n} ${u}${pluriel ? 's' : ''}`;
}
// Texte de quantité pour la liste de courses (unités Kg / Gr / Cl / L de Courses Pro)
export function qtePourListe(d, v, mot) {
  if (d === 'm') return v >= 1000 ? `${arrondi(v / 1000, 2)} Kg`.replace('.', ',') : `${Math.ceil(v)} Gr`;
  if (d === 'v') return v >= 1000 ? `${arrondi(v / 1000, 2)} L`.replace('.', ',') : `${Math.ceil(v / 10)} Cl`;
  if (d === 'n') return String(Math.ceil(v)) + (mot && mot !== 'pièce' ? '' : '');
  return '';
}

// ---------------------------------------------------------------------------
// Format commun d'une recette (catalogue, recettes perso, recettes importées par une IA)
// ---------------------------------------------------------------------------
const ALIAS_APPAREIL = {
  companion: 'companion', 'cuisine companion': 'companion', 'moulinex companion': 'companion', robot: 'companion', 'robot cuiseur': 'companion', thermomix: 'companion',
  cookeo: 'cookeo', multicuiseur: 'cookeo', 'autocuiseur': 'cookeo', 'cocotte minute': 'cookeo',
  four: 'four', oven: 'four',
  microonde: 'microondes', microondes: 'microondes', 'micro onde': 'microondes', 'micro ondes': 'microondes', 'micro onde combine': 'microondes', 'micro ondes combine': 'microondes',
  actifry: 'actifry', 'seb actifry': 'actifry', airfryer: 'actifry', 'air fryer': 'actifry', friteuse: 'actifry',
  plaque: 'plaque', 'plaque de cuisson': 'plaque', poele: 'plaque', casserole: 'plaque', sauteuse: 'plaque', feu: 'plaque', gaz: 'plaque', induction: 'plaque', wok: 'plaque',
  bbqgaz: 'bbqgaz', 'barbecue gaz': 'bbqgaz', 'barbecue a gaz': 'bbqgaz', barbecue: 'bbqgaz', bbq: 'bbqgaz',
  braises: 'braises', 'barbecue a braise': 'braises', 'barbecue a braises': 'braises', 'barbecue charbon': 'braises', charbon: 'braises', braise: 'braises',
  plancha: 'plancha', 'plancha electrique': 'plancha',
  aucun: 'aucun', 'sans cuisson': 'aucun', aucune: 'aucun', frigo: 'aucun', refrigerateur: 'aucun',
};
export function appareilStd(a) {
  const k = String(a || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_'’]/g, ' ').replace(/\s+/g, ' ').trim();
  return ALIAS_APPAREIL[k] || ALIAS_APPAREIL[k.replace(/s$/, '')] || (APPAREILS.some(x => x.id === k) ? k : null);
}
const SURV = { 0: 'aucune', 1: 'faible', 2: 'forte', aucune: 'aucune', aucun: 'aucune', non: 'aucune', faible: 'faible', moyenne: 'faible', 'de temps en temps': 'faible', forte: 'forte', constante: 'forte', oui: 'forte' };
const survStd = s => SURV[String(s ?? '').toLowerCase().trim()] || 'faible';
const choix = (v, liste, def) => {
  const n = norm(v);
  if (!n) return def;
  const trouve = liste.find(x => norm(x.id) === n || norm(x.nom) === n || norm(x.un || '') === n);
  return trouve ? trouve.id : def;
};

// Remet n'importe quel objet « recette » (venant d'une IA, d'un fichier…) au format de l'appli.
// Renvoie { recette, alertes[] } ou lance une erreur si c'est inutilisable.
export function normaliserRecette(r, source = 'import') {
  if (!r || typeof r !== 'object') throw new Error('Ce n’est pas une recette.');
  const alertes = [];
  const titre = String(r.titre || r.title || r.nom || '').trim();
  if (!titre) throw new Error('La recette n’a pas de titre.');
  const ingBruts = Array.isArray(r.ingredients) ? r.ingredients : [];
  const ingredients = ingBruts.map(i => {
    if (typeof i === 'string') return { nom: i.trim(), qte: null, unite: '', remplacements: [], optionnel: false };
    const nom = String(i.nom || i.name || i.ingredient || '').trim();
    return {
      nom,
      qte: num(i.qte ?? i.quantite ?? i.quantity),
      unite: uniteStd(i.unite ?? i.unit ?? ''),
      remplacements: (Array.isArray(i.remplacements) ? i.remplacements : Array.isArray(i.substitutions) ? i.substitutions : [])
        .map(x => String(x).trim()).filter(Boolean).slice(0, 5),
      optionnel: !!(i.optionnel || i.optional || i.facultatif),
    };
  }).filter(i => i.nom);
  if (!ingredients.length) alertes.push('Aucun ingrédient trouvé.');

  const etapeStd = (e, appDef) => {
    if (typeof e === 'string') return { texte: e.trim(), duree_min: null, surveillance: 'faible', appareil: appDef };
    return {
      texte: String(e.texte || e.text || e.etape || '').trim(),
      duree_min: num(e.duree_min ?? e.duree ?? e.minutes),
      surveillance: survStd(e.surveillance),
      appareil: appareilStd(e.appareil) || appDef,
    };
  };
  let variantes = Array.isArray(r.variantes) && r.variantes.length ? r.variantes : [{ appareils: r.appareils, etapes: r.etapes, cuisson_min: r.cuisson_min }];
  variantes = variantes.map(v => {
    const apps = (Array.isArray(v.appareils) ? v.appareils : [v.appareil || v.appareils].filter(Boolean)).map(appareilStd).filter(Boolean);
    const appareils = apps.length ? [...new Set(apps)] : ['plaque'];
    const etapes = (Array.isArray(v.etapes) ? v.etapes : []).map(e => etapeStd(e, appareils[0])).filter(e => e.texte);
    return { appareils, cuisson_min: num(v.cuisson_min), nom: v.nom ? String(v.nom) : '', etapes };
  }).filter(v => v.etapes.length);
  if (!variantes.length) { alertes.push('Aucune étape trouvée.'); variantes = [{ appareils: ['plaque'], cuisson_min: null, nom: '', etapes: [] }]; }

  const tags = (Array.isArray(r.tags) ? r.tags : String(r.tags || '').split(',')).map(t => choix(t, TAGS, null)).filter(Boolean);
  const recette = {
    id: String(r.id || '').trim() || (source === 'catalogue' ? slug(titre) : 'perso-' + slug(titre) + '-' + Date.now().toString(36).slice(-4)),
    titre,
    categorie: choix(r.categorie || r.category, CATS_RECETTE, 'plat'),
    style: choix(r.style, STYLES, 'quotidien'),
    origine: String(r.origine || '').trim(),
    tags: [...new Set(tags)],
    personnes: Math.max(1, Math.round(num(r.personnes ?? r.portions ?? r.servings) || 4)),
    preparation_min: num(r.preparation_min ?? r.preparation) ?? null,
    difficulte: Math.min(3, Math.max(1, Math.round(num(r.difficulte) || 1))),
    emoji: String(r.emoji || '').trim().slice(0, 4),
    ingredients,
    variantes,
    astuce: String(r.astuce || r.conseil || r.notes || '').trim(),
    source,
  };
  if (r.auteur) recette.auteur = String(r.auteur);
  return { recette, alertes };
}

// Trouve le JSON dans une réponse d'IA (bloc ```json, texte autour…) : une ou plusieurs recettes
export function lireReponseIA(texte) {
  const t = String(texte || '').trim();
  if (!t) throw new Error('Rien à importer : colle la réponse de l’IA.');
  const bloc = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let brut = bloc ? bloc[1] : t;
  const i = brut.search(/[[{]/);
  if (i < 0) throw new Error('Je ne trouve pas de recette au format JSON dans ce texte.');
  brut = brut.slice(i);
  const fin = Math.max(brut.lastIndexOf('}'), brut.lastIndexOf(']'));
  brut = brut.slice(0, fin + 1);
  let d;
  try { d = JSON.parse(brut); } catch {
    try { d = JSON.parse(brut.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"')); } catch {
      throw new Error('Le JSON est mal formé. Redemande à l’IA de renvoyer uniquement le JSON complet.');
    }
  }
  const liste = Array.isArray(d) ? d : Array.isArray(d.recettes) ? d.recettes : [d];
  return liste.map(r => normaliserRecette(r, 'import'));
}

export function exporterRecette(r) {
  const { source, ...rest } = r; // eslint-disable-line no-unused-vars
  return JSON.stringify(rest, null, 2);
}

// ---------------------------------------------------------------------------
// Format compact du catalogue (fichiers src/data/recettes/*.js)
// # Titre | catégorie | style[:Origine] | tags | personnes | préparation min | difficulté | emoji
// - quantité | unité | ingrédient | remplacement 1; remplacement 2 | opt
// = appareil1,appareil2 | cuisson min | nom de la version
// > étape | durée min | surveillance 0/1/2 | appareil
// ! astuce
// ---------------------------------------------------------------------------
export function lireCatalogue(texte) {
  const res = [];
  let cur = null;
  const fin = () => { if (cur) { try { res.push(normaliserRecette(cur, 'catalogue').recette); } catch (e) { console.warn('Recette ignorée', cur.titre, e.message); } } cur = null; };
  String(texte).split('\n').forEach(ligne => {
    const l = ligne.trim();
    if (!l) return;
    const c = l[0];
    const parts = l.slice(1).split('|').map(s => s.trim());
    if (c === '#') {
      fin();
      const [titre, categorie, styleO = '', tags = '', pers = '4', prep = '', diff = '1', emoji = ''] = parts;
      const [style, origine = ''] = styleO.split(':').map(s => s.trim());
      cur = { titre, categorie, style, origine, tags: tags.split(',').map(s => s.trim()).filter(Boolean), personnes: pers, preparation_min: prep, difficulte: diff, emoji, ingredients: [], variantes: [] };
    } else if (!cur) {
      // ligne hors recette : ignorée
    } else if (c === '-') {
      let [qte, unite, nom, remp = '', opt = ''] = parts; // eslint-disable-line prefer-const
      if (remp === 'opt') { remp = ''; opt = 'opt'; }
      cur.ingredients.push({ qte, unite, nom, remplacements: remp.split(';').map(s => s.trim()).filter(Boolean), optionnel: opt === 'opt' });
    } else if (c === '=') {
      const [apps, cuisson = '', nom = ''] = parts;
      cur.variantes.push({ appareils: apps.split(',').map(s => s.trim()), cuisson_min: cuisson, nom, etapes: [] });
    } else if (c === '>') {
      const [texteEt, duree = '', surv = '1', app = ''] = parts;
      if (!cur.variantes.length) cur.variantes.push({ appareils: [app || 'plaque'], etapes: [] });
      const v = cur.variantes[cur.variantes.length - 1];
      v.etapes.push({ texte: texteEt, duree_min: duree, surveillance: Number(surv), appareil: app || v.appareils[0] });
    } else if (c === '!') {
      cur.astuce = (cur.astuce ? cur.astuce + ' ' : '') + l.slice(1).trim();
    }
  });
  fin();
  return res;
}

// ---------------------------------------------------------------------------
// Configuration de la cuisine du foyer (appareils, mangeurs)
// ---------------------------------------------------------------------------
export function appareilsDu(db) {
  const reg = new Map((db.appareils || []).map(a => [a.id, a]));
  return APPAREILS.map(a => ({ ...a, possede: a.toujours ? true : reg.has(a.id) ? !!reg.get(a.id).possede : a.possede }));
}
export const appareilsPossedes = db => new Set(appareilsDu(db).filter(a => a.possede).map(a => a.id));
export function mangeursDu(db) {
  return db.mangeurs?.length ? db.mangeurs : [{ id: 'famille', nom: 'Toute la famille', emoji: '👨‍👩‍👧‍👦', exclus: [...EXCLUS_DEFAUT] }];
}
// Ingrédient refusé par l'un des mangeurs choisis : renvoie les noms des mangeurs concernés
export function refusePar(nom, mangeurs) {
  const n = norm(nom);
  return mangeurs.filter(m => (m.exclus || []).some(x => contientMots(n, norm(x)))).map(m => m.nom);
}
// Variante utilisable : appareils possédés ; à défaut la première
export function varianteParDefaut(recette, possedes) {
  const i = recette.variantes.findIndex(v => v.appareils.every(a => possedes.has(a)));
  return i >= 0 ? i : 0;
}
export const varianteFaisable = (v, possedes) => v.appareils.every(a => possedes.has(a));
export const recetteFaisable = (r, possedes) => r.variantes.some(v => varianteFaisable(v, possedes));
export function dureeVariante(r, v) {
  const etapes = (v.etapes || []).reduce((s, e) => s + (num(e.duree_min) || 0), 0);
  return etapes || ((num(r.preparation_min) || 0) + (num(v.cuisson_min) || 0)) || null;
}
export const dureeTotale = r => {
  const ds = r.variantes.map(v => dureeVariante(r, v)).filter(Boolean);
  return ds.length ? Math.min(...ds) : null;
};
export const tourneSeule = v => (v.etapes || []).every(e => e.surveillance !== 'forte') && v.appareils.some(a => AUTONOMES.includes(a));

// ---------------------------------------------------------------------------
// Lien ingrédient ↔ article du stock (onglet Maison)
// ---------------------------------------------------------------------------
const CATS_NON_ALIMENTAIRES = ['hygiene', 'entretien', 'animaux', 'bazar', 'bebe'];
// Noms de pâtes qui correspondent à l'article « Pâtes » du stock
const PATES = ['spaghetti', 'penne', 'coquillette', 'tagliatelle', 'fusilli', 'macaroni', 'farfalle', 'linguine', 'rigatoni', 'pate', 'petite pate', 'conchiglie', 'orecchiette', 'torsade', 'nouille'];
// Faux amis : l'article du stock (clé) ne doit pas servir pour ces ingrédients
const REJETS = {
  'pomme': ['pomme de terre'],
  'lait': ['lait de coco', 'lait concentre', 'lait vegetal', 'lait d amande', 'lait d avoine'],
  'sucre': ['sucre vanille', 'sucre glace'],
  'tomate': ['tomate concassee', 'coulis de tomate', 'concentre de tomate', 'sauce tomate', 'tomate sechee', 'pulpe de tomate'],
  'citron': ['citron confit'],
  'riz': ['vinaigre de riz', 'vermicelle de riz', 'farine de riz', 'galette de riz', 'feuille de riz'],
  'chocolat': ['chocolat blanc'],
  'beurre': ['beurre de cacahuete'],
  'creme fraiche': [],
  'pain': ['pain d epice'],
};
function compatible(np, n) {
  if (np === 'pate') return PATES.some(x => n === x || n.startsWith(x + ' ') || contientMots(n, x)) && !/pate (brisee|feuilletee|sablee|a |de |filo|d )/.test(n);
  return !(REJETS[np] || []).some(x => contientMots(n, norm(x)));
}
// Noms normalisés des articles, calculés une fois par version de la liste (recherche rapide sur 800 recettes)
const CACHE_ALIM = new WeakMap();
function alimentaires(produits) {
  let c = CACHE_ALIM.get(produits);
  if (!c) { c = produits.filter(p => !CATS_NON_ALIMENTAIRES.includes(p.cat)).map(p => ({ p, np: norm(p.nom) })); CACHE_ALIM.set(produits, c); }
  return c;
}
export const cleIngredient = nom => norm(nom).replace(/ /g, '_');
export function trouverProduit(produits, nom, liens = []) {
  const n = norm(nom);
  if (!n) return null;
  const lien = (liens || []).find(l => l.id === cleIngredient(nom));
  if (lien) { const p = produits.find(x => x.id === lien.produitId); if (p) return p; }
  const liste = alimentaires(produits);
  const exact = liste.find(x => x.np === n);
  if (exact) return exact.p;
  let best = null; let bestN = 0;
  liste.forEach(({ p, np }) => {
    if (np.length >= 3 && contientMots(n, np) && compatible(np, n) && np.length > bestN) { best = p; bestN = np.length; }
  });
  if (best) return best;
  // Spaghettis, penne, coquillettes… → article « Pâtes »
  if (PATES.some(x => contientMots(n, x)) && !/pate (brisee|feuilletee|sablee|a |de |filo|d )/.test(n)) {
    const pates = liste.find(x => x.np === 'pate');
    if (pates) return pates.p;
  }
  // « Tomates » demandé, « Tomates cerises » en stock : seulement si un seul article correspond
  const larges = liste.filter(x => contientMots(x.np, n));
  return larges.length === 1 ? larges[0].p : null;
}
export const estBasique = nom => { const n = norm(nom); return BASIQUES.some(b => norm(b) === n) || /^eau( |$)/.test(n) || /^glacon/.test(n); };

// ---------------------------------------------------------------------------
// Besoins d'un repas (une ou plusieurs recettes) comparés au stock — cumulés !
//   items : [{ recette, personnes, variante, remplacements: { indexIngrédient: 'nouveau nom' } }]
// ---------------------------------------------------------------------------
export function besoinsRepas(db, items, reste = null) {
  const lignes = new Map();
  items.forEach(it => {
    const r = it.recette;
    if (!r) return;
    const k = (it.personnes || r.personnes) / r.personnes;
    r.ingredients.forEach((ing, idx) => {
      const nom = (it.remplacements && it.remplacements[idx]) || ing.nom;
      if (ing.optionnel && !(it.remplacements && it.remplacements[idx])) return;
      const qte = num(ing.qte);
      const b = enBase(qte === null ? null : qte * k, ing.unite);
      const p = trouverProduit(db.produits, nom, db.liens);
      const cle = p ? 'p:' + p.id : 'n:' + norm(nom);
      if (!lignes.has(cle)) lignes.set(cle, { cle, nom: p ? p.nom : nom, produit: p, besoins: [], recettes: new Set(), presence: false, incomparable: false, mot: '' });
      const L = lignes.get(cle);
      L.recettes.add(r.titre);
      if (b.d === 'p') { L.presence = true; return; }
      L.besoins.push({ ...b, nom });
      if (b.mot) L.mot = b.mot;
    });
  });
  return [...lignes.values()].map(L => evaluerLigne(L, reste)).sort((a, b) => ORDRE_ETAT[a.etat] - ORDRE_ETAT[b.etat] || a.nom.localeCompare(b.nom, 'fr'));
}
const ORDRE_ETAT = { manque: 0, court: 1, absent: 2, verifier: 3, nonsuivi: 4, ok: 5, basique: 6 };
function evaluerLigne(L, reste) {
  const out = { ...L, recettes: [...L.recettes] };
  if (estBasique(L.nom) && (!L.produit || !L.produit.suivi)) return { ...out, etat: 'basique', besoinTexte: '' };
  const p = L.produit;
  // Quantité demandée, exprimée dans la dimension du stock (ou à défaut la sienne)
  const dimStock = p ? stockBase(p).d : null;
  let total = 0; let dim = dimStock;
  L.besoins.forEach(b => {
    if (!dim) dim = b.d;
    const v = versDim(b, dim, b.nom, p);
    if (v === null) out.incomparable = true; else total += v;
  });
  out.besoinDim = dim; out.besoinVal = total;
  out.besoinTexte = L.besoins.length ? afficherBase(dim || 'n', total, L.mot) + (out.incomparable ? ' +…' : '') : (L.presence ? 'un peu' : '');
  // Épices, herbes… demandées « un peu » et jamais suivies : sûrement au placard, à vérifier
  if (!p) return { ...out, etat: !L.besoins.length && L.presence ? 'verifier' : 'absent' };
  if (!p.suivi) return { ...out, etat: 'nonsuivi' };
  const sb = stockBase(p);
  const dispo = reste && reste.has(p.id) ? reste.get(p.id) : sb.v;
  out.dispoVal = dispo; out.dispoTexte = afficherBase(sb.d, dispo, L.mot);
  if (dispo <= 0) return { ...out, etat: 'manque', manqueVal: total || 1 };
  if (!L.besoins.length || total === 0) return { ...out, etat: out.incomparable ? 'verifier' : 'ok' };
  if (dispo + 1e-9 >= total) return { ...out, etat: out.incomparable ? 'verifier' : 'ok' };
  return { ...out, etat: 'court', manqueVal: total - dispo };
}
export const ETATS = {
  ok: { txt: 'En stock', emoji: '🟢' },
  court: { txt: 'Pas assez', emoji: '🟠' },
  manque: { txt: 'Épuisé', emoji: '🔴' },
  absent: { txt: 'À acheter', emoji: '🛒' },
  nonsuivi: { txt: 'Pas suivi', emoji: '⚪' },
  verifier: { txt: 'À vérifier', emoji: '🟡' },
  basique: { txt: 'Placard', emoji: '🧂' },
};
export const lignesManquantes = lignes => lignes.filter(l => ['manque', 'court', 'absent'].includes(l.etat));
// Quantité à ajouter à la liste de courses pour une ligne manquante
export function qteAAcheter(l) {
  if (!l.besoinDim || !l.besoinVal) return '';
  const v = l.etat === 'court' ? l.manqueVal : l.besoinVal;
  if (l.produit) {
    const u = versUnitesStock(l.produit, l.besoinDim, v);
    const us = uniteStock(l.produit);
    if (u !== null && us.compte) return String(Math.max(1, Math.ceil(u - 1e-9)));
  }
  return qtePourListe(l.besoinDim, v, l.mot);
}

// Score d'une recette selon le stock (part des ingrédients disponibles), avec un stock « restant » éventuel
export function couverture(db, recette, personnes, reste = null) {
  const lignes = besoinsRepas(db, [{ recette, personnes: personnes || recette.personnes, variante: 0 }], reste);
  const utiles = lignes.filter(l => l.etat !== 'basique');
  const okN = utiles.filter(l => ['ok', 'nonsuivi', 'verifier'].includes(l.etat)).length;
  const verifies = utiles.filter(l => l.etat === 'ok').length;
  return { lignes, manquants: lignesManquantes(lignes), score: utiles.length ? okN / utiles.length : 1, nonSuivis: utiles.length - verifies - lignesManquantes(lignes).length };
}
// Retire du stock « virtuel » ce qu'une recette consomme (pour enchaîner entrée + plat + dessert)
export function consommer(reste, lignes) {
  lignes.forEach(l => {
    if (!l.produit || !l.produit.suivi || !l.besoinVal) return;
    const sb = stockBase(l.produit);
    if (sb.d !== l.besoinDim) return;
    const avant = reste.has(l.produit.id) ? reste.get(l.produit.id) : sb.v;
    reste.set(l.produit.id, Math.max(0, avant - l.besoinVal));
  });
}

// Propose un repas complet faisable AVEC le stock : chaque plat retenu « consomme » le stock
// avant de choisir le suivant (fini le paquet de pâtes compté deux fois).
export function proposerRepas(db, recettes, { cats = ['entree', 'plat', 'dessert'], personnes = 4, exclure = [], mangeurs = [], styles = [], seed = Math.random() } = {}) {
  const possedes = appareilsPossedes(db);
  const reste = new Map();
  let s = seed;
  const alea = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const choisis = [];
  cats.forEach(cat => {
    const candidats = recettes
      .filter(r => r.categorie === cat && !exclure.includes(r.id) && recetteFaisable(r, possedes))
      .filter(r => !styles.length || styles.includes(r.style))
      .filter(r => !r.ingredients.some(i => !i.optionnel && refusePar(i.nom, mangeurs).length && !(i.remplacements || []).length))
      .map(r => ({ r, c: couverture(db, r, personnes, reste) }))
      .sort((a, b) => b.c.score - a.c.score || a.c.manquants.length - b.c.manquants.length);
    if (!candidats.length) return;
    const top = candidats.filter(x => x.c.score >= candidats[0].c.score - 0.05).slice(0, 12);
    const pick = top[Math.floor(alea() * top.length)];
    choisis.push({ recette: pick.r, score: pick.c.score, manquants: pick.c.manquants });
    consommer(reste, pick.c.lignes);
  });
  return choisis;
}

// ---------------------------------------------------------------------------
// Remplacements proposés pour un ingrédient (ceux de la recette + génériques), en stock d'abord
// ---------------------------------------------------------------------------
export function remplacementsPour(db, ing, mangeurs = []) {
  const k = cleDans(SUBSTITUTIONS, ing.nom);
  const brut = [...(ing.remplacements || []), ...(k ? SUBSTITUTIONS[k] : [])];
  const vus = new Set([norm(ing.nom)]);
  return brut.filter(n => { const x = norm(n); if (vus.has(x)) return false; vus.add(x); return true; })
    .map(nom => {
      const p = trouverProduit(db.produits, nom, db.liens);
      const enStock = !!(p && p.suivi && p.stock > 0);
      return { nom, produit: p, enStock, refuse: refusePar(nom, mangeurs) };
    })
    .filter(x => !x.refuse.length)
    .sort((a, b) => Number(b.enStock) - Number(a.enStock));
}

// ---------------------------------------------------------------------------
// Après la cuisson : ce qu'il faut retirer du stock
// ---------------------------------------------------------------------------
export function decomptes(lignes) {
  return lignes
    .filter(l => l.produit && l.produit.suivi && (l.besoins || []).length)
    .map(l => {
      const p = l.produit;
      let retire = null;
      if (l.besoinVal && l.besoinDim) {
        const u = versUnitesStock(p, l.besoinDim, l.besoinVal);
        if (u !== null) retire = arrondi(u, 2);
      }
      const avant = Number(p.stock) || 0;
      return {
        produitId: p.id, nom: p.nom, unite: p.unite || '', avant,
        retire: retire === null ? 0 : retire,
        apres: arrondi(Math.max(0, avant - (retire || 0)), 2),
        aEstimer: retire === null, besoinTexte: l.besoinTexte,
      };
    });
}

// ---------------------------------------------------------------------------
// Planning : tout est prêt à l'heure de service, avec les alertes de conflit
// ---------------------------------------------------------------------------
const MULTI = { plaque: 4, aucun: 99 };
const hhmm = m => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}h${String(x % 60).padStart(2, '0')}`; };
export function planifier(items, heureService, possedes) {
  const [h, mi] = String(heureService || '19:30').split(':').map(Number);
  const service = (h || 0) * 60 + (mi || 0);
  const evts = [];
  const alertes = [];
  items.forEach(it => {
    const r = it.recette; if (!r) return;
    const v = r.variantes[it.variante || 0] || r.variantes[0];
    const etapes = v.etapes.length ? v.etapes : [{ texte: 'Préparation et cuisson', duree_min: dureeVariante(r, v) || 30, surveillance: 'faible', appareil: v.appareils[0] }];
    const total = etapes.reduce((s, e) => s + (num(e.duree_min) || 5), 0);
    const avance = r.categorie === 'dessert' && etapes.some(e => /frais|r[ée]frig|repos|refroidi/i.test(e.texte)) ? 120 : 0;
    let t = service - total - avance;
    etapes.forEach(e => {
      const d = num(e.duree_min) || 5;
      evts.push({ debut: t, fin: t + d, recette: r.titre, texte: e.texte, appareil: e.appareil, surveillance: e.surveillance });
      t += d;
    });
    v.appareils.filter(a => !possedes.has(a)).forEach(a => alertes.push(`« ${r.titre} » demande un appareil que tu n’as pas encore coché (${a}).`));
  });
  evts.sort((a, b) => a.debut - b.debut);
  // Conflits : même appareil occupé deux fois, ou deux tâches à surveiller en même temps
  for (let i = 0; i < evts.length; i++) {
    for (let j = i + 1; j < evts.length; j++) {
      const a = evts[i]; const b = evts[j];
      if (b.debut >= a.fin || a.recette === b.recette) continue;
      if (a.appareil === b.appareil && a.appareil && !MULTI[a.appareil]) {
        alertes.push(`${hhmm(b.debut)} : « ${a.recette} » et « ${b.recette} » utilisent tous les deux ${a.appareil} (vérifie que les deux tiennent en même temps et à la même température).`);
      }
      if (a.surveillance === 'forte' && b.surveillance === 'forte') {
        alertes.push(`${hhmm(b.debut)} : deux tâches à surveiller en même temps (« ${a.recette} » et « ${b.recette} ») — répartissez-vous les rôles ou décale l’une des deux.`);
      }
    }
  }
  return { service: hhmm(service), evenements: evts.map(e => ({ ...e, heure: hhmm(e.debut) })), alertes: [...new Set(alertes)] };
}

// ---------------------------------------------------------------------------
// Consigne à donner à une IA (Claude, ChatGPT, Gemini…) pour convertir une recette au format de l'appli
// ---------------------------------------------------------------------------
export const SOURCES_IMPORT = [
  {
    id: 'photo', emoji: '📸', nom: 'Photo d’une recette papier', sub: 'carnet, fiche, livre, recette manuscrite',
    conseils: [
      'Pose la recette bien à plat, près d’une fenêtre ou sous une bonne lumière, sans flash.',
      'Cadre toute la recette (titre, ingrédients ET étapes) : rien ne doit être coupé.',
      'Tiens le téléphone bien parallèle à la feuille pour éviter les déformations.',
      'Recette sur plusieurs pages : une photo par page, envoyées ensemble dans le même message.',
      'Écriture difficile à lire : prends une photo plus rapprochée de la partie concernée.',
    ],
    texte: 'la recette qui se trouve sur la ou les photos jointes (recette papier ou manuscrite)',
  },
  {
    id: 'ecran', emoji: '🖥️', nom: 'Capture d’écran ou texte tapé', sub: 'site web, message, note du téléphone',
    conseils: [
      'Capture d’écran : fais défiler pour que les ingrédients et les étapes apparaissent (plusieurs captures si besoin).',
      'Texte : copie-colle la recette entière juste après la consigne, dans le même message.',
      'Site web : tu peux aussi coller simplement le lien de la page si ton IA sait lire les sites.',
    ],
    texte: 'la recette que je colle ou que je joins juste après cette consigne (texte, capture d’écran ou lien)',
  },
  {
    id: 'fichier', emoji: '📄', nom: 'Fichier (PDF, Word…)', sub: 'document sur l’ordinateur ou le téléphone',
    conseils: [
      'Joins le fichier PDF ou Word directement au message, avec la consigne.',
      'Fichier avec plusieurs recettes : l’IA peut toutes les convertir d’un coup (tableau de recettes).',
      'Fichier scanné de mauvaise qualité : préfère une photo nette de chaque page.',
    ],
    texte: 'la ou les recettes contenues dans le fichier joint',
  },
  {
    id: 'idee', emoji: '💡', nom: 'Une idée de recette', sub: 'l’IA l’invente pour toi',
    conseils: [
      'Écris ton envie juste après la consigne : « un plat de poisson pour 5 au Companion », « un dessert avec 4 pommes »…',
      'Précise ce que tu as sous la main si tu veux utiliser ton stock.',
    ],
    texte: 'une recette originale correspondant à la demande que j’écris juste après cette consigne',
  },
];

export function consigneIA(db, sourceId = 'photo', precision = '') {
  const src = SOURCES_IMPORT.find(s => s.id === sourceId) || SOURCES_IMPORT[0];
  const apps = appareilsDu(db).filter(a => !a.toujours);
  const mangeurs = mangeursDu(db);
  const exclus = [...new Set(mangeurs.flatMap(m => m.exclus || []))];
  const exemple = {
    titre: 'Poulet basquaise',
    categorie: 'plat',
    style: 'quotidien',
    origine: 'France',
    tags: ['viande', 'economique'],
    personnes: 5,
    preparation_min: 20,
    difficulte: 1,
    emoji: '🍗',
    ingredients: [
      { nom: 'cuisses de poulet', qte: 5, unite: 'pièce', remplacements: ['hauts de cuisse', 'filets de dinde'] },
      { nom: 'poivrons', qte: 3, unite: 'pièce', remplacements: ['courgettes'] },
      { nom: 'tomates concassées', qte: 400, unite: 'g', remplacements: ['coulis de tomate'] },
      { nom: 'piment d’Espelette', qte: 1, unite: 'pincée', remplacements: ['paprika'], optionnel: true },
    ],
    variantes: [
      {
        appareils: ['plaque'], cuisson_min: 45, nom: 'À la sauteuse',
        etapes: [
          { texte: 'Faire dorer les cuisses de poulet dans la sauteuse avec un filet d’huile.', duree_min: 10, surveillance: 'forte', appareil: 'plaque' },
          { texte: 'Ajouter les poivrons et les tomates, couvrir et laisser mijoter à feu doux.', duree_min: 40, surveillance: 'faible', appareil: 'plaque' },
        ],
      },
      {
        appareils: ['cookeo'], cuisson_min: 25, nom: 'Au Cookeo',
        etapes: [
          { texte: 'Mode Dorer : faire dorer le poulet 5 min.', duree_min: 5, surveillance: 'forte', appareil: 'cookeo' },
          { texte: 'Ajouter le reste, fermer et lancer la cuisson sous pression 15 min.', duree_min: 20, surveillance: 'aucune', appareil: 'cookeo' },
        ],
      },
    ],
    astuce: 'Encore meilleur réchauffé le lendemain.',
  };
  return [
    'Tu es mon assistant de cuisine. Convertis ' + src.texte + ' au format JSON de mon application « Courses Pro » (onglet Recettes).',
    precision ? `Précision : ${precision.trim()}` : '',
    '',
    'RÈGLES À RESPECTER',
    '1. Réponds UNIQUEMENT avec le JSON, dans un seul bloc ```json … ```, sans texte avant ni après.',
    '2. Plusieurs recettes : renvoie un tableau [ {…}, {…} ].',
    '3. Recopie fidèlement la recette (quantités, étapes). Si une quantité est illisible, mets "qte": null et signale-le dans "astuce". N’invente rien pour une recette existante.',
    '4. Quantités pour le nombre de personnes de "personnes". "qte" est un nombre (0.5 et pas « 1/2 »).',
    `5. "unite" parmi : ${UNITES_RECETTE.filter(Boolean).map(u => `"${u}"`).join(', ')} ou "" (au goût).`,
    '6. Pour chaque ingrédient, propose 1 à 3 "remplacements" réalistes ; "optionnel": true pour ce qui est facultatif.',
    '7. Découpe la préparation en étapes courtes avec "duree_min" (minutes), "surveillance" ("aucune" = ça cuit seul, "faible" = de temps en temps, "forte" = il faut rester à côté) et "appareil".',
    `8. "appareil" / "appareils" parmi ces identifiants (ma cuisine) : ${apps.map(a => `"${a.id}" (${a.nom}${a.possede ? '' : ', pas encore acheté'})`).join(', ')}, "aucun" (sans cuisson).`,
    '9. "variantes" : la version d’origine, PUIS une variante par appareil de ma cuisine qui convient bien (ex. Companion, Cookeo, Actifry, plancha, barbecue), avec des temps adaptés à cet appareil.',
    `10. "categorie" parmi : ${CATS_RECETTE.map(c => `"${c.id}"`).join(', ')}. "style" parmi : "quotidien", "festif", "monde" (avec "origine" : pays ou région).`,
    `11. "tags" parmi : ${TAGS.map(t => `"${t.id}"`).join(', ')}. "difficulte" : 1 (facile) à 3 (difficile).`,
    exclus.length ? `12. Chez nous on ne mange pas : ${exclus.join(', ')}. S’ils sont dans la recette, garde-les mais propose de bons remplacements.` : '',
    '',
    'EXEMPLE DU FORMAT ATTENDU',
    '```json',
    JSON.stringify(exemple, null, 2),
    '```',
  ].filter(l => l !== '').join('\n').replace(/\n(RÈGLES|EXEMPLE)/g, '\n\n$1');
}

// ---------------------------------------------------------------------------
// Saisie manuelle : « 500 g de pâtes », « 2 oignons », « 1 c. à soupe d'huile », « sel »
// ---------------------------------------------------------------------------
const MOTS_UNITE = ['c. à soupe', 'c. a soupe', 'cuillères à soupe', 'cuillère à soupe', 'cuil. à soupe', 'c.à.s', 'cas', 'c. à café', 'c. a cafe', 'cuillères à café', 'cuillère à café', 'c.à.c', 'cac',
  'kg', 'g', 'gr', 'grammes', 'mg', 'ml', 'cl', 'dl', 'l', 'litres', 'litre', 'pincées', 'pincée', 'gousses', 'gousse', 'tranches', 'tranche', 'bottes', 'botte', 'brins', 'brin',
  'feuilles', 'feuille', 'boîtes', 'boîte', 'boites', 'boite', 'sachets', 'sachet', 'paquets', 'paquet', 'pots', 'pot', 'rouleaux', 'rouleau', 'verres', 'verre', 'bols', 'bol', 'pièces', 'pièce'];
const echapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE_ING = new RegExp(`^\\s*(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?)?\\s*(${MOTS_UNITE.map(echapper).join('|')})?\\.?\\s+(?:de |d'|d’|du |des )?(.+)$`, 'i');
export function lireLigneIngredient(ligne) {
  let l = String(ligne || '').replace(/^[\s\-•*–]+/, '').trim();
  if (!l) return null;
  let optionnel = false;
  if (/\((facultatif|optionnel)\)|\bfacultatif\b/i.test(l)) { optionnel = true; l = l.replace(/\(?(facultatif|optionnel)\)?/i, '').trim(); }
  const morceaux = l.split(/\s+ou\s+/i);
  const base = morceaux[0];
  const rempl = morceaux.slice(1).join(';');
  const m = (' ' + base).match(RE_ING);
  const remplacements = rempl.split(';').map(s => s.trim()).filter(Boolean);
  if (m && (m[1] || m[2])) return { nom: m[3].trim(), qte: num(m[1]), unite: uniteStd(m[2] || (m[1] ? 'pièce' : '')), remplacements, optionnel };
  return { nom: base.trim(), qte: null, unite: '', remplacements, optionnel };
}
export const ligneIngredient = i => [afficherQte(i.qte, i.unite), i.nom].filter(Boolean).join(' ') + ((i.remplacements || []).length ? ' ou ' + i.remplacements.join(' ou ') : '') + (i.optionnel ? ' (facultatif)' : '');
// « Faire dorer… (10 min) » → texte + durée
export function lireLigneEtape(ligne, appareilDef) {
  let t = String(ligne || '').replace(/^[\s\-•*–]*(\d+[.)]\s*)?/, '').trim();
  if (!t) return null;
  let duree = null;
  const m = t.match(/\(?\s*(\d+)\s*(min|minutes|mn|h)\s*\)?\s*$/i);
  if (m) { duree = Number(m[1]) * (/^h/i.test(m[2]) ? 60 : 1); t = t.slice(0, m.index).trim(); }
  return { texte: t, duree_min: duree, surveillance: 'faible', appareil: appareilDef };
}

// Texte lisible pour WhatsApp
export function texteRecette(r, personnes, varianteIdx = 0) {
  const k = (personnes || r.personnes) / r.personnes;
  const v = r.variantes[varianteIdx] || r.variantes[0];
  return [
    `${r.emoji || '🍽️'} *${r.titre}* (${personnes || r.personnes} pers.)`,
    '',
    '*Ingrédients*',
    ...r.ingredients.map(i => '• ' + [afficherQte(num(i.qte) === null ? null : num(i.qte) * k, i.unite), i.nom].filter(Boolean).join(' ') + (i.optionnel ? ' (facultatif)' : '')),
    '',
    `*Préparation${v.nom ? ' — ' + v.nom : ''}*`,
    ...v.etapes.map((e, n) => `${n + 1}. ${e.texte}${e.duree_min ? ` (${e.duree_min} min)` : ''}`),
    r.astuce ? '\n💡 ' + r.astuce : '',
    '',
    '— envoyé depuis Courses Pro',
  ].join('\n');
}
