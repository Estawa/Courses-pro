import { useCallback, useEffect, useState } from 'react';
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

function charger() {
  try {
    const brut = localStorage.getItem(KEY);
    if (brut) {
      const d = JSON.parse(brut);
      if (d && d.produits && d.magasins) return { ...dbInitiale(), ...d, reglages: { ...dbInitiale().reglages, ...d.reglages } };
    }
  } catch { /* stockage indisponible */ }
  return dbInitiale();
}

export function useDb() {
  const [db, setDb] = useState(charger);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ }
  }, [db]);
  const maj = useCallback(fn => setDb(prev => { const d = structuredClone(prev); fn(d); return d; }), []);
  return [db, maj, setDb];
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
