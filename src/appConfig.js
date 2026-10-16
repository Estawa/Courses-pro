// Réglages propres à l'appli (convention du socle commun)
export const appConfig = {
  nom: 'Courses Pro',
  auteur: 'C. Guilhem',
  version: '1.6.3',
  pinActif: false,          // appli personnelle : pas de code d'accès
  identificationEleve: false,
  multiProfs: false,
  // Seuls ces comptes peuvent créer le foyer familial (base Firebase partagée).
  // Les autres membres le rejoignent par invitation. Toute autre personne utilise l'appli en local.
  // ⚠️ Garder la même liste dans firestore.rules.
  emailsFoyer: ['cguilhem77310@gmail.com'],
};
