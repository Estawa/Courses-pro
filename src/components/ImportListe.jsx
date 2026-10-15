import { useEffect, useMemo, useState } from 'react';
import Icon from './icons.jsx';
import { Sheet, Toggle } from './ui.jsx';
import { ajouterALaListe } from '../lib/store.js';
import { findProduit, nomDansTexte, norm, parseTexte, uid } from '../lib/utils.js';
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

export default function ImportListe({ open, onClose, db, maj, toast, texteInitial = '', titre = '📝 Coller une liste', choixDestination = true, destinationDefaut = 'jour' }) {
  const [txt, setTxt] = useState(texteInitial);
  const [forces, setForces] = useState({}); // k -> true/false (choix manuel)
  const [enreg, setEnreg] = useState(false);
  const [nom, setNom] = useState('');
  const [dest, setDest] = useState(destinationDefaut); // 'jour' = liste du jour | 'listes' = Mes listes
  const [remplacer, setRemplacer] = useState(true);

  useEffect(() => {
    if (!open) return;
    setTxt(texteInitial); setForces({}); setDest(destinationDefaut); setRemplacer(true);
    setNom(nomDansTexte(texteInitial));
  }, [open, texteInitial, destinationDefaut]);
  // Nom repéré dans un message collé ensuite
  useEffect(() => { const n = nomDansTexte(txt); if (n) setNom(x => x || n); }, [txt]);

  const estMagasin = !!trouverCode(txt);
  const lignes = useMemo(() => (estMagasin ? [] : parseTexte(txt)), [txt, estMagasin]);
  const analyse = useMemo(() => analyser(db, lignes), [db, lignes]);
  const inclus = a => (a.k in forces ? forces[a.k] : a.statut === 'ajout');
  const choisis = analyse.filter(inclus);
  const existante = nom.trim() ? db.listes.find(l => norm(l.nom) === norm(nom)) : null;
  const versListes = choixDestination && dest === 'listes';
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

  // Enregistre dans « Mes listes » : met à jour la liste du même nom ou en crée une nouvelle
  const enregistrerListe = (d, maj_) => {
    const data = { nom: nom.trim() || 'Liste reçue', items: lignes.map(({ nom: n, qte }) => ({ nom: n, qte })) };
    const l = maj_ && existante && d.listes.find(x => x.id === existante.id);
    if (l) Object.assign(l, data);
    else d.listes.push({ id: uid(), emoji: '💬', ...data });
  };

  const valider = () => {
    if (versListes) {
      if (!lignes.length) return;
      const maj_ = !!existante && remplacer;
      maj(d => enregistrerListe(d, maj_));
      toast(maj_ ? `Liste « ${existante.nom} » mise à jour ✏️` : 'Liste enregistrée dans Mes listes 💾');
    } else {
      if (!choisis.length) return;
      maj(d => {
        choisis.forEach(a => ajouterALaListe(d, a.nom, a.qte));
        if (enreg) enregistrerListe(d, true);
      });
      const ignores = analyse.length - choisis.length;
      toast(`${choisis.length} ajouté${choisis.length > 1 ? 's' : ''}${ignores ? ` · ${ignores} ignoré${ignores > 1 ? 's' : ''}` : ''} ✨`);
    }
    setTxt(''); setNom(''); setEnreg(false);
    onClose();
  };

  const libelle = versListes
    ? (existante && remplacer ? `Mettre à jour « ${existante.nom} » (${lignes.length})` : `Enregistrer la liste (${lignes.length} article${lignes.length > 1 ? 's' : ''})`)
    : `Ajouter ${choisis.length || ''} article${choisis.length > 1 ? 's' : ''} à ma liste`;

  return (
    <Sheet
      open={open} onClose={onClose} title={titre}
      footer={<button className="btn btn-big btn-main" disabled={versListes ? !lignes.length : !choisis.length} onClick={valider}>{libelle}</button>}
    >
      <div className="wa-tip">
        <span className="wa-ico">💬</span>
        <span className="small">
          <b>Reçue sur WhatsApp ?</b> Appui long sur le message → <b>Partager</b> → <b>Courses Pro</b> (Android, appli installée).
          Sur iPhone : <b>Copier</b> le message puis le bouton ci-dessous.
        </span>
      </div>
      <button className="btn btn-soft btn-full" onClick={coller}><Icon name="paste" size={18} /> Coller depuis le presse-papiers</button>
      <textarea className="input textarea" rows={6} value={txt} onChange={e => setTxt(e.target.value)} placeholder={'2 lait\npain\nbananes x6\n500 Gr farine'} />
      {lignes.length > 0 && <p className="muted small">✏️ Tu peux corriger le texte ci-dessus avant d’importer (ajouter, retirer, changer une quantité).</p>}

      {choixDestination && (
        <div className="seg">
          <button className={dest === 'jour' ? 'on' : ''} onClick={() => setDest('jour')}>🧺 <span>Liste du jour</span></button>
          <button className={dest === 'listes' ? 'on' : ''} onClick={() => setDest('listes')}>📋 <span>Mes listes</span></button>
        </div>
      )}

      {versListes && lignes.length > 0 && (
        <div className="stack">
          <input className="input" placeholder="Nom de la liste" value={nom} onChange={e => setNom(e.target.value)} />
          {existante && (
            <div className="seg">
              <button className={remplacer ? 'on' : ''} onClick={() => setRemplacer(true)}>✏️ <span>Mettre à jour</span></button>
              <button className={!remplacer ? 'on' : ''} onClick={() => setRemplacer(false)}>➕ <span>Nouvelle liste</span></button>
            </div>
          )}
          {existante && remplacer && <div className="msg msg-ok">La liste « {existante.nom} » ({existante.items.length} articles) sera remplacée par celle-ci ({lignes.length} articles).</div>}
          <div className="chips-wrap">
            {lignes.map((l, k) => <span key={k} className="chip chip-white">{l.qte && <b>{l.qte}</b>} {l.nom}</span>)}
          </div>
        </div>
      )}

      {estMagasin && <div className="msg msg-ok">🏪 Ce message contient l’organisation d’un magasin : importe-la depuis l’onglet Magasins → Importer.</div>}
      {!versListes && analyse.length > 0 && groupes.map(g => {
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

      {!versListes && (
        <div className="toggle-box">
          <Toggle checked={enreg} onChange={setEnreg} label="Enregistrer aussi dans Mes listes" />
          {enreg && <input className="input" placeholder="Nom de la liste" value={nom} onChange={e => setNom(e.target.value)} style={{ marginTop: 8 }} />}
          {enreg && existante && <p className="muted small">La liste « {existante.nom} » sera mise à jour.</p>}
        </div>
      )}
    </Sheet>
  );
}
