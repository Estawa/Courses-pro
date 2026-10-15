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

  const [magasinsRecus, setMagasinsRecus] = useState(!foyerId);

  useEffect(() => {
    try { localStorage.setItem(cleCache(foyerId), JSON.stringify(db)); } catch { /* ignore */ }
    copieDuJour(foyerId, db);
  }, [db, foyerId]);

  // Synchro temps réel
  useEffect(() => {
    if (!foyerId) return undefined;
    return cloud.ecouter(foyerId, (cle, val, depuisServeur) => {
      const n = { ...ref.current };
      if (cle === '_reglages') n.reglages = { ...n.reglages, budget: val.budget || 0 };
      else n[cle] = VALIDE[cle] ? val.filter(VALIDE[cle]) : val;
      if (cle === 'magasins' && depuisServeur) setMagasinsRecus(true);
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
  // Ajouts ponctuels demandés (rayons…), faits une seule fois pour tout le foyer
  useEffect(() => {
    if (!magasinsRecus) return;
    const d = structuredClone(ref.current);
    if (appliquerAjouts(d)) appliquer(d);
  }, [magasinsRecus, appliquer]);

  return [db, maj, remplacer];
}

// Documents incomplets (supprimés sur un téléphone pendant qu'un autre les modifiait) : ignorés
const VALIDE = {
  produits: p => !!p.nom,
  magasins: m => !!m.nom && Array.isArray(m.rayons),
  liste: i => !!i.produitId,
  listes: l => !!l.nom && Array.isArray(l.items),
  achats: a => !!a.date,
};

// ---- Sauvegardes automatiques sur ce téléphone (une par jour, 10 derniers jours) ----
const CLE_COPIES = foyerId => cleCache(foyerId) + '-copies';
export function copiesAuto(foyerId) {
  try { return JSON.parse(localStorage.getItem(CLE_COPIES(foyerId)) || '[]'); } catch { return []; }
}
function copieDuJour(foyerId, db) {
  try {
    if (!db.magasins?.length) return;
    const jour = new Date().toISOString().slice(0, 10);
    const copies = copiesAuto(foyerId);
    if (copies.some(c => c.jour === jour)) return;
    const { _foyer, _membres, ...donnees } = db; // eslint-disable-line no-unused-vars
    copies.unshift({ jour, donnees });
    localStorage.setItem(CLE_COPIES(foyerId), JSON.stringify(copies.slice(0, 10)));
  } catch { /* stockage plein : tant pis pour la copie */ }
}

// ---- Ajouts ponctuels ----
const AJOUTS = [
  {
    id: 'rayons-bio-apero-2026-10',
    rayons: [
      { nom: 'Bio Legumes - Fruits', emoji: '🥬' },
      { nom: 'Bio Conserves', emoji: '🥫' },
      { nom: 'Bio Jus', emoji: '🧃' },
      { nom: 'Bio Frais', emoji: '🌿' },
      { nom: 'Bio Crèmerie', emoji: '🥛' },
      { nom: 'Bio Sauces', emoji: '🫙' },
      { nom: 'Apero', emoji: '🥨' },
    ],
  },
];
const normNom = t => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Ajoute les rayons au magasin principal (celui utilisé, sinon le favori), sans toucher
// aux rayons, articles, liste, stock ou dépenses existants. Renvoie true si modifié.
export function appliquerAjouts(d) {
  if (!d.magasins?.length) return false;
  let modifie = false;
  AJOUTS.forEach(a => {
    if (d.magasins.some(m => (m.ajouts || []).includes(a.id))) return;
    const mag = d.magasins.find(m => m.id === d.magasinActif) || d.magasins.find(m => m.favori) || d.magasins[0];
    a.rayons.forEach(r => {
      if (mag.rayons.some(x => normNom(x.nom) === normNom(r.nom))) return;
      mag.rayons.push({ id: uid(), nom: r.nom, emoji: r.emoji, repere: '', cats: [] });
    });
    mag.ajouts = [...(mag.ajouts || []), a.id];
    modifie = true;
  });
  return modifie;
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
