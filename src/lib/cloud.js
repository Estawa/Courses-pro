// Base partagée Firebase : connexion, foyer (famille) et synchronisation en temps réel.
// Toutes les données sont rangées sous coursesPro_foyers/{foyerId}/… et protégées par firestore.rules :
// seuls les membres connectés d'un foyer peuvent lire ou écrire ses données.
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, deleteDoc, updateDoc, collection, onSnapshot, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig, cloudConfigure } from '../firebase.js';

const P = 'coursesPro_';
export const COLLECTIONS = ['produits', 'magasins', 'liste', 'listes', 'achats'];

let app, auth, fs;
function init() {
  if (app) return;
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  try {
    // Cache local persistant : l'appli marche aussi sans réseau au magasin
    fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    fs = getFirestore(app);
  }
}

const refFoyer = f => doc(fs, P + 'foyers', f);
const refMembre = (f, u) => doc(fs, P + 'foyers', f, 'membres', u);
const refUser = u => doc(fs, P + 'users', u);
const refInvit = c => doc(fs, P + 'invitations', c);
const refDoc = (f, col, id) => doc(fs, P + 'foyers', f, col, id);
const refReglages = f => doc(fs, P + 'foyers', f, 'etat', 'reglages');

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => {
  const a = new Uint32Array(6);
  crypto.getRandomValues(a);
  return Array.from(a, n => ALPHA[n % ALPHA.length]).join('');
};
// Firestore refuse les "undefined" : on nettoie par un aller-retour JSON
const propre = o => JSON.parse(JSON.stringify(o));

export const MESSAGES = {
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/missing-password': 'Mot de passe manquant.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail : connecte-toi.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cet e-mail.',
  'auth/too-many-requests': 'Trop d’essais : patiente quelques minutes.',
  'auth/popup-closed-by-user': 'Connexion annulée.',
  'auth/network-request-failed': 'Pas de connexion internet.',
  'auth/unauthorized-domain': 'Ce site n’est pas autorisé dans Firebase (Authentication > Paramètres > Domaines autorisés).',
  'permission-denied': 'Accès refusé.',
};
export const messageErreur = e => MESSAGES[e?.code] || e?.message || 'Erreur inattendue';

export const cloud = {
  actif: cloudConfigure,

  onAuth(cb) {
    init();
    return onAuthStateChanged(auth, cb);
  },
  async google() {
    init();
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, p);
    } catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) {
        await signInWithRedirect(auth, p);
      } else throw e;
    }
  },
  async email(mail, mdp, creer, nom) {
    init();
    if (creer) {
      const r = await createUserWithEmailAndPassword(auth, mail.trim(), mdp);
      if (nom?.trim()) await updateProfile(r.user, { displayName: nom.trim() });
      return r.user;
    }
    return (await signInWithEmailAndPassword(auth, mail.trim(), mdp)).user;
  },
  reset(mail) { init(); return sendPasswordResetEmail(auth, mail.trim()); },
  deconnexion() { init(); return signOut(auth); },

  // Foyer de l'utilisateur (vérifie qu'il en est toujours membre)
  async monFoyer(user) {
    init();
    const s = await getDoc(refUser(user.uid));
    const f = s.exists() ? s.data().foyerId : null;
    if (!f) return null;
    try {
      const m = await getDoc(refMembre(f, user.uid));
      return m.exists() ? f : null;
    } catch {
      return null;
    }
  },

  async creerFoyer(user, nom, donnees) {
    init();
    const f = genId();
    await setDoc(refFoyer(f), { nom: nom.trim() || 'Notre foyer', creePar: user.uid, cree: serverTimestamp(), code: '' });
    await setDoc(refMembre(f, user.uid), { nom: user.displayName || user.email || 'Moi', email: user.email || '', depuis: serverTimestamp(), code: '' });
    await this.nouveauCode(f, '');
    await setDoc(refUser(user.uid), { foyerId: f });
    if (donnees) await this.pousser(f, null, donnees);
    return f;
  },

  async rejoindre(user, codeSaisi) {
    init();
    const code = codeSaisi.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) throw new Error('Le code comporte 6 caractères.');
    const inv = await getDoc(refInvit(code));
    if (!inv.exists()) throw new Error('Code inconnu ou expiré. Demande le nouveau code.');
    const f = inv.data().foyerId;
    await setDoc(refMembre(f, user.uid), { nom: user.displayName || user.email || 'Membre', email: user.email || '', depuis: serverTimestamp(), code });
    await setDoc(refUser(user.uid), { foyerId: f });
    return f;
  },

  // Crée un nouveau code d'invitation et désactive l'ancien
  async nouveauCode(f, ancien) {
    init();
    const code = genCode();
    await setDoc(refInvit(code), { foyerId: f, cree: serverTimestamp() });
    await updateDoc(refFoyer(f), { code });
    if (ancien) await deleteDoc(refInvit(ancien)).catch(() => {});
    return code;
  },
  renommer(f, nom) { init(); return updateDoc(refFoyer(f), { nom }); },
  retirer(f, uid) { init(); return deleteDoc(refMembre(f, uid)); },
  async quitter(f, user) {
    init();
    await deleteDoc(refMembre(f, user.uid));
    await deleteDoc(refUser(user.uid)).catch(() => {});
  },

  // Écoute en temps réel : cb(cle, valeur) pour chaque morceau, onErreur(e) si l'accès est perdu
  ecouter(f, cb, onErreur) {
    init();
    const tri = arr => arr.sort((a, b) => (a._t || 0) - (b._t || 0) || String(a.id).localeCompare(String(b.id)));
    const err = e => onErreur?.(e);
    const unsubs = [
      onSnapshot(refFoyer(f), s => cb('_foyer', s.exists() ? { id: f, ...s.data() } : null), err),
      onSnapshot(collection(fs, P + 'foyers', f, 'membres'), s => cb('_membres', s.docs.map(d => ({ uid: d.id, ...d.data() }))), err),
      onSnapshot(refReglages(f), s => cb('_reglages', s.exists() ? s.data() : {}), err),
      ...COLLECTIONS.map(col =>
        onSnapshot(collection(fs, P + 'foyers', f, col), s => cb(col, tri(s.docs.map(d => ({ ...d.data(), id: d.id })))), err),
      ),
    ];
    return () => unsubs.forEach(u => u());
  },

  // Envoie seulement ce qui a changé entre prev et next (articles ajoutés, modifiés, supprimés)
  pousser(f, prev, next) {
    init();
    const ops = [];
    const now = Date.now();
    COLLECTIONS.forEach(col => {
      const avant = new Map((prev?.[col] || []).map(o => [o.id, o]));
      const apres = next[col] || [];
      apres.forEach((o, i) => {
        if (!o._t) o._t = (avant.get(o.id)?._t) || now + i; // ordre de création
        const a = avant.get(o.id);
        if (!a || JSON.stringify(a) !== JSON.stringify(o)) {
          const { id, ...data } = o;
          ops.push(b => b.set(refDoc(f, col, id), propre(data)));
        }
        avant.delete(o.id);
      });
      avant.forEach((_, id) => ops.push(b => b.delete(refDoc(f, col, id))));
    });
    if ((prev?.reglages?.budget || 0) !== (next.reglages?.budget || 0)) {
      ops.push(b => b.set(refReglages(f), { budget: next.reglages.budget || 0 }, { merge: true }));
    }
    const lots = [];
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(fs);
      ops.slice(i, i + 400).forEach(op => op(b));
      lots.push(b.commit());
    }
    return Promise.all(lots);
  },
};
