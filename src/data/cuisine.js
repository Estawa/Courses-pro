// Référentiel de l'onglet Recettes : appareils, catégories, unités, remplacements, contenances.

// Appareils de la cuisine. « bientot » : prévu (versions de recettes prêtes), à cocher le jour de l'achat.
export const APPAREILS = [
  { id: 'companion', nom: 'Companion', emoji: '🤖', detail: 'Moulinex Companion (classique)', possede: true },
  { id: 'cookeo', nom: 'Cookeo', emoji: '🍲', detail: 'Multicuiseur sous pression — bientôt', possede: false, bientot: true },
  { id: 'four', nom: 'Four', emoji: '🔥', detail: 'Four traditionnel', possede: true },
  { id: 'microondes', nom: 'Micro-ondes combiné', emoji: '📟', detail: 'Micro-ondes + grill + chaleur tournante', possede: true },
  { id: 'actifry', nom: 'Actifry', emoji: '🍟', detail: 'Seb Actifry (minuteur simple)', possede: true },
  { id: 'plaque', nom: 'Plaque de cuisson', emoji: '🍳', detail: 'Casserole, poêle, sauteuse', possede: true },
  { id: 'bbqgaz', nom: 'Barbecue gaz', emoji: '♨️', detail: 'Barbecue au gaz', possede: true },
  { id: 'braises', nom: 'Barbecue à braises', emoji: '🪵', detail: 'Charbon de bois', possede: true },
  { id: 'plancha', nom: 'Plancha électrique', emoji: '🥘', detail: 'Plancha électrique', possede: true },
  { id: 'aucun', nom: 'Sans cuisson', emoji: '🥗', detail: 'Rien à cuire', possede: true, toujours: true },
];
export const appareil = id => APPAREILS.find(a => a.id === id) || { id, nom: id, emoji: '🍽️' };
// Appareils qui s'occupent seuls (on peut faire autre chose pendant ce temps)
export const AUTONOMES = ['companion', 'cookeo', 'four', 'microondes', 'actifry'];

export const CATS_RECETTE = [
  { id: 'entree', nom: 'Entrées', un: 'Entrée', emoji: '🥟', couleur: '#FFE3C7' },
  { id: 'salade', nom: 'Salades', un: 'Salade', emoji: '🥗', couleur: '#D4F5DD' },
  { id: 'soupe', nom: 'Soupes', un: 'Soupe', emoji: '🍜', couleur: '#C6EFF3' },
  { id: 'plat', nom: 'Plats', un: 'Plat', emoji: '🍽️', couleur: '#FFD6E0' },
  { id: 'accompagnement', nom: 'Accompagnements', un: 'Accompagnement', emoji: '🥔', couleur: '#FFF3B0' },
  { id: 'dessert', nom: 'Desserts', un: 'Dessert', emoji: '🍰', couleur: '#FFD9F2' },
];
export const catRecette = id => CATS_RECETTE.find(c => c.id === id) || CATS_RECETTE[3];

// Moments du repas : ce qu'on peut demander à l'appli (un seul plat, ou plusieurs pour un menu).
// L'apéritif et le goûter piochent dans les entrées / desserts qui s'y prêtent.
export const MOMENTS = [
  { id: 'apero', nom: 'Apéritif', emoji: '🥂', cats: ['entree'] },
  { id: 'entree', nom: 'Entrée', emoji: '🥟', cats: ['entree'] },
  { id: 'soupe', nom: 'Soupe', emoji: '🍜', cats: ['soupe'] },
  { id: 'salade', nom: 'Salade', emoji: '🥗', cats: ['salade'] },
  { id: 'plat', nom: 'Plat principal', emoji: '🍽️', cats: ['plat'] },
  { id: 'accompagnement', nom: 'Accompagnement', emoji: '🥔', cats: ['accompagnement'] },
  { id: 'dessert', nom: 'Dessert', emoji: '🍰', cats: ['dessert'] },
  { id: 'gouter', nom: 'Goûter', emoji: '🧁', cats: ['dessert'] },
];
export const moment = id => MOMENTS.find(m => m.id === id) || MOMENTS[4];
// Menus tout prêts (raccourcis)
export const MENUS_TYPES = [
  { id: 'pd', nom: 'Plat + dessert', moments: ['plat', 'dessert'] },
  { id: 'epd', nom: 'Entrée + plat + dessert', moments: ['entree', 'plat', 'dessert'] },
  { id: 'sp', nom: 'Soupe + plat', moments: ['soupe', 'plat'] },
  { id: 'apero', nom: 'Apéro dînatoire', moments: ['apero', 'apero', 'apero', 'dessert'] },
  { id: 'fete', nom: 'Grand repas', moments: ['apero', 'entree', 'plat', 'accompagnement', 'dessert'] },
];

export const STYLES = [
  { id: 'quotidien', nom: 'Quotidien', emoji: '🏡' },
  { id: 'festif', nom: 'Festif', emoji: '🎉' },
  { id: 'monde', nom: 'Du monde', emoji: '🌍' },
];

export const TAGS = [
  { id: 'viande', nom: 'Viande', emoji: '🥩' },
  { id: 'poisson', nom: 'Poisson', emoji: '🐟' },
  { id: 'vegetarien', nom: 'Végétarien', emoji: '🌱' },
  { id: 'economique', nom: 'Économique', emoji: '💰' },
  { id: 'rapide', nom: 'Rapide', emoji: '⚡' },
  { id: 'grand-groupe', nom: 'Grand groupe', emoji: '👨‍👩‍👧‍👦' },
  { id: 'tout-seul', nom: 'Tourne tout seul', emoji: '😴' },
  { id: 'enfants', nom: 'Les enfants adorent', emoji: '🧒' },
];

// Unités autorisées dans une recette (format commun)
export const UNITES_RECETTE = [
  'g', 'kg', 'ml', 'cl', 'l', 'pièce', 'gousse', 'tranche', 'botte', 'brin', 'feuille',
  'boîte', 'sachet', 'paquet', 'pot', 'rouleau', 'c. à soupe', 'c. à café', 'pincée', 'verre', 'bol', '',
];

// Toujours supposés disponibles (pas besoin de les suivre dans le stock)
export const BASIQUES = ['sel', 'poivre', 'eau', 'eau chaude', 'eau froide', 'glacons', 'sel fin', 'gros sel', 'poivre noir'];

// Ce que la famille ne mange pas (modifiable dans « Ma cuisine »)
export const EXCLUS_DEFAUT = ['pois chiches', 'petits pois', 'lentilles'];

// Remplacements génériques (en plus de ceux prévus dans chaque recette)
export const SUBSTITUTIONS = {
  'petits pois': ['haricots verts', 'maïs', 'fèves', 'edamame'],
  'pois chiches': ['haricots blancs', 'haricots rouges', 'maïs'],
  'lentilles': ['boulgour', 'quinoa', 'haricots blancs', 'riz complet'],
  'creme fraiche': ['crème liquide', 'yaourt grec', 'mascarpone', 'fromage frais'],
  'creme liquide': ['crème fraîche', 'lait', 'lait de coco'],
  'beurre': ['margarine', 'huile'],
  'lait': ['lait végétal', 'crème liquide allongée d’eau'],
  'parmesan': ['emmental râpé', 'comté', 'grana padano'],
  'emmental rape': ['gruyère râpé', 'comté', 'mozzarella', 'parmesan'],
  'gruyere rape': ['emmental râpé', 'comté', 'mozzarella'],
  'mozzarella': ['emmental râpé', 'scamorza', 'burrata'],
  'lardons': ['dés de jambon', 'bacon', 'chorizo'],
  'jambon': ['blanc de dinde', 'bacon'],
  'oignon': ['échalote', 'oignon rouge', 'poireau'],
  'echalote': ['oignon'],
  'ail': ['ail en poudre', 'échalote'],
  'riz': ['quinoa', 'boulgour', 'semoule', 'pâtes'],
  'pates': ['riz', 'gnocchis', 'semoule'],
  'semoule': ['boulgour', 'quinoa', 'riz'],
  'pomme de terre': ['patate douce', 'céleri-rave'],
  'courgette': ['aubergine', 'poivron', 'potiron'],
  'aubergine': ['courgette'],
  'epinard': ['blettes', 'roquette', 'chou kale'],
  'poivron': ['courgette', 'tomate'],
  'carotte': ['panais', 'potiron', 'patate douce'],
  'tomate': ['tomates cerises', 'tomates concassées en boîte', 'coulis de tomate'],
  'boeuf hache': ['porc haché', 'veau haché', 'dinde hachée'],
  'steak hache': ['bœuf haché', 'dinde hachée'],
  'poulet': ['dinde', 'porc'],
  'blanc de poulet': ['escalopes de dinde', 'filet de porc'],
  'escalope de dinde': ['blanc de poulet', 'escalope de veau'],
  'cabillaud': ['colin', 'merlu', 'lieu noir', 'églefin'],
  'colin': ['cabillaud', 'merlu', 'lieu noir'],
  'saumon': ['truite', 'cabillaud'],
  'crevette': ['saint-jacques', 'calamars', 'poisson blanc'],
  'thon en boite': ['sardines en boîte', 'maquereau en boîte', 'saumon en boîte'],
  'citron': ['citron vert', 'vinaigre de cidre'],
  'citron vert': ['citron'],
  'vin blanc': ['bouillon de volaille', 'jus de pomme + filet de vinaigre'],
  'vin rouge': ['bouillon de bœuf + 1 c. à soupe de vinaigre balsamique', 'jus de raisin'],
  'mascarpone': ['ricotta', 'fromage frais', 'crème fraîche épaisse'],
  'ricotta': ['fromage frais', 'faisselle', 'mascarpone'],
  'chapelure': ['biscottes mixées', 'pain sec mixé', 'flocons d’avoine'],
  'sucre': ['sucre roux', 'miel', 'sirop d’érable'],
  'farine': ['maïzena', 'farine de riz'],
  'maizena': ['farine'],
  'oeuf': ['compote (pour un gâteau)', '1 c. à soupe de graines de chia + eau'],
  'bouillon de volaille': ['bouillon de légumes'],
  'bouillon de legumes': ['bouillon de volaille'],
  'persil': ['ciboulette', 'coriandre', 'basilic'],
  'coriandre': ['persil', 'menthe'],
  'basilic': ['persil', 'pesto'],
  'ciboulette': ['persil', 'oignon nouveau'],
  'creme de coco': ['lait de coco', 'crème liquide'],
  'lait de coco': ['crème liquide', 'crème de coco allongée'],
  'chorizo': ['lardons fumés', 'saucisson sec'],
  'feta': ['chèvre frais', 'mozzarella'],
  'chevre': ['feta', 'brie'],
  'mais': ['haricots verts', 'poivron'],
  'haricots rouges': ['haricots blancs', 'maïs'],
  'pate feuilletee': ['pâte brisée'],
  'pate brisee': ['pâte feuilletée'],
  'chocolat noir': ['chocolat au lait', 'cacao + beurre'],
  'yaourt': ['fromage blanc', 'skyr'],
  'fromage blanc': ['yaourt', 'skyr', 'faisselle'],
  'huile d olive': ['huile de tournesol', 'huile de colza'],
  'vinaigre balsamique': ['vinaigre de vin', 'jus de citron'],
  'miel': ['sirop d’érable', 'sucre'],
};

// Contenance moyenne d'une unité de produit quand le stock est compté en paquets / pièces
// (modifiable article par article dans l'onglet Maison)
export const CONTENANCES = {
  'pates': '500 g', 'riz': '1 kg', 'farine': '1 kg', 'sucre': '1 kg', 'semoule': '500 g', 'quinoa': '500 g',
  'boulgour': '500 g', 'lait': '1 l', 'beurre': '250 g', 'creme fraiche': '20 cl', 'creme liquide': '20 cl',
  'oeuf': '1 pièce', 'yaourt': '1 pièce', 'emmental rape': '200 g', 'gruyere rape': '200 g', 'mozzarella': '125 g',
  'lardons': '200 g', 'jambon': '4 tranche', 'chocolat': '200 g', 'chocolat noir': '200 g', 'sauce tomate': '500 g',
  'coulis de tomate': '500 g', 'tomates concassees': '400 g', 'thon en boite': '140 g', 'mais': '300 g',
  'haricots verts': '400 g', 'haricots rouges': '400 g', 'lait de coco': '40 cl', 'pate feuilletee': '1 rouleau',
  'pate brisee': '1 rouleau', 'pate a pizza': '1 rouleau', 'steak hache': '1 pièce', 'saumon': '2 pièce',
  'fromage blanc': '500 g', 'mascarpone': '250 g', 'parmesan': '100 g', 'feta': '200 g', 'chevre': '1 pièce',
  'huile d olive': '1 l', 'huile': '1 l', 'vinaigre': '50 cl', 'bouillon': '10 pièce', 'levure': '1 sachet',
  'sucre vanille': '1 sachet', 'champignon': '250 g', 'cacao': '250 g', 'chapelure': '250 g',
  'poudre d amande': '125 g', 'gnocchi': '500 g', 'ravioli': '250 g', 'tortilla': '8 pièce', 'lait concentre': '397 g',
};

// Poids moyen d'une pièce (pour comparer « 3 carottes » à un stock en kilos)
export const POIDS_PIECE = {
  'oignon': 100, 'oignon rouge': 100, 'echalote': 30, 'carotte': 100, 'pomme de terre': 150, 'patate douce': 300,
  'tomate': 120, 'courgette': 250, 'aubergine': 300, 'poivron': 150, 'pomme': 150, 'poire': 160, 'citron': 100,
  'citron vert': 70, 'orange': 180, 'banane': 120, 'avocat': 200, 'concombre': 300, 'oeuf': 60, 'poireau': 200,
  'brocoli': 400, 'chou fleur': 800, 'navet': 150, 'panais': 150, 'potiron': 1500, 'butternut': 1200, 'mangue': 350,
  'kiwi': 80, 'peche': 150, 'abricot': 45, 'fenouil': 250, 'betterave': 150, 'celeri rave': 600,
};
