// Photos des recettes : gardées hors de la base principale pour ne pas l'alourdir.
// - Toujours rangées dans le téléphone (IndexedDB), donc visibles hors connexion.
// - Dans le foyer familial, aussi envoyées dans Firebase pour être vues sur tous les téléphones.
import { cloud } from './cloud.js';

const DB = 'courses-pro-photos';
let ouverture;
function base() {
  if (!ouverture) {
    ouverture = new Promise((ok, ko) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  }
  return ouverture;
}
const cle = (foyerId, id) => (foyerId || 'local') + ':' + id;
async function lireLocal(k) {
  try {
    const d = await base();
    return await new Promise(ok => { const r = d.transaction('photos').objectStore('photos').get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
  } catch { return null; }
}
async function ecrireLocal(k, v) {
  try {
    const d = await base();
    await new Promise(ok => { const t = d.transaction('photos', 'readwrite'); v ? t.objectStore('photos').put(v, k) : t.objectStore('photos').delete(k); t.oncomplete = ok; t.onerror = ok; });
  } catch { /* stockage indisponible */ }
}

export async function lirePhoto(foyerId, id) {
  const local = await lireLocal(cle(foyerId, id));
  if (local || !foyerId) return local;
  try {
    const distant = await cloud.lirePhoto(foyerId, id);
    if (distant) await ecrireLocal(cle(foyerId, id), distant);
    return distant;
  } catch { return null; }
}

export async function enregistrerPhoto(foyerId, id, dataUrl) {
  await ecrireLocal(cle(foyerId, id), dataUrl);
  if (foyerId) await cloud.ecrirePhoto(foyerId, id, dataUrl);
}

// Réduit une photo (max 900 px, JPEG) pour qu'elle reste légère (≈ 80-150 Ko)
export function compresserPhoto(fichier, max = 900, qualite = 0.72) {
  return new Promise((ok, ko) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let q = qualite; let url = c.toDataURL('image/jpeg', q);
        while (url.length > 700000 && q > 0.35) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
        ok(url);
      };
      img.onerror = () => ko(new Error('Image illisible'));
      img.src = lecteur.result;
    };
    lecteur.onerror = () => ko(new Error('Fichier illisible'));
    lecteur.readAsDataURL(fichier);
  });
}
