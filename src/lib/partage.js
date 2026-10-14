// Partage de l'organisation d'un magasin (rayons + articles placés) par lien / message WhatsApp.
// Format : "CP1" + base64url(deflate(JSON))  (ou "CP0" + base64url(JSON) si la compression n'existe pas)
import { CATEGORIES } from '../data/defaults.js';
import { categorie } from './utils.js';

const versB64u = bytes => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const depuisB64u = s => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const viaFlux = async (bytes, flux) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(flux)).arrayBuffer());

export async function encoder(obj) {
  const brut = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    try { return 'CP1' + versB64u(await viaFlux(brut, new CompressionStream('deflate-raw'))); } catch { /* repli */ }
  }
  return 'CP0' + versB64u(brut);
}

// Cherche un code d'organisation dans n'importe quel texte (lien, message WhatsApp collé…)
export const trouverCode = texte => (String(texte || '').match(/CP[01][A-Za-z0-9_-]{20,}/) || [null])[0];

export async function decoder(texte) {
  const code = trouverCode(texte);
  if (!code) throw new Error('Aucune organisation de magasin trouvée dans ce message.');
  let bytes = depuisB64u(code.slice(3));
  if (code[2] === '1') {
    if (typeof DecompressionStream === 'undefined') throw new Error('Ce téléphone est trop ancien pour lire ce partage.');
    bytes = await viaFlux(bytes, new DecompressionStream('deflate-raw'));
  }
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (!d || !Array.isArray(d.r || d.rayons)) throw new Error('Organisation illisible.');
  return normaliser(d);
}

const CAT_IDS = new Set(CATEGORIES.map(c => c.id));

// Forme compacte transmise
export function exporterMagasin(mag, produits) {
  const byId = Object.fromEntries(produits.map(p => [p.id, p]));
  return {
    v: 1, n: mag.nom, e: mag.emoji, c: mag.couleur,
    r: mag.rayons.map(r => ({
      n: r.nom, e: r.emoji, p: r.repere || '', c: r.cats,
      a: Object.entries(mag.overrides || {})
        .filter(([pid, rid]) => rid === r.id && byId[pid])
        .map(([pid]) => [byId[pid].nom, byId[pid].emoji || '', byId[pid].cat]),
    })),
  };
}

// Forme de travail (aperçu modifiable)
function normaliser(d) {
  let k = 0;
  return {
    nom: String(d.n || 'Magasin partagé').slice(0, 60),
    emoji: d.e || '🏪',
    couleur: /^#[0-9A-Fa-f]{6}$/.test(d.c) ? d.c : '#D6E4FF',
    rayons: (d.r || d.rayons || []).slice(0, 200).map(r => ({
      cle: 'r' + k++,
      garder: true,
      nom: String(r.n || 'Rayon').slice(0, 60),
      emoji: r.e || '📍',
      repere: String(r.p || '').slice(0, 60),
      cats: (r.c || []).filter(c => CAT_IDS.has(c)),
      articles: (r.a || []).slice(0, 300).map(a => ({ nom: String(a[0]).slice(0, 60), emoji: a[1] || '', cat: CAT_IDS.has(a[2]) ? a[2] : 'autre' })),
    })),
  };
}

export function messagePartage(mag, code) {
  const parcours = mag.rayons.map((r, i) => `${i + 1}. ${r.nom}`).join(' → ');
  return {
    texte: `🛒 Organisation du magasin « ${mag.nom} » (${mag.rayons.length} rayons), partagée avec Courses Pro.\n\n${parcours}\n\nOuvre le lien pour la voir et l'importer (ou copie ce message et colle-le dans Courses Pro > Magasins > Importer) :`,
    url: `${window.location.origin}/?magasin=${code}`,
  };
}

export const nomCategorie = id => categorie(id).nom;
