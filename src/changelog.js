export const CHANGELOG = [
  {
    version: '1.4.1',
    date: '2026-10-15',
    notes: [
      'Choix de l’unité à côté de la quantité : Kg, Gr, Cl ou L (à l’ajout d’un article et dans la liste du jour)',
      'Un article ajouté deux fois avec la même unité s’additionne (500 Gr + 250 Gr = 750 Gr)',
      'Fiche article de la maison : unités Kg / Gr / Cl / L en un geste',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-10-15',
    notes: [
      'L’appli démarre sans réseau : le foyer est mémorisé sur le téléphone et tous les fichiers de l’appli sont gardés en cache dès l’installation',
      'Réseau faible au magasin : au bout de 3 secondes sans réponse, l’appli s’ouvre avec la version enregistrée',
      'Rayons protégés : modifier un magasin n’envoie plus que ce qui a changé, un téléphone pas à jour ne peut plus effacer les rayons créés sur un autre',
      'Nouveaux rayons dans ton magasin : Bio Legumes - Fruits, Bio Conserves, Bio Jus, Bio Frais, Bio Crèmerie, Bio Sauces et Apero (ajoutés en fin de parcours, à déplacer comme tu veux)',
      'Copie automatique des données chaque jour sur le téléphone (10 derniers jours), restaurable depuis le menu',
    ],
  },
  {
    version: '1.3.1',
    date: '2026-10-14',
    notes: [
      'Base commune branchée sur le projet Firebase vma-pro-seances (connexion Google / e-mail, règles de sécurité publiées)',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-14',
    notes: [
      'Nombre de rayons illimité + nouveau modèle « Hypermarché type » (41 rayons, articles déjà placés)',
      'Partage de l’organisation d’un magasin par WhatsApp (lien ou message à copier) : rayons, repères, catégories et articles placés',
      'Import d’une organisation reçue avec aperçu modifiable : garder/écarter des rayons, réordonner, renommer, retirer des articles, repérer les rayons qui existent déjà chez toi',
      'Import en nouveau magasin ou en remplacement des rayons d’un magasin existant (en gardant tes articles placés dans les rayons de même nom)',
      'Nouvel onglet « Aperçu » dans chaque magasin : tous les rayons avec tous leurs articles',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-14',
    notes: [
      'Appli partagée = 100 % locale : sans connexion au foyer, rien n’est envoyé à Firebase',
      'Connexion au foyer familial discrète (en bas du menu) ou par lien d’invitation ; seul le compte de Christophe peut créer le foyer (vérifié aussi par les règles Firebase)',
      'Rayons personnalisés : à la création, la fiche du rayon s’ouvre pour y ranger des articles (existants ou nouveaux)',
      'Fiche rayon : section « Articles rangés ici » (ajout, création d’article, retrait)',
      'Fiche article : choix du rayon dans chaque magasin',
      'Nouvel article ajouté à la liste : l’appli demande tout de suite dans quel rayon le trouver (ou créer un rayon)',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-14',
    notes: [
      'Base de données commune Firebase : un « foyer » partagé, synchronisé en temps réel entre plusieurs téléphones',
      'Connexion par Google ou par e-mail / mot de passe',
      'Invitation par code à 6 caractères ou par lien envoyé sur WhatsApp, changement de code possible',
      'Gestion des membres du foyer (voir, retirer, quitter), déconnexion',
      'Règles de sécurité : seuls les membres connectés d’un foyer peuvent lire ou écrire ses données',
      'Bouton « Partager l’appli » pour qu’un autre foyer l’utilise avec ses propres données',
      'Reprise des données déjà présentes sur le téléphone lors de la création du foyer',
      'Fonctionne aussi hors connexion (cache local), mode sans compte toujours possible',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-14',
    notes: [
      'Première version de Courses Pro 🎉',
      'Magasins favoris avec rayons modélisés dans l’ordre de parcours (glisser-déposer, flèches, repères d’allée)',
      'Plan rapide catégorie → rayon pour suivre les réorganisations des magasins',
      'Articles placés à la main dans un rayon précis, directement depuis le magasin (bouton 📍)',
      'Listes reçues sur WhatsApp (partage direct sur Android, coller sur iPhone) : ce qui est déjà en stock à la maison ou déjà sur la liste n’est pas importé',
      'Recherche « combien il m’en reste » dans l’onglet Maison + stock affiché dans les suggestions',
      'Liste du jour triée selon le parcours du magasin choisi + mode « au magasin » avec cases à cocher',
      'Mes listes : créer, coller une liste existante (quantités reconnues), ajouter en un geste',
      'Stock maison : seuils d’alerte, suggestions de rachat, mise à jour automatique après la caisse',
      'Dépenses : montant à chaque passage en caisse, budget mensuel, graphiques 12 mois et par magasin',
      'Sauvegarde / restauration (fichier JSON), mode jour / nuit, installable sur le téléphone',
    ],
  },
];
