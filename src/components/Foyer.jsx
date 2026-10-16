import { useState } from 'react';
import Icon from './icons.jsx';
import { Sheet } from './ui.jsx';
import { cloud, messageErreur } from '../lib/cloud.js';
import { modeSolo, lienSolo, lienAvecFoyer } from '../lib/modeSolo.js';

export async function partager({ titre, texte, url }, toast) {
  try {
    if (navigator.share) { await navigator.share({ title: titre, text: texte, url }); return; }
  } catch (e) { if (e?.name === 'AbortError') return; }
  try {
    await navigator.clipboard.writeText(`${texte}\n${url}`);
    toast('Copié ! Colle-le dans WhatsApp 📋');
  } catch {
    window.open(`https://wa.me/?text=${encodeURIComponent(texte + '\n' + url)}`, '_blank');
  }
}

const TEXTE_APPLI = 'Je te partage Courses Pro 🛒 : listes de courses rangées par rayons, stock maison, recettes et dépenses. Installe-la depuis ce lien (menu ⋮ > Ajouter à l’écran d’accueil) :';

// avecFoyer = false : lien « solo », la connexion au foyer familial est masquée chez la personne
export const partagerAppli = (toast, avecFoyer = false) => partager({
  titre: 'Courses Pro',
  texte: TEXTE_APPLI,
  url: avecFoyer && !modeSolo ? lienAvecFoyer() : lienSolo(),
}, toast);

// Choix avant l'envoi : avec ou sans la connexion au foyer familial.
// Sur un téléphone en mode solo, pas de choix : on appelle directement partagerAppli (toujours solo).
export function PartageAppliSheet({ open, onClose, toast }) {
  if (!open) return null;
  const envoyer = avecFoyer => { onClose(); partagerAppli(toast, avecFoyer); };
  return (
    <Sheet open={open} onClose={onClose} title="📤 Partager l’appli">
      <p className="muted small">Choisis la version à envoyer :</p>
      <div className="stack">
        <button className="menu-row" onClick={() => envoyer(false)}>
          <span>📱</span>
          <span className="grow"><b>Sans connexion au foyer</b> (conseillé)
            <span className="muted small block">Appli 100 % sur son téléphone. Le bouton « Connexion au foyer familial » n’apparaît pas du tout.</span>
          </span>
        </button>
        <button className="menu-row" onClick={() => envoyer(true)}>
          <span>👨‍👩‍👧</span>
          <span className="grow"><b>Avec connexion au foyer</b>
            <span className="muted small block">Le bouton de connexion reste visible. Pour entrer dans ton foyer, la personne aura quand même besoin de ton code d’invitation.</span>
          </span>
        </button>
      </div>
    </Sheet>
  );
}

export default function FoyerSheet({ open, onClose, db, session, toast }) {
  const f = db._foyer;
  const membres = db._membres || [];
  const [nom, setNom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [choixPartage, setChoixPartage] = useState(false);
  const moi = session.user;

  const action = async (fn, ok) => {
    setBusy(true);
    try { await fn(); if (ok) toast(ok); } catch (e) { toast(messageErreur(e)); }
    setBusy(false);
  };
  const inviter = () => partager({
    titre: 'Rejoins notre foyer sur Courses Pro',
    texte: `Rejoins notre foyer « ${f?.nom} » sur Courses Pro 🛒 pour partager nos listes de courses. Ouvre le lien, connecte-toi, et le code ${f?.code} sera déjà rempli :`,
    url: `${window.location.origin}/?rejoindre=${f?.code}`,
  }, toast);

  return (
    <>
    <Sheet open={open} onClose={onClose} title="👨‍👩‍👧 Mon foyer">
      {!f ? <div className="spinner" /> : (
        <>
          <div className="card hero hero-mint">
            {nom === null ? (
              <div className="row-between">
                <div><div className="hero-kicker">Foyer</div><div className="hero-big">{f.nom}</div></div>
                <button className="icon-btn" onClick={() => setNom(f.nom)} aria-label="Renommer"><Icon name="edit" /></button>
              </div>
            ) : (
              <div className="ajout-row">
                <input className="input grow" value={nom} onChange={e => setNom(e.target.value)} autoFocus />
                <button className="btn btn-main" onClick={() => action(() => cloud.renommer(f.id, nom.trim() || f.nom), 'Foyer renommé').then(() => setNom(null))}>OK</button>
              </div>
            )}
            <div className="small">🔒 Seuls les membres connectés de ce foyer peuvent voir et modifier vos listes, stock et dépenses. Tout est synchronisé en temps réel.</div>
          </div>

          <div className="card">
            <div className="card-title">Membres ({membres.length})</div>
            {membres.map(m => (
              <div key={m.uid} className="membre">
                <span className="avatar">{(m.nom || '?').charAt(0).toUpperCase()}</span>
                <span className="grow">
                  <b>{m.nom}{m.uid === moi.uid ? ' (toi)' : ''}</b>
                  <span className="muted small block">{m.email}</span>
                </span>
                {m.uid !== moi.uid && (
                  <button className="icon-btn danger" disabled={busy} aria-label="Retirer"
                    onClick={() => confirm(`Retirer ${m.nom} du foyer ? Il/elle n’aura plus accès aux données.`) && action(() => cloud.retirer(f.id, m.uid), 'Membre retiré')}>
                    <Icon name="x" size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="card card-peach">
            <div className="card-title">💌 Inviter quelqu’un</div>
            <div className="code-box">{f.code || '……'}</div>
            <p className="small center" style={{ margin: 0 }}>Code d’invitation à saisir après connexion (ou envoie directement le lien).</p>
            <button className="btn btn-big btn-main" onClick={inviter} disabled={!f.code}><Icon name="upload" size={18} /> Envoyer l’invitation</button>
            <button className="btn btn-white" disabled={busy}
              onClick={() => action(() => cloud.nouveauCode(f.id, f.code), 'Nouveau code créé, l’ancien ne marche plus')}>
              <Icon name="history" size={18} /> Changer le code
            </button>
          </div>

          <button className="menu-row" onClick={() => setChoixPartage(true)}><Icon name="upload" /> <span className="grow">Partager l’appli (pour un autre foyer)</span></button>
          <button className="menu-row" onClick={() => { onClose(); session.deconnexion(); }}><Icon name="left" /> <span className="grow">Se déconnecter</span></button>
          <button className="menu-row danger" disabled={busy}
            onClick={() => confirm('Quitter ce foyer ? Tu n’auras plus accès à ses données (les autres membres les gardent).') && action(async () => { await cloud.quitter(f.id, moi); onClose(); session.sortir(); })}>
            <Icon name="trash" /> <span className="grow">Quitter le foyer</span>
          </button>
        </>
      )}
    </Sheet>
    <PartageAppliSheet open={choixPartage} onClose={() => setChoixPartage(false)} toast={toast} />
    </>
  );
}
