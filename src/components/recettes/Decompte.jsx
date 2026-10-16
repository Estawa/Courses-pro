import { useMemo, useState } from 'react';
import Icon from '../icons.jsx';
import { Sheet } from '../ui.jsx';
import { decomptes } from '../../lib/recettes.js';
import { ajouterALaListe } from '../../lib/store.js';
import { aujourdhui } from '../../lib/utils.js';
import { majAvis } from './commun.jsx';

// « On a cuisiné » : on retire du stock ce que la ou les recettes ont utilisé (modifiable avant de valider),
// puis on propose de racheter ce qui passe sous le seuil.
export default function Decompte({ lignes, recettes, db, maj, toast, onClose, onFini }) {
  const depart = useMemo(() => decomptes(lignes), [lignes]);
  const [rows, setRows] = useState(() => depart.map(r => ({ ...r, garder: true })));
  const [fini, setFini] = useState(null); // produits à racheter après validation
  const set = (i, k, v) => setRows(rs => rs.map((r, n) => (n === i ? { ...r, [k]: v } : r)));
  const pas = r => (Number.isInteger(r.avant) && Number.isInteger(r.retire) ? 1 : 0.25);

  const valider = () => {
    let bas = [];
    maj(d => {
      rows.filter(r => r.garder).forEach(r => {
        const p = d.produits.find(x => x.id === r.produitId);
        if (p) p.stock = Math.max(0, Math.round(Number(r.apres) * 100) / 100);
      });
      recettes.forEach(id => majAvis(d, id, a => { a.faite = (a.faite || 0) + 1; a.derniere = aujourdhui(); }));
      const dans = new Set(d.liste.filter(i => !i.coche).map(i => i.produitId));
      bas = d.produits.filter(p => p.suivi && p.stock <= p.min && !dans.has(p.id) && rows.some(r => r.produitId === p.id)).map(p => ({ id: p.id, nom: p.nom, qte: String(Math.max(1, Math.ceil((p.cible || p.min + 1) - p.stock))) }));
    });
    toast('Stock mis à jour 📦');
    if (bas.length) setFini(bas); else { onFini?.(); onClose(); }
  };
  const racheter = () => {
    maj(d => fini.forEach(p => ajouterALaListe(d, p.nom, p.qte)));
    toast(`${fini.length} article${fini.length > 1 ? 's' : ''} ajouté${fini.length > 1 ? 's' : ''} à la liste 🛒`);
    onFini?.(); onClose();
  };

  if (fini) {
    return (
      <Sheet open onClose={() => { onFini?.(); onClose(); }} title="🔔 À racheter">
        <p className="muted small">Ces produits sont passés sous leur seuil d’alerte après la cuisson :</p>
        <div className="card list-card">
          {fini.map(p => <div key={p.id} className="stock-row"><span className="grow"><b>{p.nom}</b></span><span className="qte-badge">{p.qte}</span></div>)}
        </div>
        <button className="btn btn-big btn-main" onClick={racheter}><Icon name="cart" /> Ajouter à ma liste de courses</button>
        <button className="btn btn-ghost" onClick={() => { onFini?.(); onClose(); }}>Pas maintenant</button>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="👩‍🍳 Mettre à jour le stock" footer={<button className="btn btn-big btn-main" onClick={valider}>✅ Valider et mettre à jour le stock</button>}>
      <p className="muted small">Vérifie avant d’appliquer : voici ce que la cuisine a utilisé et le stock qui restera. Ajuste avec − / + si tu as pris un peu plus ou un peu moins, décoche ce que tu n’as pas utilisé. Rien n’est modifié tant que tu n’as pas validé.</p>
      {rows.length === 0 && <p className="muted small center">Aucun ingrédient de la recette n’est suivi dans ton stock maison (onglet Maison) : rien à décompter.</p>}
      <div className="card list-card">
        {rows.map((r, i) => (
          <div key={r.produitId} className={'stock-row' + (r.aEstimer ? ' bas' : '') + (r.garder ? '' : ' off')}>
            <button className={'check' + (r.garder ? ' on' : '')} onClick={() => set(i, 'garder', !r.garder)} aria-label="Décompter">{r.garder && <Icon name="check" size={16} />}</button>
            <span className="grow">
              <b>{r.nom}</b>
              <span className="muted small block">{r.aEstimer ? `⚠️ À estimer (recette : ${r.besoinTexte})` : `Utilisé : ${r.besoinTexte}`}</span>
              <span className="small block">Stock : {r.avant}{r.unite ? ' ' + r.unite : ''} → <b>{r.garder ? r.apres : r.avant}{r.unite ? ' ' + r.unite : ''}</b></span>
            </span>
            <div className="stepper">
              <button onClick={() => set(i, 'apres', Math.max(0, Math.round((Number(r.apres) - pas(r)) * 100) / 100))} aria-label="Moins"><Icon name="minus" size={18} /></button>
              <span className="stepper-val">{r.apres}</span>
              <button onClick={() => set(i, 'apres', Math.round((Number(r.apres) + pas(r)) * 100) / 100)} aria-label="Plus"><Icon name="plus" size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
