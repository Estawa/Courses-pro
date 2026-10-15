import { useState } from 'react';
import Icon from '../components/icons.jsx';
import { EmojiPicker, Empty, Sheet } from '../components/ui.jsx';
import ImportListe from '../components/ImportListe.jsx';
import EnvoyerListe from '../components/EnvoyerListe.jsx';
import { ligneArticle, parseTexte, uid } from '../lib/utils.js';

const versTexte = items => items.map(ligneArticle).join('\n');

export default function Listes({ db, maj, toast, goto }) {
  const [edit, setEdit] = useState(null); // id | 'new'
  const [ajout, setAjout] = useState(null);
  const [envoi, setEnvoi] = useState(null);
  const [recevoir, setRecevoir] = useState(false);
  return (
    <div className="page">
      <div className="card hero hero-pink">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Mes listes</div>
            <div className="hero-big">{db.listes.length} liste{db.listes.length > 1 ? 's' : ''}</div>
            <div className="hero-sub">Tes listes habituelles, prêtes à être ajoutées en un geste.</div>
          </div>
          <div className="hero-emoji">📋</div>
        </div>
        <button className="btn btn-main btn-full" onClick={() => setEdit('new')}><Icon name="plus" /> Nouvelle liste (ou coller la mienne)</button>
        <button className="btn btn-white btn-full" onClick={() => setRecevoir(true)}>💬 Recevoir une liste (WhatsApp)</button>
      </div>

      {db.listes.length === 0 && <Empty emoji="📋" titre="Aucune liste" texte="Crée une liste ou colle une liste que tu as déjà (notes du téléphone, SMS…)." />}

      <div className="stack">
        {db.listes.map(l => (
          <div key={l.id} className="card liste-card">
            <div className="row gap">
              <span className="liste-emoji">{l.emoji}</span>
              <div className="grow">
                <b className="liste-nom">{l.nom}</b>
                <div className="muted small">{l.items.length} article{l.items.length > 1 ? 's' : ''}</div>
              </div>
              <button className="icon-btn" onClick={() => setEdit(l.id)} aria-label="Modifier"><Icon name="edit" size={18} /></button>
            </div>
            <div className="chips-wrap">
              {l.items.slice(0, 12).map((i, k) => <span key={k} className="chip chip-white">{i.qte && <b>{i.qte}</b>} {i.nom}</span>)}
              {l.items.length > 12 && <span className="chip chip-white">+{l.items.length - 12}</span>}
            </div>
            <div className="quick-row">
              <button className="btn btn-main" onClick={() => setAjout(l)}>
                <Icon name="cart" size={18} /> Ajouter à ma liste
              </button>
              <button className="btn btn-soft" onClick={() => {
                maj(d => { d.listes.push({ ...structuredClone(l), id: uid(), nom: l.nom + ' (copie)' }); });
                toast('Liste dupliquée');
              }}>
                <Icon name="copy" size={18} /> Dupliquer
              </button>
              <button className="btn btn-wa-soft" onClick={() => setEnvoi({ nom: l.nom, emoji: l.emoji, items: l.items, listeId: l.id })}>
                💬 Envoyer
              </button>
            </div>
          </div>
        ))}
      </div>

      <ImportListe
        open={!!ajout} onClose={() => setAjout(null)} db={db} maj={maj} toast={toast}
        texteInitial={ajout ? versTexte(ajout.items) : ''} titre={ajout ? `${ajout.emoji} ${ajout.nom}` : ''}
        choixDestination={false}
      />
      <ImportListe
        open={recevoir} onClose={() => setRecevoir(false)} db={db} maj={maj} toast={toast}
        titre="💬 Recevoir une liste" destinationDefaut="listes"
      />
      <EnvoyerListe source={envoi} onClose={() => setEnvoi(null)} maj={maj} toast={toast} />
      {edit && <EditListe id={edit} db={db} maj={maj} toast={toast} onClose={() => setEdit(null)} goto={goto} />}
    </div>
  );
}

function EditListe({ id, db, maj, toast, onClose }) {
  const nouveau = id === 'new';
  const l0 = nouveau ? { nom: '', emoji: '📝', items: [] } : db.listes.find(l => l.id === id);
  const [nom, setNom] = useState(l0?.nom || '');
  const [emoji, setEmoji] = useState(l0?.emoji || '📝');
  const [txt, setTxt] = useState(l0 ? versTexte(l0.items) : '');
  if (!l0) return null;
  const items = parseTexte(txt);
  const enregistrer = () => {
    maj(d => {
      const data = { nom: nom.trim() || 'Ma liste', emoji, items };
      if (nouveau) d.listes.push({ id: uid(), ...data });
      else Object.assign(d.listes.find(l => l.id === id), data);
    });
    toast('Liste enregistrée 💾');
    onClose();
  };
  const supprimer = () => {
    if (!confirm(`Supprimer la liste « ${l0.nom} » ?`)) return;
    maj(d => { d.listes = d.listes.filter(l => l.id !== id); });
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={nouveau ? '📝 Nouvelle liste' : '✏️ Modifier la liste'} footer={<button className="btn btn-big btn-main" onClick={enregistrer}>Enregistrer ({items.length} articles)</button>}>
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" placeholder="Nom (ex : Raclette, Goûters…)" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <p className="muted small">Une ligne par article. Tu peux coller directement une liste existante, avec ou sans quantités (« 2 lait », « bananes x6 »).</p>
      <textarea className="input textarea" rows={12} value={txt} onChange={e => setTxt(e.target.value)} placeholder={'Pain\n2 lait\nBananes x6\nYaourts'} />
      {!nouveau && <button className="btn btn-ghost danger" onClick={supprimer}><Icon name="trash" size={18} /> Supprimer la liste</button>}
    </Sheet>
  );
}
