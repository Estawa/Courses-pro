import { useMemo, useRef, useState } from 'react';
import Icon from '../icons.jsx';
import { Sheet } from '../ui.jsx';
import { appareil, catRecette, STYLES, TAGS } from '../../data/cuisine.js';
import {
  appareilsPossedes, besoinsRepas, lignesManquantes, qteAAcheter, remplacementsPour, refusePar,
  mangeursDu, varianteParDefaut, varianteFaisable, dureeVariante, exporterRecette, texteRecette,
  cleIngredient, slug, trouverProduit,
} from '../../lib/recettes.js';
import { ajouterALaListe } from '../../lib/store.js';
import { uid, norm } from '../../lib/utils.js';
import { compresserPhoto, enregistrerPhoto } from '../../lib/photos.js';
import Decompte from './Decompte.jsx';
import {
  Etoiles, BadgeEtat, majAvis, surveillanceTxt, dureeTxt, qteIng, usePhoto, foyerDe,
  partagerTexte, telechargerFichier,
} from './commun.jsx';

export default function Fiche({ recette: r, db, maj, toast, onClose, onModifier, avis }) {
  const possedes = appareilsPossedes(db);
  const tousMangeurs = mangeursDu(db);
  const [personnes, setPersonnes] = useState(r.personnes);
  const [variante, setVariante] = useState(() => varianteParDefaut(r, possedes));
  const [mangeurs, setMangeurs] = useState(() => tousMangeurs.map(m => m.id));
  const [remp, setRemp] = useState({});
  const [ouvert, setOuvert] = useState(null); // index de l'ingrédient dont on choisit le remplacement
  const [autre, setAutre] = useState('');
  const [cuisine, setCuisine] = useState(false);
  const [photo, setPhoto] = usePhoto(db, r.id, avis?.photo);
  const [commentaire, setCommentaire] = useState(avis?.commentaire || '');
  const fichierPhoto = useRef();

  const choisis = tousMangeurs.filter(m => mangeurs.includes(m.id));
  const k = personnes / r.personnes;
  const v = r.variantes[variante] || r.variantes[0];
  const item = { recette: r, personnes, variante, remplacements: remp };
  const lignes = useMemo(() => besoinsRepas(db, [item]), [db.produits, db.liens, personnes, remp, r]); // eslint-disable-line react-hooks/exhaustive-deps
  const etatDe = nom => {
    const p = trouverProduit(db.produits, nom, db.liens);
    const cle = p ? 'p:' + p.id : 'n:' + norm(nom);
    return lignes.find(l => l.cle === cle);
  };
  const manquants = lignesManquantes(lignes);
  const cat = catRecette(r.categorie);
  const style = STYLES.find(s => s.id === r.style);
  const perso = r.source !== 'catalogue';

  const ajouterManquants = () => {
    maj(d => manquants.forEach(l => ajouterALaListe(d, l.produit ? l.produit.nom : l.nom, qteAAcheter(l))));
    toast(`${manquants.length} ingrédient${manquants.length > 1 ? 's' : ''} ajouté${manquants.length > 1 ? 's' : ''} à la liste 🛒`);
  };
  const ajouterAuRepas = () => {
    maj(d => { d.repas.push({ id: uid(), recetteId: r.id, personnes, variante, remplacements: remp }); });
    toast(`« ${r.titre} » ajouté au repas 🍽️`);
    onClose();
  };
  const noter = n => maj(d => majAvis(d, r.id, a => { a.note = n; }));
  const enregistrerCommentaire = () => {
    if ((avis?.commentaire || '') === commentaire) return;
    maj(d => majAvis(d, r.id, a => { a.commentaire = commentaire.trim(); }));
    toast('Commentaire enregistré ✍️');
  };
  const choisirPhoto = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = await compresserPhoto(f);
      setPhoto(url);
      await enregistrerPhoto(foyerDe(db), r.id, url);
      maj(d => majAvis(d, r.id, a => { a.photo = true; }));
      toast('Photo enregistrée 📸');
    } catch { toast('Impossible d’enregistrer la photo 😕'); }
  };
  const retirerPhoto = async () => {
    if (!confirm('Retirer la photo de cette recette ?')) return;
    setPhoto(null);
    await enregistrerPhoto(foyerDe(db), r.id, null).catch(() => {});
    maj(d => majAvis(d, r.id, a => { a.photo = false; }));
  };
  const lier = (nom, produitId) => {
    maj(d => {
      d.liens = (d.liens || []).filter(l => l.id !== cleIngredient(nom));
      if (produitId) d.liens.push({ id: cleIngredient(nom), produitId, nom });
    });
    toast(produitId ? 'Ingrédient relié à ton stock 🔗' : 'Lien retiré');
  };
  const copierPourModifier = () => {
    const copie = { ...structuredClone(r), id: 'perso-' + slug(r.titre) + '-' + Date.now().toString(36).slice(-4), titre: r.titre + ' (ma version)', source: 'perso' };
    maj(d => { d.recettes.push(copie); });
    toast('Copie créée : tu peux la modifier ✏️');
    onModifier(copie);
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${r.titre} » ?`)) return;
    maj(d => { d.recettes = d.recettes.filter(x => x.id !== r.id); d.repas = d.repas.filter(x => x.recetteId !== r.id); });
    onClose();
  };
  const masquer = () => {
    maj(d => majAvis(d, r.id, a => { a.cachee = !a.cachee; }));
    toast(avis?.cachee ? 'Recette de nouveau visible' : 'Recette masquée du catalogue');
    if (!avis?.cachee) onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`${r.emoji || cat.emoji} ${r.titre}`} footer={
      <div className="actions-bas">
        <button className="btn btn-ghost" onClick={() => setCuisine(true)}>👩‍🍳 Je l’ai cuisinée</button>
        <button className="btn btn-main" onClick={ajouterAuRepas}>🍽️ Au repas</button>
      </div>
    }>
      {photo && (
        <div className="photo-recette">
          <img src={photo} alt={r.titre} />
          <button className="icon-btn photo-x" onClick={retirerPhoto} aria-label="Retirer la photo"><Icon name="trash" size={18} /></button>
        </div>
      )}

      <div className="chips-wrap">
        <span className="chip" style={{ background: cat.couleur }}>{cat.emoji} {cat.un}</span>
        {style && <span className="chip chip-white">{style.emoji} {style.nom}{r.origine ? ' · ' + r.origine : ''}</span>}
        {r.tags.map(t => { const x = TAGS.find(y => y.id === t); return x ? <span key={t} className="chip chip-white">{x.emoji} {x.nom}</span> : null; })}
        {perso && <span className="chip chip-white">✍️ {r.source === 'import' ? 'Importée' : 'Ma recette'}</span>}
      </div>

      <div className="row-between">
        <Etoiles value={avis?.note || 0} onChange={noter} />
        <span className="muted small">{avis?.faite ? `Cuisinée ${avis.faite} fois` : 'Jamais cuisinée'}</span>
      </div>

      <div className="card fiche-reglages">
        <div className="row-between">
          <b>👥 Personnes</b>
          <div className="stepper">
            <button onClick={() => setPersonnes(p => Math.max(1, p - 1))} aria-label="Moins"><Icon name="minus" size={18} /></button>
            <span className="stepper-val">{personnes}</span>
            <button onClick={() => setPersonnes(p => p + 1)} aria-label="Plus"><Icon name="plus" size={18} /></button>
          </div>
        </div>
        {r.variantes.length > 1 && (
          <div className="stack-s">
            <b>🔧 Version</b>
            <div className="chips-wrap">
              {r.variantes.map((x, i) => {
                const ok = varianteFaisable(x, possedes);
                return (
                  <button key={i} className={'chip chip-toggle' + (i === variante ? ' on' : '') + (ok ? '' : ' chip-off')} style={{ '--c': '#E6DAFF' }} onClick={() => setVariante(i)}>
                    {x.appareils.map(a => appareil(a).emoji).join('')} {x.nom || x.appareils.map(a => appareil(a).nom).join(' + ')}
                    {!ok && <span className="chip-sub"> · {x.appareils.includes('cookeo') ? 'bientôt' : 'pas coché'}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tousMangeurs.length > 1 && (
          <div className="stack-s">
            <b>🍴 Qui mange ?</b>
            <div className="chips-wrap">
              {tousMangeurs.map(m => (
                <button key={m.id} className={'chip chip-toggle' + (mangeurs.includes(m.id) ? ' on' : '')} style={{ '--c': '#D4F5DD' }}
                  onClick={() => setMangeurs(x => (x.includes(m.id) ? x.filter(y => y !== m.id) : [...x, m.id]))}>{m.emoji || '🙂'} {m.nom}</button>
              ))}
            </div>
          </div>
        )}
        <div className="muted small">⏱️ {dureeTxt(dureeVariante(r, v)) || '—'} · {'★'.repeat(r.difficulte)}{'☆'.repeat(3 - r.difficulte)} difficulté</div>
      </div>

      <div className="row-between">
        <h3 className="fiche-h3">🧺 Ingrédients</h3>
        {manquants.length > 0 && <button className="btn btn-small btn-main" onClick={ajouterManquants}><Icon name="cart" size={16} /> {manquants.length} à acheter</button>}
      </div>
      <div className="card list-card">
        {r.ingredients.map((ing, i) => {
          const nom = remp[i] || ing.nom;
          const L = etatDe(nom);
          const refus = refusePar(nom, choisis);
          const opts = ouvert === i ? remplacementsPour(db, ing, choisis) : [];
          return (
            <div key={i} className={'ing' + (refus.length ? ' ing-refus' : '') + (ing.optionnel && !remp[i] ? ' ing-opt' : '')}>
              <div className="ing-row">
                <span className="ing-qte">{qteIng(ing, k)}</span>
                <span className="grow">
                  <b>{nom}</b>{remp[i] && <span className="muted small"> (au lieu de {ing.nom})</span>}
                  {ing.optionnel && <span className="muted small"> · facultatif</span>}
                  <span className="block">
                    {L ? <BadgeEtat etat={L.etat} /> : ing.optionnel ? null : <BadgeEtat etat="basique" />}
                    {L && L.dispoTexte && ['ok', 'court', 'manque'].includes(L.etat) && <span className="muted small"> · il reste {L.dispoTexte}</span>}
                    {refus.length > 0 && <span className="etat etat-manque"> 🚫 {refus.join(', ')} n’en mange pas</span>}
                  </span>
                </span>
                <button className={'icon-btn swap-btn' + (refus.length ? ' alerte' : '')} onClick={() => { setOuvert(ouvert === i ? null : i); setAutre(''); }} aria-label="Remplacer"><Icon name="swap" size={18} /></button>
              </div>
              {ouvert === i && (
                <div className="remp-panel">
                  <div className="muted small">Remplacer « {ing.nom} » par :</div>
                  <div className="chips-wrap">
                    {opts.map(o => (
                      <button key={o.nom} className="chip chip-white" onClick={() => { setRemp(x => ({ ...x, [i]: o.nom })); setOuvert(null); }}>
                        {o.enStock ? '🏠 ' : ''}{o.nom}{o.enStock && <span className="chip-badge">en stock</span>}
                      </button>
                    ))}
                    {opts.length === 0 && <span className="muted small">Pas d’idée toute prête : écris ton remplacement 👇</span>}
                  </div>
                  <div className="row gap">
                    <input className="input grow" placeholder="Autre ingrédient…" value={autre} onChange={e => setAutre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && autre.trim()) { setRemp(x => ({ ...x, [i]: autre.trim() })); setOuvert(null); } }} />
                    <button className="btn btn-small btn-main" disabled={!autre.trim()} onClick={() => { setRemp(x => ({ ...x, [i]: autre.trim() })); setOuvert(null); }}>OK</button>
                  </div>
                  <div className="quick-row">
                    {remp[i] && <button className="btn btn-small btn-ghost" onClick={() => { setRemp(x => { const y = { ...x }; delete y[i]; return y; }); setOuvert(null); }}>↩️ Remettre {ing.nom}</button>}
                    <button className="btn btn-small btn-ghost" onClick={() => { maj(d => ajouterALaListe(d, L?.produit ? L.produit.nom : nom, L ? qteAAcheter(L) : '')); toast(`${nom} ajouté à la liste 🛒`); setOuvert(null); }}>🛒 L’acheter</button>
                  </div>
                  {db.produits.length > 0 && (
                    <label className="field">
                      <span className="field-hint">🔗 Dans mon stock, « {nom} » correspond à :</span>
                      <select className="input" value={(db.liens || []).find(l => l.id === cleIngredient(nom))?.produitId || ''} onChange={e => lier(nom, e.target.value)}>
                        <option value="">{L?.produit ? `Automatique : ${L.produit.nom}` : 'Aucun article (choisir…)'}</option>
                        {[...db.produits].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="fiche-h3">📝 Préparation{v.nom ? ` — ${v.nom}` : ''}</h3>
      {!varianteFaisable(v, possedes) && <p className="muted small">⚠️ Cette version demande {v.appareils.filter(a => !possedes.has(a)).map(a => appareil(a).nom).join(', ')} (à cocher dans « Ma cuisine » quand tu l’auras).</p>}
      <ol className="etapes">
        {v.etapes.map((e, i) => (
          <li key={i}>
            <div>{e.texte}</div>
            <div className="muted small">{appareil(e.appareil).emoji} {appareil(e.appareil).nom}{e.duree_min ? ` · ${dureeTxt(e.duree_min)}` : ''} · {surveillanceTxt(e.surveillance)}</div>
          </li>
        ))}
      </ol>
      {r.astuce && <div className="card card-yellow small">💡 {r.astuce}</div>}

      <h3 className="fiche-h3">💬 Mon avis</h3>
      <textarea className="input textarea textarea-s" placeholder="Un commentaire ? (ex : mettre moins de sel, les enfants ont adoré…)" value={commentaire} onChange={e => setCommentaire(e.target.value)} onBlur={enregistrerCommentaire} />
      <div className="quick-row">
        <button className="btn btn-ghost" onClick={() => fichierPhoto.current.click()}><Icon name="camera" size={18} /> {photo ? 'Changer la photo' : 'Ajouter une photo'}</button>
        <input ref={fichierPhoto} type="file" accept="image/*" hidden onChange={choisirPhoto} />
        {commentaire !== (avis?.commentaire || '') && <button className="btn btn-main" onClick={enregistrerCommentaire}>Enregistrer</button>}
      </div>

      <div className="quick-row">
        <button className="btn btn-small btn-ghost" onClick={() => partagerTexte(texteRecette(r, personnes, variante), toast, r.titre)}><Icon name="share" size={16} /> Envoyer</button>
        <button className="btn btn-small btn-ghost" onClick={() => telechargerFichier(slug(r.titre) + '.json', exporterRecette(r))}><Icon name="download" size={16} /> Fichier</button>
        {perso
          ? <button className="btn btn-small btn-ghost" onClick={() => onModifier(r)}><Icon name="edit" size={16} /> Modifier</button>
          : <button className="btn btn-small btn-ghost" onClick={copierPourModifier}><Icon name="edit" size={16} /> Ma version</button>}
        {perso
          ? <button className="btn btn-small btn-ghost danger" onClick={supprimer}><Icon name="trash" size={16} /></button>
          : <button className="btn btn-small btn-ghost" onClick={masquer}>{avis?.cachee ? '👁️ Afficher' : '🙈 Masquer'}</button>}
      </div>

      {cuisine && <Decompte lignes={lignes} recettes={[r.id]} db={db} maj={maj} toast={toast} onClose={() => setCuisine(false)} />}
    </Sheet>
  );
}
