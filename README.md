# Courses Pro by C. Guilhem

Appli de courses (PWA installable) : liste du jour triée dans l'ordre des rayons du magasin choisi,
magasins favoris modélisés rayon par rayon, listes enregistrées, réception de listes WhatsApp,
stock maison avec suggestions de rachat, suivi des dépenses après chaque passage en caisse.
Base commune Firebase partagée par foyer (temps réel, protégée).

## Stack
React 18 + Vite 5, Firebase (Auth + Firestore), CSS maison (thème pastel jour/nuit).
Sans configuration Firebase, l'appli tourne en mode local (données sur le téléphone).

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
- Toi : se connecter > « Créer notre foyer » (en reprenant les données du téléphone).
- Menu 👨‍👩‍👧 > « Envoyer l'invitation » : lien WhatsApp avec le code déjà rempli.
- Ta chérie : ouvre le lien > se connecte > « Rejoindre ».
- « Changer le code » rend l'ancien code inutilisable. « Retirer » coupe l'accès d'un membre.

## Déploiement
GitHub `Estawa/courses-pro` > Vercel (framework Vite détecté) > Deploy.

## Recevoir une liste depuis WhatsApp
- Android (appli installée) : appui long sur le message → Partager → Courses Pro.
- iPhone : Copier, puis « Liste reçue 💬 » → « Coller depuis le presse-papiers ».
