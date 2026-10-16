# Courses Pro by C. Guilhem

Appli de courses (PWA installable) : liste du jour triée dans l'ordre des rayons du magasin choisi,
magasins favoris modélisés rayon par rayon, listes enregistrées, réception de listes WhatsApp,
stock maison avec suggestions de rachat, suivi des dépenses après chaque passage en caisse.
Base commune Firebase partagée par foyer (temps réel, protégée).

## Stack
React 18 + Vite 5, Firebase (Auth + Firestore), CSS maison (thème pastel jour/nuit).
Par défaut l'appli est **100 % locale** (données sur le téléphone, aucun appel à Firebase) :
c'est ce que reçoit toute personne avec qui on partage le lien.
Le foyer familial (Firebase) ne s'active que via « Connexion au foyer familial » (en bas du menu ⋯)
ou un lien d'invitation. Seuls les comptes listés dans `emailsFoyer` (src/appConfig.js) et dans
`firestore.rules` peuvent créer le foyer ; les autres membres le rejoignent par invitation.

## Mise en route de la base commune (une seule fois)

### 1. Projet Firebase
Réutiliser un projet existant (le quota de projets est atteint) : toutes les données de Courses Pro
sont rangées dans des collections préfixées `coursesPro_…`, elles ne touchent pas l'autre appli.

### 2. Connexion (Authentication)
Console Firebase > Authentication > Sign-in method : activer **Google** et **Adresse e-mail/Mot de passe**.
Authentication > Paramètres > **Domaines autorisés** : ajouter l'adresse Vercel (ex. `courses-pro.vercel.app`).

### 3. Appli Web
Paramètres du projet > Vos applications > **Ajouter une appli Web** « Courses Pro » > copier la config
dans `src/firebase.js` (ou en variables Vercel `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`).

### 4. Règles de sécurité (indispensable)
Firestore Database > Règles : coller le bloc « COURSES PRO » de `firestore.rules`
**à l'intérieur** des règles existantes (ne pas effacer celles de l'autre appli), puis Publier.
Résultat : personne ne peut lire ni écrire sans être connecté **et** membre du foyer.

### 5. Utilisation
- Toi : menu ⋯ > « Connexion au foyer familial » > se connecter > « Créer notre foyer » (en reprenant les données du téléphone).
- Menu 👨‍👩‍👧 > « Envoyer l'invitation » : lien WhatsApp avec le code déjà rempli.
- Ta chérie : ouvre le lien > se connecte > « Rejoindre ».
- « Changer le code » rend l'ancien code inutilisable. « Retirer » coupe l'accès d'un membre.

## Déploiement
GitHub `Estawa/courses-pro` > Vercel (framework Vite détecté) > Deploy.

## Partager l'organisation d'un magasin
Magasins > un magasin > « Partager » : envoie un message WhatsApp avec le parcours et un lien.
Le destinataire ouvre le lien (ou colle le message dans Magasins > Importer), consulte et adapte
les rayons et articles, puis les ajoute comme nouveau magasin ou remplace les rayons d'un des siens.
Aucun serveur : toute l'organisation est contenue dans le lien.

## Recettes
Onglet « Recettes » : catalogue intégré (`src/data/recettes/lot*.js`, format compact décrit dans
`src/lib/recettes.js` > `lireCatalogue`), recettes perso / importées, notes, commentaires et photos.
- **Ma cuisine** : appareils possédés (le Cookeo est prévu : à cocher le jour de l’achat), qui mange quoi.
- **Stock** : chaque ingrédient est relié à un article de l’onglet Maison (automatiquement, ou à la main
  dans la fiche recette). Pour les articles comptés en paquets / pièces, renseigner la « contenance ».
- **Cuisiner** : un seul plat (apéritif → goûter) classé par coût / protéines / calories / note, ou un menu complet ; besoins cumulés de tout le repas, planning, mise à jour du stock vérifiée puis notation.
- **Calories, protéines, coût** : estimations par portion (`src/lib/nutrition.js`, table `src/data/nutrition.js` : clés, kcal et protéines pour 100 g, €/kg, poids d’une pièce).
- **Notes** : sur 10 par personne (`avis.notes`), la note affichée est la moyenne.
- **Import IA** : l’appli génère une consigne à coller dans n’importe quelle IA (Claude, ChatGPT…) ; la réponse
  JSON (collée ou en fichier .json) est importée. Le format est le même que l’export d’une recette.
- Données synchronisées dans le foyer : collections `recettes`, `avis`, `appareils`, `mangeurs`, `repas`, `liens`
  et `photos` (rien à changer dans firestore.rules : couvert par la règle des données du foyer).
- Ajouter un lot de recettes : créer `src/data/recettes/lotNN.js` et l’ajouter dans `src/data/recettes/index.js`.

## Recevoir une liste depuis WhatsApp
- Android (appli installée) : appui long sur le message → Partager → Courses Pro.
- iPhone : Copier, puis « Liste reçue 💬 » → « Coller depuis le presse-papiers ».
