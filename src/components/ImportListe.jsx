import { useEffect, useMemo, useState } from 'react';
import Icon from './icons.jsx';
import { Sheet, Toggle } from './ui.jsx';
import { ajouterALaListe } from '../lib/store.js';
import { findProduit, norm, parseTexte, uid } from '../lib/utils.js';
import { trouverCode } from '../lib/partage.js';

// Analyse une liste reçue : ce qui est à ajouter, déjà à la maison, ou déjà sur la liste
export function analyser(db, lignes) {
  const dansListe = new Set(db.liste.filter(i => !i.coche).map(i => i.produitId));
  const vus = new Set();
  return lignes.map((l, k) => {
    const p = findProduit(db.produits, l.nom);
    const cle = p ? p.id : norm(l.nom);
    let statut = 'ajout';
    if (vus.has(cle) || (p && dansListe.has(p.id))) statut = 'doublon';
    else if (p && p.suivi && p.stock > 0) statut = 'stock';
    vus.add(cle);
    return { k, ...l, p, statut };
  });
}

export default function ImportListe({ open, onClose, db, maj, toast, texteInitial = '', titre = '📝 Coller une liste' }) {
  const [txt, setTxt] = useState(texteInitial);
  const [forces, setForces] = useState({}); // k -> true/false (choix manuel)
  const [enreg, setEnreg] = useState(false);
  const [nom, setNom] = useState('');

  useEffect(() => { if (open) { setTxt(texteInitial); setForces({}); } }, [open, texteInitial]);

  const estMagasin = !!trouverCode(txt);
  const lignes = useMemo(() => (estMagasin ? [] : parseTexte(txt)), [txt, estMagasin]);
  const analyse = useMemo(() => analyser(db, lignes), [db, lignes]);
  const inclus = a => (a.k in forces ? forces[a.k] : a.statut === 'ajout');
  const choisis = analyse.filter(inclus);
  const groupes = [
    { id: 'ajout', titre: '✨ À ajouter', vide: null },
    { id: 'stock', titre: '🏠 Déjà à la maison', note: 'non importés — touche pour ajouter quand même' },
    { id: 'doublon', titre: '🔁 Déjà sur ta liste', note: 'non importés' },
  ];

  const coller = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setTxt(x => (x ? x + '\n' : '') + t);
      else toast('Presse-papiers vide');
    } catch { toast('Appui long dans la zone de texte → Coller'); }
  };

  const valider = () => {
    if (!choisis.length) return;
    maj(d => {
      choisis.forEach(a => ajouterALaListe(d, a.nom, a.qte));
      if (enreg) d.listes.push({ id: uid(), nom: nom.trim() || 'Liste reçue', emoji: '💬', items: lignes });
    });
    const ignores = analyse.length - choisis.length;
    toast(`${choisis.length} ajouté${choisis.length > 1 ? 's' : ''}${ignores ? ` · ${ignores} ignoré${ignores > 1 ? 's' : ''}` : ''} ✨`);
    setTxt(''); setNom(''); setEnreg(false);
    onClose();
  };

  return (
    <Sheet
      open={open} onClose={onClose} title={titre}
      footer={<button className="btn btn-big btn-main" disabled={!choisis.length} onClick={valider}>Ajouter {choisis.length || ''} article{choisis.length > 1 ? 's' : ''} à ma liste</button>}
    >
      <div className="wa-tip">
        <span className="wa-ico">💬</span>
        <span className="small">
          <b>Reçue sur WhatsApp ?</b> Appui long sur le message → <b>Partager</b> → <b>Courses Pro</b> (Android, appli installée).
          Sur iPhone : <b>Copier</b> le message puis le bouton ci-dessous.
        </span>
      </div>
      <button className="btn btn-soft btn-full" onClick={coller}><Icon name="paste" size={18} /> Coller depuis le presse-papiers</button>
      <textarea className="input textarea" rows={6} value={txt} onChange={e => setTxt(e.target.value)} placeholder={'2 lait\npain\nbananes x6\nlessive'} />

      {estMagasin && <div className="msg msg-ok">🏪 Ce message contient l’organisation d’un magasin : importe-la depuis l’onglet Magasins → Importer.</div>}
      {analyse.length > 0 && groupes.map(g => {
        const items = analyse.filter(a => a.statut === g.id);
        if (!items.length) return null;
        return (
          <div key={g.id} className="import-groupe">
            <div className="import-titre">{g.titre} <span className="muted small">{g.note || ''}</span></div>
            <div className="chips-wrap">
              {items.map(a => {
                const on = inclus(a);
                return (
                  <button key={a.k} className={'chip chip-import' + (on ? ' on' : '')} onClick={() => setForces(f => ({ ...f, [a.k]: !on }))}>
                    {on ? <Icon name="check" size={14} strokeWidth={3} /> : <Icon name="plus" size={14} />}
                    {a.qte && <b>{a.qte}</b>} {a.p?.nom || a.nom}
                    {g.id === 'stock' && <span className="chip-badge">🏠 {a.p.stock}{a.p.unite ? ' ' + a.p.unite : ''}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="toggle-box">
        <Toggle checked={enreg} onChange={setEnreg} label="Enregistrer aussi dans Mes listes" />
        {enreg && <input className="input" placeholder="Nom de la liste" value={nom} onChange={e => setNom(e.target.value)} style={{ marginTop: 8 }} />}
      </div>
    </Sheet>
  );
}
