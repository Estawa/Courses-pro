// Mode « solo » : appli partagée SANS la connexion au foyer familial.
// Un lien de partage terminé par ?solo=1 active ce mode sur le téléphone qui l'ouvre :
// le bouton « Connexion au foyer familial » disparaît et l'appli reste 100 % locale.
// Seul un vrai lien d'invitation au foyer (?rejoindre=CODE) peut lever ce mode.
const CLE = 'courses-pro-solo';
const lire = k => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* */ } };

// Ce téléphone appartient-il déjà au foyer ? (on ne le bascule jamais en solo par erreur)
const dejaFoyer = () => lire('courses-pro-mode') === 'cloud' || !!lire('courses-pro-foyer-connu');

function initialiser() {
  const u = new URL(window.location.href);
  if (u.searchParams.has('rejoindre')) { ecrire(CLE, null); return false; }
  if (u.searchParams.get('solo') === '1' && !dejaFoyer()) ecrire(CLE, '1');
  const solo = lire(CLE) === '1';
  if (solo) {
    // Garde ?solo=1 dans l'adresse et dans le manifeste : l'icône « écran d'accueil »
    // (surtout sur iPhone, où elle a son propre stockage) rouvre l'appli en mode solo.
    if (u.searchParams.get('solo') !== '1') {
      u.searchParams.set('solo', '1');
      window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    const lien = document.querySelector('link[rel="manifest"]');
    if (lien) lien.setAttribute('href', '/manifest-solo.webmanifest');
  }
  return solo;
}

export const modeSolo = initialiser();

// Liens de partage de l'appli
export const lienSolo = () => `${window.location.origin}/?solo=1`;
export const lienAvecFoyer = () => `${window.location.origin}/`;
