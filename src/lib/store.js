import { useCallback, useEffect, useRef, useState } from 'react';
import { cloud } from './cloud.js';
import { PRODUITS, rayonsType } from '../data/defaults.js';
import { uid, findProduit, devinerCategorie } from './utils.js';

const KEY = 'courses-pro-v1';

export function dbInitiale() {
  const magId = uid();
  return {
    version: 1,
    produits: PRODUITS.map(p => ({ ...p })),
    magasins: [
      { id: magId, nom: 'Mon supermarché', emoji: '🛒', couleur: '#D4F5DD', favori: true, rayons: rayonsType(uid), overrides: {} },
    ],
    magasinActif: magId,
    liste: [],
    listes: [
      {
        id: uid(), nom: 'Courses de la semaine', emoji: '🧺',
        items: [
          { nom: 'Pain', qte: '' }, { nom: 'Lait', qte: '2' }, { nom: 'Œufs', qte: '1' },
          { nom: 'Bananes', qte: '' }, { nom: 'Yaourts', qte: '2' }, { nom: 'Pâtes', qte: '1' },
        ],
      },
    ],
    achats: [],
    reglages: { theme: 'clair', budget: 0, majStock: true },
  };
}

export const dbVide = () => ({ ...dbInitiale(), produits: [], magasins: [], liste: [], listes: [], achats: [], magasinActif: null });

export const cleCache = foyerId => (foyerId ? 'courses-pro-foyer-' + foyerId : KEY);

export function charger(foyerId) {
  try {
    const brut = localStorage.getItem(cleCache(foyerId));
    if (brut) {
      const d = JSON.parse(brut);
      if (d && d.produits && d.magasins) return { ...dbInitiale(), ...d, reglages: { ...dbInitiale().reglages, ...d.reglages } };
    }
  } catch { /* stockage indisponible */ }
  return foyerId ? dbVide() : dbInitiale();
}

// foyerId = null : mode local (ce téléphone) ; sinon base partagée Firebase du foyer
export function useDb(foyerId, onAccesPerdu) {
  const [db, setDb] = useState(() => charger(foyerId));
  const ref = useRef(db);

  useEffect(() => {
    try { localStorage.setItem(cleCache(foyerId), JSON.stringify(db)); } catch { /* ignore */ }
  }, [db, foyerId]);

  // Synchro temps réel
  useEffect(() => {
    if (!foyerId) return undefined;
    return cloud.ecouter(foyerId, (cle, val) => {
      const n = { ...ref.current };
      if (cle === '_reglages') n.reglages = { ...n.reglages, budget: val.budget || 0 };
      else n[cle] = val;
      ref.current = n;
      setDb(n);
    }, e => { console.error(e); if (e?.code === 'permission-denied') onAccesPerdu?.(); });
  }, [foyerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const appliquer = useCallback(next => {
    const prev = ref.current;
    ref.current = next;
    setDb(next);
    if (foyerId) cloud.pousser(foyerId, prev, next).catch(e => console.error('Synchro', e));
  }, [foyerId]);

  const maj = useCallback(fn => { const d = structuredClone(ref.current); fn(d); appliquer(d); }, [appliquer]);
  const remplacer = useCallback(d => appliquer({ ...ref.current, ...d, _foyer: ref.current._foyer, _membres: ref.current._membres }), [appliquer]);
  return [db, maj, remplacer];
}

// Retrouve un produit par son nom ou le crée (avec catégorie devinée). À appeler dans maj().
export function produitPourNom(d, nom, extra = {}) {
  let p = findProduit(d.produits, nom);
  if (!p) {
    p = { id: uid(), nom: nom.trim(), emoji: '', cat: extra.cat || devinerCategorie(nom), unite: '', suivi: false, stock: 0, min: 1 };
    d.produits.push(p);
  }
  return p;
}

// Ajoute un article à la liste du jour (fusionne si déjà présent et non coché)
export function ajouterALaListe(d, nom, qte = '', extra) {
  const p = produitPourNom(d, nom, extra);
  const deja = d.liste.find(i => i.produitId === p.id && !i.coche);
  if (deja) {
    const a = parseFloat(deja.qte) || (deja.qte ? 0 : 1);
    const b = parseFloat(qte) || 1;
    if (!/[a-z]/i.test(deja.qte + qte)) deja.qte = String(a + b);
    return p;
  }
  d.liste.push({ id: uid(), produitId: p.id, qte: qte || '', coche: false });
  return p;
}
