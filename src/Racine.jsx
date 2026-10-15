import { useEffect, useState } from 'react';
import App from './App.jsx';
import Icon from './components/icons.jsx';
import { cloud, messageErreur } from './lib/cloud.js';
import { charger, cleCache, dbInitiale } from './lib/store.js';
import { appConfig } from './appConfig.js';

const lireLS = k => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrireLS = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* */ } };

// Code d'invitation passé dans le lien (?rejoindre=ABC123), gardé le temps de se connecter
function codeDuLien() {
  const u = new URL(window.location.href);
  const c = u.searchParams.get('rejoindre');
  if (c) {
    try { sessionStorage.setItem('cp-rejoindre', c); } catch { /* */ }
    u.searchParams.delete('rejoindre');
    window.history.replaceState(null, '', u.pathname + (u.search || ''));
    return c;
  }
  try { return sessionStorage.getItem('cp-rejoindre') || ''; } catch { return ''; }
}

// Par défaut l'appli est 100 % locale (rien n'est envoyé à Firebase).
// Le mode « foyer » ne s'active que via la connexion discrète du menu ou un lien d'invitation.
// Foyer mémorisé sur ce téléphone : l'appli s'ouvre tout de suite, même sans réseau
const CLE_FOYER = 'courses-pro-foyer-connu';
function foyerConnu() {
  try { return JSON.parse(lireLS(CLE_FOYER) || 'null'); } catch { return null; }
}
function memoriserFoyer(user, foyerId) {
  if (!foyerId || !user) { ecrireLS(CLE_FOYER, null); return; }
  ecrireLS(CLE_FOYER, JSON.stringify({ foyerId, uid: user.uid, email: user.email || '', displayName: user.displayName || '' }));
}

export default function Racine() {
  const [code] = useState(codeDuLien);
  const [mode, setMode] = useState(() => (cloud.actif && (code || lireLS('courses-pro-mode') === 'cloud') ? 'cloud' : 'local'));
  const [connu] = useState(foyerConnu);
  const [user, setUser] = useState(() => (connu ? { ...connu, hors: true } : undefined));
  const [foyerId, setFoyerId] = useState(() => connu?.foyerId);

  useEffect(() => {
    if (mode !== 'cloud') return undefined;
    let actif = true;
    const stop = cloud.onAuth(async u => {
      if (!actif) return;
      if (!u) { memoriserFoyer(null); setUser(null); setFoyerId(null); return; }
      setUser(u);
      try {
        // Vérification en arrière-plan : seul un « non » du serveur fait sortir du foyer
        const f = await cloud.monFoyer(u);
        if (!actif) return;
        memoriserFoyer(u, f);
        setFoyerId(f);
      } catch {
        // Pas de réseau : on garde le foyer mémorisé
        setFoyerId(prev => (prev === undefined ? (foyerConnu()?.uid === u.uid ? foyerConnu().foyerId : null) : prev));
      }
    });
    return () => { actif = false; stop(); };
  }, [mode]);

  const passerLocal = () => { ecrireLS('courses-pro-mode', 'local'); setMode('local'); };
  const passerCloud = () => { ecrireLS('courses-pro-mode', 'cloud'); setMode('cloud'); };

  if (mode === 'local') return <App foyerId={null} session={{ local: true, versCloud: cloud.actif ? passerCloud : null }} />;
  if (foyerId) {
    return (
      <App
        key={foyerId}
        foyerId={foyerId}
        session={{
          user, foyerId,
          sortir: () => { memoriserFoyer(null); setFoyerId(null); },
          deconnexion: async () => { memoriserFoyer(null); await cloud.deconnexion(); passerLocal(); },
        }}
      />
    );
  }
  if (user === undefined || (user && foyerId === undefined)) return <Splash />;
  if (!user) return <Connexion onLocal={passerLocal} />;
  return (
    <ChoixFoyer
      user={user} codeInitial={code} onLocal={() => { cloud.deconnexion(); passerLocal(); }}
      onFoyer={f => { try { sessionStorage.removeItem('cp-rejoindre'); } catch { /* */ } memoriserFoyer(user, f); setFoyerId(f); }}
    />
  );
}

function Logo() {
  return (
    <div className="accueil-logo">
      <div className="logo logo-xl">🛒</div>
      <div className="brand-nom accueil-titre">{appConfig.nom}</div>
      <div className="brand-sub">by {appConfig.auteur} <span className="version">v{appConfig.version}</span></div>
    </div>
  );
}

function Splash() {
  return (
    <div className="accueil">
      <Logo />
      <div className="spinner" aria-label="Chargement" />
    </div>
  );
}

function Connexion({ onLocal }) {
  const [creer, setCreer] = useState(false);
  const [nom, setNom] = useState('');
  const [mail, setMail] = useState('');
  const [mdp, setMdp] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async fn => {
    setErr(''); setInfo(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(messageErreur(e)); }
    setBusy(false);
  };

  return (
    <div className="accueil">
      <Logo />
      <div className="card accueil-card">
        <div className="accueil-pitch">
          <span>🧺</span>
          <span>Une liste de courses <b>partagée en temps réel</b> avec ta famille, ton stock maison et tes dépenses.</span>
        </div>
        <button className="btn btn-big btn-white btn-google" disabled={busy} onClick={() => go(() => cloud.google())}>
          <span className="g-logo">G</span> Continuer avec Google
        </button>
        <div className="sep"><span>ou avec un e-mail</span></div>
        <form className="stack" onSubmit={e => { e.preventDefault(); go(() => cloud.email(mail, mdp, creer, nom)); }}>
          {creer && <input className="input" placeholder="Ton prénom" value={nom} onChange={e => setNom(e.target.value)} autoComplete="given-name" />}
          <input className="input" type="email" placeholder="E-mail" value={mail} onChange={e => setMail(e.target.value)} autoComplete="email" required />
          <input className="input" type="password" placeholder="Mot de passe (6 caractères min.)" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete={creer ? 'new-password' : 'current-password'} required />
          <button className="btn btn-big btn-main" disabled={busy}>{creer ? 'Créer mon compte' : 'Se connecter'}</button>
        </form>
        {err && <div className="msg msg-err">{err}</div>}
        {info && <div className="msg msg-ok">{info}</div>}
        <div className="row-between small">
          <button className="lien" onClick={() => { setCreer(!creer); setErr(''); }}>{creer ? 'J’ai déjà un compte' : 'Créer un compte'}</button>
          {!creer && (
            <button className="lien" onClick={() => mail ? go(async () => { await cloud.reset(mail); setInfo('E-mail de réinitialisation envoyé 📩'); }) : setErr('Saisis ton e-mail d’abord.')}>
              Mot de passe oublié ?
            </button>
          )}
        </div>
      </div>
      <p className="muted small center">🔒 Réservé au foyer familial : les données ne sont visibles que par ses membres.</p>
      <button className="lien small" onClick={onLocal}><Icon name="left" size={14} /> Revenir à l’appli sur ce téléphone</button>
    </div>
  );
}

function ChoixFoyer({ user, codeInitial, onFoyer, onLocal }) {
  const peutCreer = appConfig.emailsFoyer.map(e => e.toLowerCase()).includes((user.email || '').toLowerCase());
  const [code, setCode] = useState(codeInitial || '');
  const [nom, setNom] = useState('');
  const local = charger(null);
  const aDesDonnees = local.achats.length > 0 || local.liste.length > 0 || local.magasins.length > 1 || local.produits.some(p => p.suivi);
  const [reprendre, setReprendre] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const prenom = (user.displayName || user.email || '').split(/[ @]/)[0];

  const go = async fn => {
    setErr(''); setBusy(true);
    try { onFoyer(await fn()); } catch (e) { setErr(messageErreur(e)); setBusy(false); }
  };
  const creer = () => go(async () => {
    const { _foyer, _membres, ...donnees } = local; // eslint-disable-line no-unused-vars
    const base = reprendre ? donnees : dbInitiale();
    const f = await cloud.creerFoyer(user, nom || 'Notre foyer', base);
    try { localStorage.setItem(cleCache(f), JSON.stringify(base)); } catch { /* */ }
    return f;
  });

  return (
    <div className="accueil">
      <Logo />
      <div className="accueil-hello">Bonjour {prenom} 👋</div>

      <div className="card accueil-card hero-pink">
        <div className="card-title">💌 Rejoindre un foyer</div>
        <p className="small">Quelqu’un de ta famille t’a envoyé un code ou un lien d’invitation ? Saisis le code à 6 caractères.</p>
        <input
          className="input code-input" placeholder="ABC123" maxLength={8} value={code}
          onChange={e => setCode(e.target.value.toUpperCase())} autoCapitalize="characters"
        />
        <button className="btn btn-big btn-main" disabled={busy || code.trim().length < 6} onClick={() => go(() => cloud.rejoindre(user, code))}>
          Rejoindre
        </button>
      </div>

      {peutCreer && <div className="card accueil-card hero-mint">
        <div className="card-title">🏡 Créer notre foyer</div>
        <p className="small">Tu deviens le premier membre et tu pourras inviter ta famille avec un code.</p>
        <input className="input" placeholder="Nom du foyer (ex : Famille Martin)" value={nom} onChange={e => setNom(e.target.value)} />
        {aDesDonnees && (
          <label className="check-line small">
            <input type="checkbox" checked={reprendre} onChange={e => setReprendre(e.target.checked)} />
            Reprendre les magasins, listes, stock et dépenses déjà sur ce téléphone
          </label>
        )}
        <button className="btn btn-big btn-main" disabled={busy} onClick={creer}>Créer le foyer</button>
      </div>}

      {err && <div className="msg msg-err">{err}</div>}
      {busy && <div className="spinner" />}
      <button className="lien small" onClick={() => cloud.deconnexion()}>Changer de compte ({user.email})</button>
      <button className="lien small" onClick={onLocal}><Icon name="left" size={14} /> Revenir à l’appli sur ce téléphone</button>
    </div>
  );
}
