import { useState } from 'react';
import Icon from '../icons.jsx';
import { Sheet } from '../ui.jsx';
import { mangeursDu } from '../../lib/recettes.js';
import { uid } from '../../lib/utils.js';
import { majAvis, noteMoyenne, noteTxt, NoteSur10 } from './commun.jsx';

// Notes sur 10 : chaque personne qui a goûté note chaque plat ; la note d'un plat est la moyenne.
export default function Notation({ recettes, db, maj, toast, onClose, titre = '⭐ Qui a goûté ?' }) {
  const mangeurs = mangeursDu(db);
  const avisDe = id => (db.avis || []).find(a => a.id === id);
  const [gouteurs, setGouteurs] = useState(() => mangeurs.map(m => m.id));
  const [notes, setNotes] = useState(() => Object.fromEntries(recettes.map(r => [r.id, { ...(avisDe(r.id)?.notes || {}) }])));
  const [nouveau, setNouveau] = useState('');
  const [ajoutes, setAjoutes] = useState([]); // personnes créées ici (pas encore enregistrées)
  const personnes = [...mangeurs, ...ajoutes];
  const choisis = personnes.filter(p => gouteurs.includes(p.id));
  const seulFamille = personnes.length === 1 && personnes[0].id === 'famille';

  const setNote = (rid, pid, n) => setNotes(x => ({ ...x, [rid]: { ...x[rid], [pid]: n } }));
  const ajouter = () => {
    const nom = nouveau.trim();
    if (!nom) return;
    const p = { id: uid(), nom, emoji: '🙂', exclus: [] };
    setAjoutes(a => [...a, p]);
    setGouteurs(g => [...g, p.id]);
    setNouveau('');
  };
  const moyenneDe = rid => {
    const vals = choisis.map(p => notes[rid]?.[p.id]).filter(n => n > 0);
    const autres = Object.entries(notes[rid] || {}).filter(([pid, n]) => n > 0 && !choisis.some(p => p.id === pid)).map(([, n]) => n);
    const tout = [...vals, ...autres];
    return tout.length ? { moy: Math.round(tout.reduce((a, b) => a + b, 0) / tout.length * 10) / 10, nb: tout.length } : null;
  };
  const enregistrer = () => {
    maj(d => {
      if (ajoutes.length) {
        d.mangeurs = structuredClone(mangeursDu(d));
        if (d.mangeurs.length === 1 && d.mangeurs[0].id === 'famille' && !Object.values(notes).some(n => n.famille > 0)) {
          // La « famille » générique est remplacée par les vraies personnes (ses exclusions sont recopiées)
          ajoutes.forEach(p => { p.exclus = [...(d.mangeurs[0].exclus || [])]; });
          d.mangeurs = [];
        }
        d.mangeurs.push(...ajoutes);
      }
      recettes.forEach(r => majAvis(d, r.id, a => {
        const n = {};
        Object.entries(notes[r.id] || {}).forEach(([pid, v]) => { if (v > 0) n[pid] = v; });
        a.notes = n;
        const m = noteMoyenne(a);
        a.note = m ? Math.max(1, Math.round(m.moy / 2)) : 0; // compatibilité (étoiles sur 5)
      }));
    });
    const nb = recettes.filter(r => Object.values(notes[r.id] || {}).some(v => v > 0)).length;
    toast(nb ? `Notes enregistrées pour ${nb} plat${nb > 1 ? 's' : ''} ⭐` : 'Notes enregistrées');
    onClose(true);
  };

  return (
    <Sheet open onClose={() => onClose(false)} title={titre} footer={<button className="btn btn-big btn-main" onClick={enregistrer}>Enregistrer les notes</button>}>
      <p className="muted small">Chacun donne sa note sur 10. La note du plat est la moyenne de toutes les notes.</p>
      <b>👥 Qui a goûté ?</b>
      <div className="chips-wrap">
        {personnes.map(p => (
          <button key={p.id} className={'chip chip-toggle' + (gouteurs.includes(p.id) ? ' on' : '')} style={{ '--c': '#D4F5DD' }}
            onClick={() => setGouteurs(g => (g.includes(p.id) ? g.filter(x => x !== p.id) : [...g, p.id]))}>{p.emoji || '🙂'} {p.nom}</button>
        ))}
      </div>
      {seulFamille && <p className="muted small tip">Ajoute chaque membre de la famille pour que chacun ait sa propre note. Les personnes ajoutées ici apparaissent aussi dans « Ma cuisine ».</p>}
      <div className="row gap">
        <input className="input grow" placeholder="Ajouter une personne" value={nouveau} onChange={e => setNouveau(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ajouter(); }} />
        <button className="btn btn-small btn-main" disabled={!nouveau.trim()} onClick={ajouter} aria-label="Ajouter"><Icon name="plus" size={18} /></button>
      </div>

      {recettes.map(r => {
        const m = moyenneDe(r.id);
        return (
          <div key={r.id} className="card stack-s">
            <div className="row-between"><b>{r.emoji} {r.titre}</b>{m && <span className="badge-note">⭐ {noteTxt(m)}<small>/10</small></span>}</div>
            {choisis.length === 0 && <span className="muted small">Choisis au moins une personne.</span>}
            {choisis.map(p => (
              <div key={p.id} className="note-ligne">
                <span className="note-nom">{p.emoji || '🙂'} {p.nom}</span>
                <NoteSur10 value={notes[r.id]?.[p.id] || 0} onChange={n => setNote(r.id, p.id, n)} />
              </div>
            ))}
          </div>
        );
      })}
    </Sheet>
  );
}
