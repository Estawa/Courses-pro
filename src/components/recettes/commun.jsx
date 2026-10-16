import { useEffect, useMemo, useState } from 'react';
import { catalogue } from '../../data/recettes/index.js';
import { ETATS, afficherQte } from '../../lib/recettes.js';
import { lirePhoto } from '../../lib/photos.js';
import { eurosTxt } from '../../lib/nutrition.js';

// Toutes les recettes : catalogue intégré + recettes perso / importées (une recette perso
// qui porte le même identifiant qu'une recette du catalogue la remplace)
export function useRecettes(db) {
  return useMemo(() => {
    const perso = (db.recettes || []).map(r => ({ ...r, source: r.source || 'perso' }));
    const ids = new Set(perso.map(r => r.id));
    return [...catalogue().filter(r => !ids.has(r.id)), ...perso];
  }, [db.recettes]);
}
export function useAvis(db) {
  return useMemo(() => new Map((db.avis || []).map(a => [a.id, a])), [db.avis]);
}
export const foyerDe = db => db._foyer?.id || null;

// Met à jour (ou crée) l'avis d'une recette. À appeler dans maj().
export function majAvis(d, id, fn) {
  if (!d.avis) d.avis = [];
  let a = d.avis.find(x => x.id === id);
  if (!a) { a = { id, note: 0, commentaire: '', faite: 0 }; d.avis.push(a); }
  fn(a);
}

// Note d'une recette : moyenne des notes sur 10 données par chaque personne qui y a goûté.
// (les anciennes étoiles sur 5 comptent comme une note ×2 tant que personne n'a noté sur 10)
export function noteMoyenne(a) {
  const vals = Object.values(a?.notes || {}).filter(n => Number.isFinite(n) && n > 0);
  if (vals.length) return { moy: Math.round(vals.reduce((x, y) => x + y, 0) / vals.length * 10) / 10, nb: vals.length };
  if (a?.note) return { moy: a.note * 2, nb: 0 };
  return null;
}
export const noteTxt = m => (m ? String(m.moy).replace('.', ',') : '');

// Choix d'une note de 1 à 10
export function NoteSur10({ value = 0, onChange }) {
  return (
    <span className="note10" role="radiogroup" aria-label={`Note : ${value || 'aucune'} sur 10`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <button key={n} type="button" className={'note10-b' + (n <= value ? ' on' : '') + (n === value ? ' sel' : '')} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} sur 10`}>{n}</button>
      ))}
    </span>
  );
}

// Pastille de note moyenne
export function BadgeNote({ m, petit }) {
  if (!m) return null;
  return <span className={'badge-note' + (petit ? ' petit' : '')} title={m.nb ? `Moyenne de ${m.nb} note${m.nb > 1 ? 's' : ''}` : 'Ancienne note'}>⭐ {noteTxt(m)}<small>/10</small></span>;
}

// Calories · protéines · coût par portion
export function BadgeNutri({ n, petit, fort }) {
  if (!n) return null;
  const f = k => (fort === k || (k === 'kcal' && fort === 'kcalplus') ? ' fort' : '');
  return (
    <span className={'nutri' + (petit ? ' petit' : '')}>
      <span className={f('kcal')} title="Calories par portion">🔥 {n.kcal} kcal</span>
      <span className={f('prot')} title="Protéines par portion">💪 {n.prot} g</span>
      <span className={f('cout')} title="Coût estimé par portion">💶 {eurosTxt(n.cout)}</span>
    </span>
  );
}

export function Etoiles({ value = 0, onChange, size = 22 }) {
  return (
    <span className="etoiles" role={onChange ? 'radiogroup' : undefined} aria-label={`Note : ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map(n => (
        onChange
          ? <button key={n} type="button" className={'etoile' + (n <= value ? ' on' : '')} style={{ fontSize: size }} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} étoile${n > 1 ? 's' : ''}`}>★</button>
          : <span key={n} className={'etoile' + (n <= value ? ' on' : '')} style={{ fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export function BadgeEtat({ etat }) {
  const e = ETATS[etat] || ETATS.nonsuivi;
  return <span className={'etat etat-' + etat}>{e.emoji} {e.txt}</span>;
}

export const surveillanceTxt = s => (s === 'aucune' ? '😴 tourne seul' : s === 'forte' ? '🔥 rester à côté' : '👀 de temps en temps');
export const dureeTxt = m => (!m ? '' : m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${Math.round(m)} min`);
export const qteIng = (i, k = 1) => afficherQte(i.qte === null || i.qte === undefined ? null : Number(i.qte) * k, i.unite);

// Photo d'une recette (chargée depuis le téléphone, ou depuis le foyer)
export function usePhoto(db, id, aPhoto) {
  const [url, setUrl] = useState(null);
  const foyer = foyerDe(db);
  useEffect(() => {
    let vivant = true;
    if (!aPhoto) { setUrl(null); return undefined; }
    lirePhoto(foyer, id).then(u => { if (vivant) setUrl(u); });
    return () => { vivant = false; };
  }, [foyer, id, aPhoto]);
  return [url, setUrl];
}

// Partage d'un texte (WhatsApp, Claude, ChatGPT…) ; repli : copie dans le presse-papiers
export async function partagerTexte(texte, toast, titre = 'Courses Pro') {
  try {
    if (navigator.share) { await navigator.share({ title: titre, text: texte }); return true; }
  } catch (e) { if (e?.name === 'AbortError') return false; }
  try { await navigator.clipboard.writeText(texte); toast?.('Copié dans le presse-papiers 📋'); return true; } catch { /* */ }
  toast?.('Partage impossible sur ce téléphone 😕');
  return false;
}
export async function copierTexte(texte, toast, msg = 'Copié 📋') {
  try { await navigator.clipboard.writeText(texte); toast?.(msg); return true; } catch {
    const t = document.createElement('textarea'); t.value = texte; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); toast?.(msg); return true; } catch { toast?.('Copie impossible 😕'); return false; } finally { t.remove(); }
  }
}
export function telechargerFichier(nom, contenu, type = 'application/json') {
  const blob = new Blob([contenu], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
