import { useMemo, useState } from 'react';
import Icon from '../components/icons.jsx';
import { Empty, Segmented, Sheet, Toggle } from '../components/ui.jsx';
import { CATS_RECETTE, STYLES, TAGS, appareil } from '../data/cuisine.js';
import {
  appareilsDu, appareilsPossedes, mangeursDu, recetteFaisable, couverture, besoinsRepas, lignesManquantes,
  qteAAcheter, proposerRepas, planifier, dureeTotale, tourneSeule, varianteParDefaut, refusePar,
} from '../lib/recettes.js';
import { ajouterALaListe } from '../lib/store.js';
import { norm, uid } from '../lib/utils.js';
import { useRecettes, useAvis, BadgeEtat, Etoiles, dureeTxt } from '../components/recettes/commun.jsx';
import Fiche from '../components/recettes/Fiche.jsx';
import Ajout from '../components/recettes/Ajout.jsx';
import Decompte from '../components/recettes/Decompte.jsx';

const PAGE = 40;

export default function Recettes({ db, maj, toast }) {
  const [vue, setVue] = useState(() => { try { return sessionStorage.getItem('cp-recettes-vue') || 'catalogue'; } catch { return 'catalogue'; } });
  const changerVue = v => { setVue(v); try { sessionStorage.setItem('cp-recettes-vue', v); } catch { /* */ } };
  const recettes = useRecettes(db);
  const avis = useAvis(db);
  const [fiche, setFiche] = useState(null); // recette ouverte
  const [ajout, setAjout] = useState(null); // null | 'new' | recette à modifier
  const ouvrir = r => setFiche(r);
  const nbRepas = (db.repas || []).length;

  return (
    <div className="page">
      <Segmented value={vue} onChange={changerVue} options={[
        { value: 'catalogue', label: 'Recettes', emoji: '📖' },
        { value: 'repas', label: nbRepas ? `Repas (${nbRepas})` : 'Mon repas', emoji: '🍽️' },
        { value: 'cuisine', label: 'Ma cuisine', emoji: '🔧' },
      ]} />
      {vue === 'catalogue' && <Catalogue db={db} maj={maj} recettes={recettes} avis={avis} ouvrir={ouvrir} nouvelle={() => setAjout('new')} />}
      {vue === 'repas' && <Repas db={db} maj={maj} toast={toast} recettes={recettes} ouvrir={ouvrir} allerCatalogue={() => changerVue('catalogue')} />}
      {vue === 'cuisine' && <MaCuisine db={db} maj={maj} toast={toast} nouvelle={() => setAjout('new')} recettes={recettes} />}

      {fiche && (
        <Fiche
          key={fiche.id} recette={recettes.find(r => r.id === fiche.id) || fiche} avis={avis.get(fiche.id)}
          db={db} maj={maj} toast={toast} onClose={() => setFiche(null)}
          onModifier={r => { setFiche(null); setAjout(r); }}
        />
      )}
      {ajout && <Ajout db={db} maj={maj} toast={toast} recette={ajout === 'new' ? null : ajout} onClose={() => setAjout(null)} onOuvrir={r => setFiche(r)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Catalogue : recherche et filtres
// ---------------------------------------------------------------------------
function Catalogue({ db, recettes, avis, ouvrir, nouvelle }) {
  const possedes = appareilsPossedes(db);
  const mangeurs = mangeursDu(db);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [filtres, setFiltres] = useState(false);
  const [style, setStyle] = useState('');
  const [app, setApp] = useState('');
  const [tags, setTags] = useState([]);
  const [stock, setStock] = useState(false);
  const [favoris, setFavoris] = useState(false);
  const [voirMasquees, setVoirMasquees] = useState(false);
  const [tri, setTri] = useState('stock');
  const [n, setN] = useState(PAGE);

  const base = useMemo(() => {
    const nq = norm(q);
    return recettes.filter(r => {
      const a = avis.get(r.id);
      if (a?.cachee && !voirMasquees) return false;
      if (voirMasquees && !a?.cachee) return false;
      if (cat && r.categorie !== cat) return false;
      if (style && r.style !== style) return false;
      if (favoris && !((a?.note || 0) >= 4)) return false;
      if (tags.length && !tags.every(t => (t === 'tout-seul' ? r.tags.includes(t) || r.variantes.some(v => tourneSeule(v)) : r.tags.includes(t)))) return false;
      if (app ? !r.variantes.some(v => v.appareils.includes(app)) : !recetteFaisable(r, possedes)) return false;
      if (nq && !norm(r.titre + ' ' + r.origine + ' ' + r.ingredients.map(i => i.nom).join(' ')).includes(nq)) return false;
      return true;
    });
  }, [recettes, avis, q, cat, style, app, tags, favoris, voirMasquees, possedes]);

  // Disponibilité selon le stock (calculée seulement pour ce qui est affiché ou filtré)
  const avecStock = useMemo(() => {
    const liste = base.map(r => {
      const c = couverture(db, r, r.personnes);
      const refus = r.ingredients.some(i => !i.optionnel && refusePar(i.nom, mangeurs).length);
      return { r, c, refus };
    });
    const filtre = stock ? liste.filter(x => x.c.manquants.length === 0) : liste;
    const note = x => avis.get(x.r.id)?.note || 0;
    return filtre.sort((a, b) => (tri === 'stock' ? a.c.manquants.length - b.c.manquants.length || b.c.score - a.c.score
      : tri === 'note' ? note(b) - note(a) : tri === 'rapide' ? (dureeTotale(a.r) || 999) - (dureeTotale(b.r) || 999) : a.r.titre.localeCompare(b.r.titre, 'fr')));
  }, [base, db.produits, db.liens, stock, tri, avis]); // eslint-disable-line react-hooks/exhaustive-deps

  const faisables = avecStock.filter(x => x.c.manquants.length === 0).length;
  const actifs = [style, app, stock, favoris, voirMasquees].filter(Boolean).length + tags.length;

  return (
    <>
      <div className="card hero hero-lilac">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Mes recettes</div>
            <div className="hero-big">{recettes.length} recettes</div>
            <div className="hero-sub">{faisables > 0 ? <>✅ <b>{faisables}</b> faisable{faisables > 1 ? 's' : ''} avec ton stock{cat || actifs || q ? ' (sélection)' : ''}</> : 'Suis tes produits dans « Maison » pour voir ce qui est faisable'}</div>
          </div>
          <div className="hero-emoji">👩‍🍳</div>
        </div>
        <input className="input" placeholder="🔎 Une recette, un ingrédient (ex : courgette)…" value={q} onChange={e => { setQ(e.target.value); setN(PAGE); }} />
      </div>

      <div className="mag-chips">
        <button className={'mag-chip' + (!cat ? ' on' : '')} style={{ '--c': '#E6DAFF' }} onClick={() => setCat('')}>Tout</button>
        {CATS_RECETTE.map(c => (
          <button key={c.id} className={'mag-chip' + (cat === c.id ? ' on' : '')} style={{ '--c': c.couleur }} onClick={() => { setCat(cat === c.id ? '' : c.id); setN(PAGE); }}>
            <span className="mag-chip-emoji">{c.emoji}</span> {c.nom}
          </button>
        ))}
      </div>

      <div className="row gap">
        <button className={'btn btn-small ' + (stock ? 'btn-main' : 'btn-ghost')} onClick={() => setStock(!stock)}>🏠 Avec mon stock</button>
        <button className={'btn btn-small ' + (actifs - (stock ? 1 : 0) ? 'btn-main' : 'btn-ghost')} onClick={() => setFiltres(true)}>⚙️ Filtres{actifs - (stock ? 1 : 0) ? ` (${actifs - (stock ? 1 : 0)})` : ''}</button>
        <span className="grow" />
        <button className="btn btn-small btn-main btn-ajout" onClick={nouvelle} aria-label="Ajouter une recette"><Icon name="plus" size={18} /></button>
      </div>

      {avecStock.length === 0 && (
        <Empty emoji="🍳" titre="Aucune recette ne correspond" texte={stock ? 'Rien n’est faisable entièrement avec le stock actuel : retire « Avec mon stock » pour voir ce qu’il manque.' : 'Essaie avec moins de filtres.'} />
      )}
      <div className="stack">
        {avecStock.slice(0, n).map(({ r, c, refus }) => <CarteRecette key={r.id} r={r} c={c} refus={refus} a={avis.get(r.id)} possedes={possedes} onClick={() => ouvrir(r)} />)}
      </div>
      {avecStock.length > n && <button className="btn btn-ghost" onClick={() => setN(n + PAGE)}>Voir plus ({avecStock.length - n})</button>}

      <Sheet open={filtres} onClose={() => setFiltres(false)} title="⚙️ Filtres" footer={<button className="btn btn-big btn-main" onClick={() => setFiltres(false)}>Voir {avecStock.length} recette{avecStock.length > 1 ? 's' : ''}</button>}>
        <b>Style</b>
        <div className="chips-wrap">
          {STYLES.map(s => <button key={s.id} className={'chip chip-toggle' + (style === s.id ? ' on' : '')} style={{ '--c': '#FFE3C7' }} onClick={() => setStyle(style === s.id ? '' : s.id)}>{s.emoji} {s.nom}</button>)}
        </div>
        <b>Appareil</b>
        <div className="chips-wrap">
          {appareilsDu(db).map(a => <button key={a.id} className={'chip chip-toggle' + (app === a.id ? ' on' : '')} style={{ '--c': '#E6DAFF' }} onClick={() => setApp(app === a.id ? '' : a.id)}>{a.emoji} {a.nom}{!a.possede && <span className="chip-sub"> · bientôt</span>}</button>)}
        </div>
        <p className="muted small">Sans appareil choisi, seules les recettes faisables avec tes appareils cochés sont affichées.</p>
        <b>Envies</b>
        <div className="chips-wrap">
          {TAGS.map(t => <button key={t.id} className={'chip chip-toggle' + (tags.includes(t.id) ? ' on' : '')} style={{ '--c': '#D4F5DD' }} onClick={() => setTags(x => (x.includes(t.id) ? x.filter(y => y !== t.id) : [...x, t.id]))}>{t.emoji} {t.nom}</button>)}
        </div>
        <b>Trier par</b>
        <Segmented value={tri} onChange={setTri} options={[
          { value: 'stock', label: 'Stock', emoji: '🏠' },
          { value: 'note', label: 'Note', emoji: '⭐' },
          { value: 'rapide', label: 'Rapide', emoji: '⚡' },
          { value: 'az', label: 'A-Z' },
        ]} />
        <div className="toggle-box"><Toggle checked={favoris} onChange={setFavoris} label="⭐ Seulement mes recettes notées 4 ou 5" /></div>
        <div className="toggle-box"><Toggle checked={voirMasquees} onChange={setVoirMasquees} label="🙈 Voir les recettes masquées" /></div>
        {actifs > 0 && <button className="btn btn-ghost" onClick={() => { setStyle(''); setApp(''); setTags([]); setStock(false); setFavoris(false); setVoirMasquees(false); }}>Effacer les filtres</button>}
      </Sheet>
    </>
  );
}

function CarteRecette({ r, c, refus, a, possedes, onClick, extra }) {
  const catR = CATS_RECETTE.find(x => x.id === r.categorie);
  const apps = [...new Set(r.variantes.flatMap(v => v.appareils))].filter(x => x !== 'aucun');
  const d = dureeTotale(r);
  return (
    <button className="recette-carte" onClick={onClick} style={{ '--c': catR?.couleur }}>
      <span className="recette-emoji">{r.emoji || catR?.emoji}</span>
      <span className="grow">
        <b className="recette-titre">{r.titre}</b>
        <span className="muted small block">
          {catR?.un}{d ? ` · ⏱️ ${dureeTxt(d)}` : ''}{r.style === 'monde' && r.origine ? ` · 🌍 ${r.origine}` : r.style === 'festif' ? ' · 🎉' : ''}
          {a?.note ? <> · <span className="etoile on">★</span>{a.note}</> : null}
        </span>
        <span className="recette-apps">
          {apps.map(x => <span key={x} className={'app-pastille' + (possedes.has(x) ? '' : ' off')} title={appareil(x).nom}>{appareil(x).emoji}</span>)}
          {c && (c.manquants.length > 0 ? <span className="etat etat-court">🛒 {c.manquants.length} à acheter</span>
            : c.nonSuivis === 0 ? <span className="etat etat-ok">🟢 Tout est là</span>
              : <span className="etat etat-nonsuivi" title="Certains ingrédients ne sont pas suivis dans le stock">🟢 Rien ne manque · {c.nonSuivis} à vérifier</span>)}
          {refus && <span className="etat etat-manque">🚫</span>}
          {(r.source === 'perso' || r.source === 'import') && <span className="etat etat-nonsuivi">✍️</span>}
        </span>
      </span>
      {extra}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mon repas : plusieurs recettes, stock vérifié pour l'ENSEMBLE du repas, planning
// ---------------------------------------------------------------------------
const COMPOSITIONS = [
  { id: 'simple', nom: 'Plat seul', cats: ['plat'] },
  { id: 'classique', nom: 'Plat + dessert', cats: ['plat', 'dessert'] },
  { id: 'complet', nom: 'Entrée + plat + dessert', cats: ['entree', 'plat', 'dessert'] },
  { id: 'soupe', nom: 'Soupe + plat', cats: ['soupe', 'plat'] },
  { id: 'fete', nom: 'Grand repas', cats: ['entree', 'salade', 'plat', 'accompagnement', 'dessert'] },
];

function Repas({ db, maj, toast, recettes, ouvrir, allerCatalogue }) {
  const possedes = appareilsPossedes(db);
  const mangeurs = mangeursDu(db);
  const items = (db.repas || []).map(it => ({ ...it, recette: recettes.find(r => r.id === it.recetteId) })).filter(it => it.recette);
  const [compo, setCompo] = useState('complet');
  const [personnes, setPersonnes] = useState(() => recettes.length ? 5 : 4);
  const [styleIdee, setStyleIdee] = useState('');
  const [graine, setGraine] = useState(1);
  const [idee, setIdee] = useState(null);
  const [heure, setHeure] = useState('19:30');
  const [voirOk, setVoirOk] = useState(false);
  const [mange, setMange] = useState(false);

  const lignes = useMemo(() => besoinsRepas(db, items), [db.produits, db.liens, db.repas, recettes]); // eslint-disable-line react-hooks/exhaustive-deps
  const manquants = lignesManquantes(lignes);
  const okLignes = lignes.filter(l => !manquants.includes(l));
  const plan = useMemo(() => (items.length ? planifier(items, heure, possedes) : null), [db.repas, heure, recettes]); // eslint-disable-line react-hooks/exhaustive-deps

  const proposer = (seed = Math.random() * 1000) => {
    const c = COMPOSITIONS.find(x => x.id === compo);
    const res = proposerRepas(db, recettes, { cats: c.cats, personnes, mangeurs, styles: styleIdee ? [styleIdee] : [], seed, exclure: items.map(i => i.recetteId) });
    setIdee(res);
    setGraine(seed);
  };
  const garderIdee = () => {
    maj(d => idee.forEach(x => d.repas.push({ id: uid(), recetteId: x.recette.id, personnes, variante: varianteParDefaut(x.recette, possedes), remplacements: {} })));
    setIdee(null);
    toast('Repas prêt 🍽️ Vérifie le stock ci-dessous');
  };
  const setItem = (id, fn) => maj(d => { const it = d.repas.find(x => x.id === id); if (it) fn(it); });
  const vider = () => { if (confirm('Vider le repas ?')) maj(d => { d.repas = []; }); };
  const ajouterManquants = () => {
    maj(d => manquants.forEach(l => ajouterALaListe(d, l.produit ? l.produit.nom : l.nom, qteAAcheter(l))));
    toast(`${manquants.length} article${manquants.length > 1 ? 's' : ''} ajouté${manquants.length > 1 ? 's' : ''} à la liste 🛒`);
  };

  return (
    <>
      <div className="card hero hero-pink">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Idée de repas</div>
            <div className="hero-big">Avec ce que j’ai</div>
            <div className="hero-sub">L’appli vérifie le stock pour tout le repas à la fois.</div>
          </div>
          <div className="hero-emoji">💡</div>
        </div>
        <div className="chips-wrap">
          {COMPOSITIONS.map(c => <button key={c.id} className={'chip chip-white' + (compo === c.id ? ' chip-sel' : '')} onClick={() => setCompo(c.id)}>{c.nom}</button>)}
        </div>
        <div className="chips-wrap">
          <button className={'chip chip-white' + (!styleIdee ? ' chip-sel' : '')} onClick={() => setStyleIdee('')}>Toutes envies</button>
          {STYLES.map(s => <button key={s.id} className={'chip chip-white' + (styleIdee === s.id ? ' chip-sel' : '')} onClick={() => setStyleIdee(styleIdee === s.id ? '' : s.id)}>{s.emoji} {s.nom}</button>)}
        </div>
        <div className="row-between">
          <span className="row gap"><b>👥</b>
            <span className="stepper stepper-blanc">
              <button onClick={() => setPersonnes(p => Math.max(1, p - 1))} aria-label="Moins"><Icon name="minus" size={18} /></button>
              <span className="stepper-val">{personnes}</span>
              <button onClick={() => setPersonnes(p => p + 1)} aria-label="Plus"><Icon name="plus" size={18} /></button>
            </span>
          </span>
          <button className="btn btn-main" onClick={() => proposer()}><Icon name="sparkle" size={18} /> Propose-moi</button>
        </div>
      </div>

      {idee && (
        <div className="card stack">
          <div className="row-between"><b>💡 Proposition</b><button className="btn btn-small btn-ghost" onClick={() => proposer(graine + 7)}>🔄 Autre idée</button></div>
          {idee.length === 0 && <p className="muted small">Pas de recette trouvée pour cette composition.</p>}
          {idee.map(x => (
            <div key={x.recette.id} className="idee-row">
              <button className="grow idee-main" onClick={() => ouvrir(x.recette)}>
                <b>{x.recette.emoji} {x.recette.titre}</b>
                <span className="muted small block">{CATS_RECETTE.find(c => c.id === x.recette.categorie)?.un} · {x.manquants.length ? `🛒 il manque : ${x.manquants.slice(0, 3).map(m => m.nom).join(', ')}${x.manquants.length > 3 ? '…' : ''}` : '🟢 tout est en stock'}</span>
              </button>
            </div>
          ))}
          {idee.length > 0 && <button className="btn btn-big btn-main" onClick={garderIdee}>Garder ce repas</button>}
        </div>
      )}

      {items.length === 0 && !idee && (
        <Empty emoji="🍽️" titre="Ton repas est vide" texte="Demande une idée ci-dessus, ou ajoute des recettes depuis le catalogue (bouton « Au repas » dans chaque recette).">
          <button className="btn btn-main" onClick={allerCatalogue}>Parcourir les recettes</button>
        </Empty>
      )}

      {items.length > 0 && (
        <>
          <div className="row-between section-title"><b>🍽️ Au menu</b><button className="lien small" onClick={vider}>Vider</button></div>
          <div className="stack">
            {[...items].sort((a, b) => CATS_RECETTE.findIndex(c => c.id === a.recette.categorie) - CATS_RECETTE.findIndex(c => c.id === b.recette.categorie)).map(it => {
              const r = it.recette;
              const v = r.variantes[it.variante] || r.variantes[0];
              return (
                <div key={it.id} className="card repas-item">
                  <button className="grow idee-main" onClick={() => ouvrir(r)}>
                    <b>{r.emoji} {r.titre}</b>
                    <span className="muted small block">{CATS_RECETTE.find(c => c.id === r.categorie)?.un} · {v.appareils.map(a => appareil(a).emoji + ' ' + appareil(a).nom).join(' + ')}{Object.keys(it.remplacements || {}).length ? ' · ✏️ ingrédients remplacés' : ''}</span>
                  </button>
                  <div className="repas-actions">
                    {r.variantes.length > 1 && (
                      <select className="input select-mini" value={it.variante} onChange={e => setItem(it.id, x => { x.variante = Number(e.target.value); })} aria-label="Version">
                        {r.variantes.map((x, i) => <option key={i} value={i}>{x.appareils.map(a => appareil(a).emoji).join('')} {x.nom || x.appareils.map(a => appareil(a).nom).join(' + ')}{x.appareils.every(a => possedes.has(a)) ? '' : ' (bientôt)'}</option>)}
                      </select>
                    )}
                    <div className="stepper">
                      <button onClick={() => setItem(it.id, x => { x.personnes = Math.max(1, (x.personnes || r.personnes) - 1); })} aria-label="Moins"><Icon name="minus" size={16} /></button>
                      <span className="stepper-val">{it.personnes || r.personnes}👤</span>
                      <button onClick={() => setItem(it.id, x => { x.personnes = (x.personnes || r.personnes) + 1; })} aria-label="Plus"><Icon name="plus" size={16} /></button>
                    </div>
                    <button className="icon-btn" onClick={() => maj(d => { d.repas = d.repas.filter(x => x.id !== it.id); })} aria-label="Retirer"><Icon name="x" size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={'card ' + (manquants.length ? 'card-peach' : 'hero-mint')}>
            <div className="row-between">
              <b>{manquants.length ? `🧺 Il manque ${manquants.length} ingrédient${manquants.length > 1 ? 's' : ''}` : '🟢 Tout est en stock pour ce repas'}</b>
            </div>
            <p className="muted small">Calculé pour l’ensemble du repas : un même ingrédient utilisé dans plusieurs recettes est additionné.</p>
            {manquants.length > 0 && (
              <>
                <div className="list-card bilan">
                  {manquants.map(l => (
                    <div key={l.cle} className="bilan-row">
                      <span className="grow"><b>{l.nom}</b><span className="muted small block">besoin {l.besoinTexte || 'un peu'}{l.dispoTexte ? ` · il reste ${l.dispoTexte}` : ''}{l.recettes.length > 1 ? ` · ${l.recettes.length} recettes` : ''}</span></span>
                      <BadgeEtat etat={l.etat} />
                    </div>
                  ))}
                </div>
                <button className="btn btn-main btn-full" onClick={ajouterManquants}><Icon name="cart" /> Tout ajouter à ma liste</button>
              </>
            )}
            <button className="lien small" onClick={() => setVoirOk(!voirOk)}>{voirOk ? 'Masquer' : 'Voir'} les {okLignes.length} autres ingrédients</button>
            {voirOk && (
              <div className="list-card bilan">
                {okLignes.map(l => (
                  <div key={l.cle} className="bilan-row">
                    <span className="grow"><b>{l.nom}</b><span className="muted small block">{l.besoinTexte ? `besoin ${l.besoinTexte}` : ''}{l.dispoTexte ? ` · il reste ${l.dispoTexte}` : ''}</span></span>
                    <BadgeEtat etat={l.etat} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {plan && (
            <div className="card stack">
              <div className="row-between">
                <b>⏰ Planning</b>
                <label className="row gap small">À table à <input type="time" className="input input-heure" value={heure} onChange={e => setHeure(e.target.value)} /></label>
              </div>
              {plan.alertes.map((a, i) => <div key={i} className="alerte-plan small">⚠️ {a}</div>)}
              <div className="timeline">
                {plan.evenements.map((e, i) => (
                  <div key={i} className={'tl-row tl-' + e.surveillance}>
                    <span className="tl-heure">{e.heure}</span>
                    <span className="tl-point">{appareil(e.appareil).emoji}</span>
                    <span className="grow"><b className="small">{e.recette}</b><span className="small block">{e.texte}</span></span>
                  </div>
                ))}
                <div className="tl-row tl-service"><span className="tl-heure">{plan.service}</span><span className="tl-point">🍽️</span><span className="grow"><b>À table !</b></span></div>
              </div>
              <p className="muted small">🔥 = rester à côté · 😴 = ça cuit tout seul, profites-en pour lancer la suite.</p>
            </div>
          )}

          <button className="btn btn-big btn-pink" onClick={() => setMange(true)}>😋 On a mangé ! Mettre à jour le stock</button>
        </>
      )}

      {mange && (
        <Decompte
          lignes={lignes} recettes={items.map(i => i.recetteId)} db={db} maj={maj} toast={toast}
          onClose={() => setMange(false)}
          onFini={() => { if (confirm('Vider le repas maintenant qu’il est cuisiné ?')) maj(d => { d.repas = []; }); }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Ma cuisine : appareils (dont le futur Cookeo), qui mange quoi
// ---------------------------------------------------------------------------
function MaCuisine({ db, maj, toast, nouvelle, recettes }) {
  const apps = appareilsDu(db);
  const mangeurs = mangeursDu(db);
  const [ajoutExclu, setAjoutExclu] = useState({});
  const [nouveau, setNouveau] = useState('');
  const parApp = id => recettes.filter(r => r.variantes.some(v => v.appareils.includes(id))).length;

  const basculer = a => maj(d => {
    d.appareils = appareilsDu(d).filter(x => !x.toujours).map(x => ({ id: x.id, possede: x.id === a.id ? !x.possede : x.possede }));
  });
  const majMangeurs = fn => maj(d => { d.mangeurs = structuredClone(mangeursDu(d)); fn(d.mangeurs); });

  return (
    <>
      <div className="card hero hero-sky">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Ma cuisine</div>
            <div className="hero-big">{apps.filter(a => a.possede && !a.toujours).length} appareils</div>
            <div className="hero-sub">Les recettes s’adaptent à ce que tu as coché.</div>
          </div>
          <div className="hero-emoji">🔧</div>
        </div>
      </div>

      <div className="card list-card">
        {apps.filter(a => !a.toujours).map(a => (
          <div key={a.id} className="stock-row">
            <span className="item-emoji">{a.emoji}</span>
            <span className="grow"><b>{a.nom}</b>{a.bientot && !a.possede && <span className="chip-badge bientot">bientôt</span>}
              <span className="muted small block">{a.detail} · {parApp(a.id)} recettes</span>
            </span>
            <button className={'suivi-btn' + (a.possede ? ' on' : '')} onClick={() => { basculer(a); if (a.bientot && !a.possede) toast(`🎉 ${a.nom} activé : ses recettes apparaissent !`); }}>
              {a.possede ? '✅ Je l’ai' : a.bientot ? 'Je l’ai acheté !' : 'Je l’ai'}
            </button>
          </div>
        ))}
      </div>

      <div className="row-between section-title"><b>🍴 Qui mange quoi</b></div>
      <p className="muted small tip">Les ingrédients refusés sont signalés dans les recettes, avec des remplacements proposés.</p>
      <div className="stack">
        {mangeurs.map((m, mi) => (
          <div key={m.id} className="card stack-s">
            <div className="row gap">
              <input className="input emoji-mini" value={m.emoji || ''} onChange={e => majMangeurs(ms => { ms[mi].emoji = e.target.value.slice(0, 4); })} placeholder="🙂" aria-label="Emoji" />
              <input className="input grow" value={m.nom} onChange={e => majMangeurs(ms => { ms[mi].nom = e.target.value; })} aria-label="Nom" />
              {mangeurs.length > 1 && <button className="icon-btn" onClick={() => { if (confirm(`Retirer ${m.nom} ?`)) majMangeurs(ms => ms.splice(mi, 1)); }} aria-label="Retirer"><Icon name="trash" size={18} /></button>}
            </div>
            <div className="chips-wrap">
              {(m.exclus || []).map(x => <button key={x} className="chip chip-white" onClick={() => majMangeurs(ms => { ms[mi].exclus = ms[mi].exclus.filter(y => y !== x); })}>🚫 {x} <Icon name="x" size={12} /></button>)}
              {!(m.exclus || []).length && <span className="muted small">Mange de tout 😋</span>}
            </div>
            <div className="row gap">
              <input className="input grow" placeholder="Ne mange pas… (ex : champignons)" value={ajoutExclu[m.id] || ''} onChange={e => setAjoutExclu(x => ({ ...x, [m.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter' && (ajoutExclu[m.id] || '').trim()) { majMangeurs(ms => { ms[mi].exclus = [...new Set([...(ms[mi].exclus || []), ajoutExclu[m.id].trim().toLowerCase()])]; }); setAjoutExclu(x => ({ ...x, [m.id]: '' })); } }} />
              <button className="btn btn-small btn-main" disabled={!(ajoutExclu[m.id] || '').trim()} onClick={() => { majMangeurs(ms => { ms[mi].exclus = [...new Set([...(ms[mi].exclus || []), ajoutExclu[m.id].trim().toLowerCase()])]; }); setAjoutExclu(x => ({ ...x, [m.id]: '' })); }}>Ajouter</button>
            </div>
          </div>
        ))}
        <div className="row gap">
          <input className="input grow" placeholder="Ajouter une personne (ex : Lohan)" value={nouveau} onChange={e => setNouveau(e.target.value)} />
          <button className="btn btn-main" disabled={!nouveau.trim()} onClick={() => { majMangeurs(ms => ms.push({ id: uid(), nom: nouveau.trim(), emoji: '🙂', exclus: [] })); setNouveau(''); }}><Icon name="plus" size={18} /></button>
        </div>
      </div>

      <div className="row-between section-title"><b>➕ Mes recettes</b></div>
      <div className="card stack-s">
        <p className="muted small" style={{ margin: 0 }}>{(db.recettes || []).length} recette{(db.recettes || []).length > 1 ? 's' : ''} perso ou importée{(db.recettes || []).length > 1 ? 's' : ''}. Une recette papier, une capture, un fichier ? L’appli prépare la consigne pour ton IA et importe sa réponse.</p>
        <button className="btn btn-main" onClick={nouvelle}><Icon name="plus" size={18} /> Ajouter une recette</button>
      </div>

      {(db.liens || []).length > 0 && (
        <>
          <div className="row-between section-title"><b>🔗 Ingrédients reliés à mon stock</b></div>
          <div className="card list-card">
            {db.liens.map(l => (
              <div key={l.id} className="stock-row">
                <span className="grow"><b>{l.nom || l.id}</b><span className="muted small block">→ {db.produits.find(p => p.id === l.produitId)?.nom || 'article supprimé'}</span></span>
                <button className="icon-btn" onClick={() => maj(d => { d.liens = d.liens.filter(x => x.id !== l.id); })} aria-label="Retirer"><Icon name="x" size={18} /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
