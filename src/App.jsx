import { useEffect, useRef, useState } from 'react';
import Icon from './components/icons.jsx';
import { Sheet, useToast } from './components/ui.jsx';
import ImportListe from './components/ImportListe.jsx';
import FoyerSheet, { partagerAppli } from './components/Foyer.jsx';
import ImportMagasin from './components/ImportMagasin.jsx';
import { trouverCode } from './lib/partage.js';
import { useDb, dbInitiale, copiesAuto } from './lib/store.js';
import { appConfig } from './appConfig.js';
import { CHANGELOG } from './changelog.js';
import Courses from './tabs/Courses.jsx';
import Maison from './tabs/Maison.jsx';
import Listes from './tabs/Listes.jsx';
import Magasins from './tabs/Magasins.jsx';
import Depenses from './tabs/Depenses.jsx';

const ONGLETS = [
  { id: 'courses', label: 'Courses', icon: 'cart' },
  { id: 'maison', label: 'Maison', icon: 'home' },
  { id: 'listes', label: 'Listes', icon: 'list' },
  { id: 'magasins', label: 'Magasins', icon: 'store' },
  { id: 'depenses', label: 'Dépenses', icon: 'wallet' },
];

export default function App({ foyerId = null, session = { local: true } }) {
  const [db, maj, remplacer] = useDb(foyerId, session.sortir);
  const [foyerOuvert, setFoyerOuvert] = useState(false);
  const cloudOn = !!foyerId;
  const [onglet, setOnglet] = useState(() => { try { return localStorage.getItem('courses-pro-onglet') || 'courses'; } catch { return 'courses'; } });
  const [menu, setMenu] = useState(false);
  const [journal, setJournal] = useState(false);
  const [toast, toastNode] = useToast();
  const fichier = useRef();
  const [partage, setPartage] = useState(null);
  const [importMag, setImportMag] = useState(null);
  const [copies, setCopies] = useState(false);

  // Partage reçu (WhatsApp / lien) : organisation de magasin (?magasin=CP…) ou liste de courses
  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    const t = [u.get('magasin'), u.get('title'), u.get('text'), u.get('liste'), u.get('url')].filter(Boolean).join('\n').trim();
    if (t) {
      if (trouverCode(t)) { setImportMag(t); setOnglet('magasins'); }
      else { setPartage(t); setOnglet('courses'); }
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = db.reglages.theme === 'sombre' ? 'dark' : 'light';
  }, [db.reglages.theme]);
  useEffect(() => { try { localStorage.setItem('courses-pro-onglet', onglet); } catch { /* */ } }, [onglet]);

  const goto = o => { setOnglet(o); window.scrollTo(0, 0); };
  const nbListe = db.liste.filter(i => !i.coche).length;
  const nbBas = db.produits.filter(p => p.suivi && p.stock <= p.min).length;

  const exporter = () => {
    const { _foyer, _membres, ...sauvegarde } = db; // eslint-disable-line no-unused-vars
    const blob = new Blob([JSON.stringify(sauvegarde, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `courses-pro-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde téléchargée 💾');
  };
  const importer = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d.produits || !d.magasins) throw new Error();
        if (!confirm('Remplacer toutes tes données par cette sauvegarde ?')) return;
        const { _foyer, _membres, ...propre } = d; // eslint-disable-line no-unused-vars
        remplacer({ ...dbInitiale(), ...propre, magasinActif: propre.magasinActif || db.magasinActif });
        toast('Sauvegarde restaurée ✅');
        setMenu(false);
      } catch { toast('Fichier invalide 😕'); }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const props = { db, maj, toast, goto, ouvrirImportMagasin: t => setImportMag(t || '') };

  return (
    <div className="app">
      <header className="top">
        <div className="logo" aria-hidden="true">🛒</div>
        <div className="brand">
          <div className="brand-nom">{appConfig.nom}</div>
          <div className="brand-sub">by {appConfig.auteur} <span className="version">v{appConfig.version}</span></div>
        </div>
        {cloudOn && (
          <button className="foyer-btn" onClick={() => setFoyerOuvert(true)} aria-label="Mon foyer">
            {(db._membres || []).slice(0, 3).map(m => <span key={m.uid} className="avatar avatar-s">{(m.nom || '?').charAt(0).toUpperCase()}</span>)}
            {!(db._membres || []).length && <span className="avatar avatar-s">☁</span>}
          </button>
        )}
        <button
          className="icon-btn top-btn" aria-label="Mode jour / nuit"
          onClick={() => maj(d => { d.reglages.theme = d.reglages.theme === 'sombre' ? 'clair' : 'sombre'; })}
        >
          <Icon name={db.reglages.theme === 'sombre' ? 'sun' : 'moon'} />
        </button>
        <button className="icon-btn top-btn" aria-label="Menu" onClick={() => setMenu(true)}><Icon name="dots" /></button>
      </header>

      <main>
        {onglet === 'courses' && <Courses {...props} />}
        {onglet === 'maison' && <Maison {...props} />}
        {onglet === 'listes' && <Listes {...props} />}
        {onglet === 'magasins' && <Magasins {...props} />}
        {onglet === 'depenses' && <Depenses {...props} />}
      </main>

      <nav className="tabs">
        {ONGLETS.map(o => (
          <button key={o.id} className={'tab tab-' + o.id + (onglet === o.id ? ' on' : '')} onClick={() => goto(o.id)}>
            <span className="tab-ico">
              <Icon name={o.icon} size={22} />
              {o.id === 'courses' && nbListe > 0 && <span className="badge">{nbListe}</span>}
              {o.id === 'maison' && nbBas > 0 && <span className="badge badge-orange">{nbBas}</span>}
            </span>
            <span className="tab-lbl">{o.label}</span>
          </button>
        ))}
      </nav>

      {toastNode}

      <ImportMagasin
        open={importMag !== null} texteInitial={importMag || ''} onClose={() => setImportMag(null)}
        db={db} maj={maj} toast={toast} goto={goto}
      />
      <ImportListe
        open={partage !== null} onClose={() => setPartage(null)} db={db} maj={maj} toast={toast}
        texteInitial={partage || ''} titre="💬 Liste reçue"
      />

      <Sheet open={menu} onClose={() => setMenu(false)} title="⚙️ Menu">
        <div className="stack">
          {cloudOn && <button className="menu-row menu-foyer" onClick={() => { setMenu(false); setFoyerOuvert(true); }}><span>👨‍👩‍👧</span> <span className="grow">Mon foyer : {db._foyer?.nom || '…'}<span className="muted small block">Membres, invitation, déconnexion</span></span></button>}
          <button className="menu-row" onClick={() => partagerAppli(toast)}><Icon name="upload" /> <span className="grow">Partager l’appli</span></button>
          <button className="menu-row" onClick={exporter}><Icon name="download" /> <span className="grow">Sauvegarder mes données</span></button>
          <button className="menu-row" onClick={() => fichier.current.click()}><Icon name="upload" /> <span className="grow">Restaurer une sauvegarde</span></button>
          <input ref={fichier} type="file" accept="application/json,.json" hidden onChange={importer} />
          <button className="menu-row" onClick={() => { setMenu(false); setCopies(true); }}><Icon name="history" /> <span className="grow">Copies automatiques<span className="muted small block">Revenir à l’état d’un jour précédent</span></span></button>
          <button className="menu-row" onClick={() => { setMenu(false); setJournal(true); }}><Icon name="history" /> <span className="grow">Journal des modifications</span></button>
          <button className="menu-row danger" onClick={() => {
            if (confirm(cloudOn ? 'Tout effacer pour TOUT le foyer et repartir de zéro ? (pense à sauvegarder avant)' : 'Tout effacer et repartir de zéro ? (pense à sauvegarder avant)')) { remplacer(dbInitiale()); setMenu(false); toast('Appli remise à zéro'); }
          }}><Icon name="trash" /> <span className="grow">Tout réinitialiser</span></button>
        </div>
        <p className="muted small center" style={{ marginTop: 16 }}>
          {cloudOn ? '☁️ Données partagées et protégées dans le foyer, synchronisées en temps réel.' : 'Tes données restent sur ce téléphone. Pense à faire une sauvegarde de temps en temps 💾'}
        </p>
        {session.versCloud && (
          <button className="lien small lien-discret" onClick={() => { setMenu(false); session.versCloud(); }}>Connexion au foyer familial</button>
        )}
      </Sheet>

      {cloudOn && <FoyerSheet open={foyerOuvert} onClose={() => setFoyerOuvert(false)} db={db} session={session} toast={toast} />}

      <Sheet open={copies} onClose={() => setCopies(false)} title="🗂️ Copies automatiques">
        <p className="muted small">Une copie est gardée chaque jour sur ce téléphone (10 derniers jours). Restaurer remplace toutes les données actuelles{cloudOn ? ' du foyer' : ''}.</p>
        {copiesAuto(foyerId).length === 0 && <p className="muted small center">Aucune copie pour l’instant.</p>}
        <div className="stack">
          {copiesAuto(foyerId).map(c => (
            <button key={c.jour} className="menu-row" onClick={() => {
              if (!confirm(`Revenir à l’état du ${c.jour.split('-').reverse().join('/')} ? Tout ce qui a été fait depuis sera remplacé.`)) return;
              remplacer({ ...dbInitiale(), ...c.donnees, magasinActif: c.donnees.magasinActif || db.magasinActif });
              setCopies(false); toast('Copie restaurée ✅');
            }}>
              <Icon name="history" />
              <span className="grow">{c.jour.split('-').reverse().join('/')}
                <span className="muted small block">{c.donnees.magasins?.length || 0} magasin(s) · {(c.donnees.magasins || []).reduce((n, m) => n + (m.rayons?.length || 0), 0)} rayons · {c.donnees.liste?.length || 0} article(s) sur la liste</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={journal} onClose={() => setJournal(false)} title="📜 Journal des modifications">
        {CHANGELOG.map(v => (
          <div key={v.version} className="card">
            <div className="row-between"><b>Version {v.version}</b><span className="muted small">{v.date.split('-').reverse().join('/')}</span></div>
            <ul className="journal">{v.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        ))}
      </Sheet>
    </div>
  );
}
