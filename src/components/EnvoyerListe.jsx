import { useEffect, useState } from 'react';
import Icon from './icons.jsx';
import { EmojiPicker, Sheet, Toggle } from './ui.jsx';
import { ligneArticle, parseTexte, texteListe, uid } from '../lib/utils.js';

// Envoi d'une liste (enregistrée ou du jour) par WhatsApp, après l'avoir retouchée.
// source : { nom, emoji, items, listeId? }  — listeId = liste de « Mes listes » à mettre à jour
export default function EnvoyerListe({ source, onClose, maj, toast }) {
  const [nom, setNom] = useState('');
  const [emoji, setEmoji] = useState('🛒');
  const [txt, setTxt] = useState('');
  const [enreg, setEnreg] = useState(false);

  useEffect(() => {
    if (!source) return;
    setNom(source.nom || '');
    setEmoji(source.emoji || '🛒');
    setTxt(source.items.map(ligneArticle).join('\n'));
    setEnreg(false);
  }, [source]);

  if (!source) return null;
  const items = parseTexte(txt);
  const message = texteListe(nom, items);
  const modifie = txt.trim() !== source.items.map(ligneArticle).join('\n').trim() || nom !== (source.nom || '');

  const memoriser = () => {
    if (!enreg) return;
    maj(d => {
      const data = { nom: nom.trim() || 'Ma liste', emoji, items };
      const l = source.listeId && d.listes.find(x => x.id === source.listeId);
      if (l) Object.assign(l, data);
      else d.listes.push({ id: uid(), ...data });
    });
  };

  const whatsapp = () => {
    memoriser();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  };
  const partager = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: nom, text: message }); memoriser(); onClose(); return; }
    } catch (e) { if (e?.name === 'AbortError') return; }
    copier();
  };
  const copier = async () => {
    try { await navigator.clipboard.writeText(message); memoriser(); toast('Copiée ! Colle-la dans WhatsApp 📋'); onClose(); }
    catch { toast('Copie impossible sur ce téléphone 😕'); }
  };

  return (
    <Sheet
      open onClose={onClose} title="💬 Envoyer la liste"
      footer={
        <div className="stack">
          <button className="btn btn-big btn-wa" disabled={!items.length} onClick={whatsapp}>💬 Envoyer sur WhatsApp</button>
          <div className="quick-row">
            <button className="btn btn-soft" disabled={!items.length} onClick={partager}><Icon name="upload" size={18} /> Partager…</button>
            <button className="btn btn-soft" disabled={!items.length} onClick={copier}><Icon name="copy" size={18} /> Copier</button>
          </div>
        </div>
      }
    >
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" placeholder="Nom de la liste" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <p className="muted small">Retouche avant d’envoyer : une ligne par article, quantité devant (« 2 lait », « 500 Gr farine », « 1,5 L coca »).</p>
      <textarea className="input textarea" rows={9} value={txt} onChange={e => setTxt(e.target.value)} />

      <div className="wa-apercu">
        <div className="muted small"><b>Aperçu du message</b> — modifiable aussi dans WhatsApp avant l’envoi</div>
        <pre className="wa-bulle">{message}</pre>
      </div>

      {modifie && (
        <div className="toggle-box">
          <Toggle
            checked={enreg} onChange={setEnreg}
            label={source.listeId ? 'Enregistrer aussi ces modifications dans la liste' : 'Enregistrer aussi dans Mes listes'}
          />
        </div>
      )}
      {!modifie && !source.listeId && (
        <div className="toggle-box"><Toggle checked={enreg} onChange={setEnreg} label="Enregistrer aussi dans Mes listes" /></div>
      )}
      <p className="muted small">À l’arrivée : appui long sur le message → <b>Partager</b> → <b>Courses Pro</b> (ou Copier puis « Liste reçue 💬 »). La personne peut modifier la liste et te la renvoyer de la même façon.</p>
    </Sheet>
  );
}
