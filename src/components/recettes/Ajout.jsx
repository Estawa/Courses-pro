import { useRef, useState } from 'react';
import Icon from '../icons.jsx';
import { Field, Segmented, Sheet } from '../ui.jsx';
import { APPAREILS, CATS_RECETTE, STYLES, TAGS, appareil } from '../../data/cuisine.js';
import {
  SOURCES_IMPORT, consigneIA, nomsRecette, listeAlias, lireReponseIA, normaliserRecette, lireLigneIngredient, lireLigneEtape, ligneIngredient,
} from '../../lib/recettes.js';
import { norm } from '../../lib/utils.js';
import { catalogue } from '../../data/recettes/index.js';
import { copierTexte, partagerTexte, telechargerFichier } from './commun.jsx';

// Ajouter une recette : avec une IA (consigne prête + import de la réponse) ou à la main.
// Avec « recette », sert aussi à modifier une recette perso.
export default function Ajout({ db, maj, toast, onClose, recette = null, onOuvrir }) {
  const [mode, setMode] = useState(recette ? 'main' : 'ia');
  return (
    <Sheet open onClose={onClose} title={recette ? '✏️ Modifier la recette' : '➕ Nouvelle recette'}>
      {!recette && (
        <Segmented value={mode} onChange={setMode} options={[
          { value: 'ia', label: 'Avec une IA', emoji: '🤖' },
          { value: 'main', label: 'À la main', emoji: '✍️' },
        ]} />
      )}
      {mode === 'ia' ? <AvecIA db={db} maj={maj} toast={toast} onClose={onClose} onOuvrir={onOuvrir} /> : <ALaMain db={db} maj={maj} toast={toast} onClose={onClose} recette={recette} onOuvrir={onOuvrir} />}
    </Sheet>
  );
}

function AvecIA({ db, maj, toast, onClose, onOuvrir }) {
  const [source, setSource] = useState('photo');
  const [precision, setPrecision] = useState('');
  const [reponse, setReponse] = useState('');
  const [resultat, setResultat] = useState(null); // [{ recette, alertes, garder }]
  const [erreur, setErreur] = useState('');
  const fichier = useRef();
  const src = SOURCES_IMPORT.find(s => s.id === source);
  const consigne = () => consigneIA(db, source, precision);
  const existants = new Set([...catalogue(), ...(db.recettes || [])].flatMap(nomsRecette).map(norm));

  const analyser = texte => {
    setErreur('');
    try {
      const res = lireReponseIA(texte);
      setResultat(res.map(x => ({ ...x, garder: true, doublon: nomsRecette(x.recette).some(n => existants.has(norm(n))) })));
    } catch (e) { setResultat(null); setErreur(e.message); }
  };
  const lireFichier = e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setReponse(String(r.result)); analyser(String(r.result)); };
    r.readAsText(f);
  };
  const enregistrer = () => {
    const a = resultat.filter(x => x.garder).map(x => x.recette);
    if (!a.length) return;
    maj(d => { a.forEach(rec => { d.recettes = d.recettes.filter(x => x.id !== rec.id); d.recettes.push(rec); }); });
    toast(`${a.length} recette${a.length > 1 ? 's' : ''} ajoutée${a.length > 1 ? 's' : ''} 🎉`);
    onClose();
    if (a.length === 1) onOuvrir?.(a[0]);
  };

  return (
    <>
      <div className="etape-titre"><span className="etape-num">1</span> D’où vient la recette ?</div>
      <div className="stack">
        {SOURCES_IMPORT.map(s => (
          <button key={s.id} className={'liste-opt' + (source === s.id ? ' opt-on' : '')} onClick={() => setSource(s.id)}>
            <span className="liste-emoji">{s.emoji}</span>
            <span className="grow"><b>{s.nom}</b><span className="muted small block">{s.sub}</span></span>
            {source === s.id && <Icon name="check" />}
          </button>
        ))}
      </div>

      <div className="card card-peach">
        <b>{src.emoji} Pour un résultat parfait</b>
        <ul className="journal">{src.conseils.map((c, i) => <li key={i}>{c}</li>)}</ul>
      </div>

      <div className="etape-titre"><span className="etape-num">2</span> Envoie la consigne à ton IA</div>
      <Field label="Précision (facultatif)" hint="Ex : « pour 5 personnes », « ajoute une version Cookeo et une version plancha »">
        <input className="input" value={precision} onChange={e => setPrecision(e.target.value)} placeholder="Une demande en plus…" />
      </Field>
      <div className="quick-row">
        <button className="btn btn-main" onClick={() => copierTexte(consigne(), toast, 'Consigne copiée 📋 Colle-la dans ton IA')}><Icon name="copy" size={18} /> Copier la consigne</button>
        <button className="btn btn-ghost" onClick={() => partagerTexte(consigne(), toast, 'Consigne recette')}><Icon name="share" size={18} /> Partager</button>
      </div>
      <div className="quick-row">
        <a className="btn btn-small btn-ghost" href="https://claude.ai/new" target="_blank" rel="noreferrer">Ouvrir Claude</a>
        <a className="btn btn-small btn-ghost" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Ouvrir ChatGPT</a>
        <button className="btn btn-small btn-ghost" onClick={() => telechargerFichier('consigne-recette-courses-pro.txt', consigne(), 'text/plain')}><Icon name="download" size={16} /> .txt</button>
      </div>
      <p className="muted small">Dans l’IA : colle la consigne, {source === 'photo' ? 'joins ta ou tes photos' : source === 'fichier' ? 'joins ton fichier' : source === 'idee' ? 'écris ton envie' : 'colle ta recette ou ta capture'}, envoie. Elle répond par un bloc de texte JSON : copie toute sa réponse.</p>
      <details className="consigne-voir"><summary>Voir la consigne</summary><pre className="wa-bulle consigne-pre">{consigne()}</pre></details>

      <div className="etape-titre"><span className="etape-num">3</span> Importe la réponse</div>
      <textarea className="input textarea" placeholder="Colle ici la réponse de l’IA…" value={reponse} onChange={e => setReponse(e.target.value)} />
      <div className="quick-row">
        <button className="btn btn-ghost" onClick={async () => { try { const t = await navigator.clipboard.readText(); setReponse(t); analyser(t); } catch { toast('Colle la réponse dans le cadre ci-dessus'); } }}><Icon name="paste" size={18} /> Coller</button>
        <button className="btn btn-ghost" onClick={() => fichier.current.click()}><Icon name="upload" size={18} /> Fichier .json</button>
        <input ref={fichier} type="file" accept="application/json,.json,.txt,text/plain" hidden onChange={lireFichier} />
        <button className="btn btn-main" disabled={!reponse.trim()} onClick={() => analyser(reponse)}>Lire</button>
      </div>
      {erreur && <div className="card card-peach small">😕 {erreur}</div>}

      {resultat && (
        <div className="stack">
          {resultat.map((x, i) => (
            <div key={i} className={'card apercu-recette' + (x.garder ? '' : ' off')}>
              <div className="row gap">
                <button className={'check' + (x.garder ? ' on' : '')} onClick={() => setResultat(rs => rs.map((y, n) => (n === i ? { ...y, garder: !y.garder } : y)))} aria-label="Garder">{x.garder && <Icon name="check" size={16} />}</button>
                <span className="grow"><b>{x.recette.emoji} {x.recette.titre}</b>
                  <span className="muted small block">{CATS_RECETTE.find(c => c.id === x.recette.categorie)?.un} · {x.recette.personnes} pers. · {x.recette.ingredients.length} ingrédients · {x.recette.variantes.map(v => v.appareils.map(a => appareil(a).emoji).join('')).join(' / ')}</span>
                </span>
              </div>
              {x.doublon && <div className="muted small">⚠️ Tu as déjà une recette avec ce titre : elle sera ajoutée en plus.</div>}
              {x.alertes.map((a, n) => <div key={n} className="muted small">⚠️ {a}</div>)}
            </div>
          ))}
          <button className="btn btn-big btn-main" disabled={!resultat.some(x => x.garder)} onClick={enregistrer}>Enregistrer {resultat.filter(x => x.garder).length > 1 ? `les ${resultat.filter(x => x.garder).length} recettes` : 'la recette'}</button>
        </div>
      )}
    </>
  );
}

function ALaMain({ maj, toast, onClose, recette, onOuvrir }) {
  const v0 = recette?.variantes?.[0];
  const [f, setF] = useState(() => ({
    titre: recette?.titre || '', alias: (recette?.alias || []).join(' ; '), emoji: recette?.emoji || '', categorie: recette?.categorie || 'plat', style: recette?.style || 'quotidien',
    origine: recette?.origine || '', personnes: recette?.personnes || 5, preparation_min: recette?.preparation_min ?? '',
    difficulte: recette?.difficulte || 1, tags: recette?.tags || [], astuce: recette?.astuce || '',
    ingredients: (recette?.ingredients || []).map(ligneIngredient).join('\n'),
    appareils: v0?.appareils || ['plaque'],
    etapes: (v0?.etapes || []).map(e => e.texte + (e.duree_min ? ` (${e.duree_min} min)` : '')).join('\n'),
  }));
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const basculer = (k, id) => setF(x => ({ ...x, [k]: x[k].includes(id) ? x[k].filter(y => y !== id) : [...x[k], id] }));

  const enregistrer = () => {
    try {
      const ings = f.ingredients.split('\n').map(lireLigneIngredient).filter(Boolean);
      const etapesAnciennes = v0?.etapes || [];
      const etapes = f.etapes.split('\n').map(l => lireLigneEtape(l, f.appareils[0] || 'plaque')).filter(Boolean)
        .map((e, i) => { const a = etapesAnciennes[i]; return a && a.texte === e.texte ? { ...e, surveillance: a.surveillance, appareil: a.appareil } : e; });
      const brut = {
        ...(recette || {}), titre: f.titre, alias: listeAlias(f.alias, f.titre), emoji: f.emoji, categorie: f.categorie, style: f.style, origine: f.origine,
        personnes: f.personnes, preparation_min: f.preparation_min, difficulte: f.difficulte, tags: f.tags, astuce: f.astuce,
        ingredients: ings,
        variantes: [{ ...(v0 || {}), appareils: f.appareils.length ? f.appareils : ['plaque'], etapes }, ...(recette?.variantes || []).slice(1)],
      };
      const { recette: r } = normaliserRecette(brut, recette?.source || 'perso');
      maj(d => { d.recettes = d.recettes.filter(x => x.id !== r.id); d.recettes.push(r); });
      toast(recette ? 'Recette mise à jour ✅' : 'Recette ajoutée 🎉');
      onClose();
      onOuvrir?.(r);
    } catch (e) { toast(e.message); }
  };

  return (
    <>
      <div className="row gap">
        <input className="input emoji-mini" value={f.emoji} onChange={e => set('emoji', e.target.value.slice(0, 4))} placeholder="🍽️" aria-label="Emoji" />
        <input className="input grow" value={f.titre} onChange={e => set('titre', e.target.value)} placeholder="Nom de la recette" />
      </div>
      <Field label="Autres noms (facultatif)" hint="Même recette, nom différent — séparés par « ; ». Ex : Amandine aux poires ; Bourdaloue">
        <input className="input" value={f.alias} onChange={e => set('alias', e.target.value)} placeholder="Autre nom ; autre nom" />
      </Field>
      <div className="grid2">
        <Field label="Catégorie"><select className="input" value={f.categorie} onChange={e => set('categorie', e.target.value)}>{CATS_RECETTE.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.un}</option>)}</select></Field>
        <Field label="Style"><select className="input" value={f.style} onChange={e => set('style', e.target.value)}>{STYLES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nom}</option>)}</select></Field>
        <Field label="Personnes"><input className="input" inputMode="numeric" value={f.personnes} onChange={e => set('personnes', e.target.value)} /></Field>
        <Field label="Préparation (min)"><input className="input" inputMode="numeric" value={f.preparation_min} onChange={e => set('preparation_min', e.target.value)} /></Field>
      </div>
      {f.style === 'monde' && <Field label="Origine"><input className="input" value={f.origine} onChange={e => set('origine', e.target.value)} placeholder="Italie, Maroc…" /></Field>}
      <Field label="Étiquettes">
        <div className="chips-wrap">{TAGS.map(t => <button key={t.id} type="button" className={'chip chip-toggle' + (f.tags.includes(t.id) ? ' on' : '')} style={{ '--c': '#FFE3C7' }} onClick={() => basculer('tags', t.id)}>{t.emoji} {t.nom}</button>)}</div>
      </Field>
      <Field label="Ingrédients (un par ligne)" hint="Ex : « 500 g de pâtes », « 2 oignons », « 20 cl crème fraîche ou crème liquide », « persil (facultatif) »">
        <textarea className="input textarea" value={f.ingredients} onChange={e => set('ingredients', e.target.value)} placeholder={'500 g de pâtes\n2 oignons\n1 c. à soupe d\'huile d\'olive\nsel, poivre'} />
      </Field>
      <Field label="Appareil(s)">
        <div className="chips-wrap">{APPAREILS.map(a => <button key={a.id} type="button" className={'chip chip-toggle' + (f.appareils.includes(a.id) ? ' on' : '')} style={{ '--c': '#E6DAFF' }} onClick={() => basculer('appareils', a.id)}>{a.emoji} {a.nom}</button>)}</div>
      </Field>
      <Field label="Étapes (une par ligne)" hint="Ajoute la durée entre parenthèses : « Cuire les pâtes (12 min) »">
        <textarea className="input textarea" value={f.etapes} onChange={e => set('etapes', e.target.value)} placeholder={'Faire revenir les oignons (5 min)\nAjouter la crème et laisser mijoter (10 min)'} />
      </Field>
      {(recette?.variantes?.length || 0) > 1 && <p className="muted small">Les {recette.variantes.length - 1} autre(s) version(s) de cette recette sont conservées telles quelles.</p>}
      <Field label="Astuce (facultatif)"><input className="input" value={f.astuce} onChange={e => set('astuce', e.target.value)} /></Field>
      <button className="btn btn-big btn-main" disabled={!f.titre.trim() || !f.ingredients.trim()} onClick={enregistrer}>Enregistrer</button>
    </>
  );
}
