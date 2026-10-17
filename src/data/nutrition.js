// Valeurs de référence par ingrédient, pour estimer calories, protéines et coût par portion.
// Une ligne : clés (séparées par « / ») | kcal pour 100 g | protéines g pour 100 g | prix € par kg | poids d'une pièce (g) | poids par unité
// Valeurs moyennes (tables CIQUAL arrondies) et prix moyens de supermarché : ce sont des ESTIMATIONS.
// La clé la plus longue contenue dans le nom de l'ingrédient l'emporte (« huile de sésame » avant « huile »).
export const TABLE_NUTRITION = `
eau / eau chaude / eau froide / eau tiede / eau petillante / glacon | 0 | 0 | 0
sel / gros sel / fleur de sel / sel fin | 0 | 0 | 1
poivre / poivre noir / baie rose | 250 | 10 | 40
oignon / oignon cru / oignon grelot / petit oignon / oignon pique | 40 | 1.2 | 2 | 100
oignon rouge | 40 | 1.2 | 3 | 100
oignon nouveau | 30 | 1.5 | 8 | 20 | botte=150
echalote | 72 | 2.5 | 6 | 30
ail / tete d ail / ail rose | 130 | 6 | 10 | 50 | gousse=5
ail en poudre | 330 | 17 | 30
carotte / carotte nouvelle / carotte rapee | 36 | 0.8 | 1.5 | 100 | botte=700
pomme de terre / grenaille / pomme de terre farineuse | 80 | 2 | 1.5 | 150
puree de pomme de terre | 90 | 2 | 3
frite | 170 | 3 | 3
patate douce | 86 | 1.6 | 3.5 | 300
courgette | 17 | 1.2 | 2.5 | 250
aubergine | 25 | 1 | 3 | 300
poivron / poivron rouge grille | 30 | 1 | 4 | 150
piment / piment rouge / piment antillai / piment de padron / piment dou | 40 | 2 | 12 | 10
tomate / tomate bien mure / tomate ancienne | 19 | 0.9 | 3 | 120
tomate cerise | 22 | 1 | 6 | 15
tomate concassee / pulpe de tomate | 25 | 1.2 | 2.5 | 400 | boite=400
concentre de tomate | 85 | 4 | 6 | 70 | boite=70
couli de tomate / sauce tomate | 45 | 1.5 | 3 | 500 | pot=500
tomate sechee | 260 | 14 | 25
champignon / champignon de pari / shiitake / champignon noir | 25 | 3 | 5 | 20 | boite=230
cepe | 30 | 3 | 30
morille sechee | 300 | 25 | 400
poireau / jeune poireau | 30 | 1.5 | 3 | 200
concombre | 13 | 0.6 | 3 | 300
salade / laitue / mache / frisee / romaine / sucrine / mesclun / salade melangee | 15 | 1.3 | 8 | 300 | feuille=10
endive | 17 | 1 | 3.5 | 100
roquette / cresson / oseille | 25 | 2.6 | 15 | | botte=100
epinard / blette / chou kale | 28 | 3 | 6
brocoli / chou romanesco | 35 | 3 | 4 | 400
chou fleur | 27 | 2 | 3 | 800
chou / chou vert / chou blanc / chou rouge / chou chinoi / chou rave / chou frise / choucroute | 28 | 1.5 | 2 | 1000
haricot vert / haricot beurre | 30 | 2 | 5 | | boite=400
feve | 75 | 6 | 6 | 0
edamame | 120 | 11 | 10
poi gourmand | 40 | 3 | 12
mai | 100 | 3 | 4 | 250 | boite=285
avocat | 160 | 2 | 7 | 150
celeri / branche de celeri | 15 | 0.7 | 3 | 40
celeri rave | 30 | 1.5 | 2.5 | 600
fenouil / bulbe de fenouil | 25 | 1.3 | 4 | 250
navet / navet nouveau | 20 | 1 | 3 | 150 | botte=700
panai / topinambour | 70 | 1.8 | 4 | 150
betterave / betterave cuite | 45 | 1.7 | 3 | 150
potiron / courge / butternut / potimarron / courge spaghetti | 35 | 1 | 2.5 | 1200
asperge | 25 | 2.5 | 12 | 20 | botte=500
artichaut / coeur d artichaut / fond d artichaut | 40 | 2.5 | 12 | 40 | boite=240
pak choi / bok choy / pak choy | 15 | 1.5 | 8 | 150
pousse de soja | 30 | 3 | 8
radi | 15 | 0.8 | 8 | 10 | botte=250
olive | 150 | 1 | 12 | 4
cornichon | 15 | 0.5 | 8 | 10
capre | 25 | 2 | 30
legume / legume restant / legume cru / jardiniere | 30 | 1.5 | 3
feuille de vigne | 50 | 3 | 20 | 4
algue / algue nori / wakame | 300 | 30 | 150 | 3 | feuille=3
persil / coriandre / basilic / menthe / aneth / ciboulette / cerfeuil / estragon / herbe | 40 | 3 | 30 | 30 | botte=30 / brin=1 / feuille=0.5
thym / romarin / sauge / laurier / origan / herbe de provence / zaatar / bouquet garni | 280 | 8 | 40 | 15 | brin=1 / feuille=0.3 / botte=30
citronnelle / baton de citronnelle | 30 | 1 | 20 | 15
gingembre / galanga | 80 | 1.8 | 8 | 30
noi de muscade / cumin / paprika / curry / cannelle / muscade / curcuma / ras el hanout / garam masala / quatre epice / colombo / cajun / tandoori / sumac / badiane / clou de girofle / genievre / carvi / graine de fenouil / graine de coriandre / epice / piment d espelette / piment de cayenne / piment sec | 330 | 12 | 40 | 3 | baton=3
safran | 310 | 11 | 20000 | | sachet=0.1
vanille / gousse de vanille | 290 | 0 | 600 | 3
citron | 30 | 1 | 3 | 100
citron vert | 30 | 0.7 | 5 | 70
citron confit | 30 | 0.5 | 15 | 60
orange | 47 | 1 | 2.5 | 180
pamplemousse | 40 | 0.7 | 3 | 350
pomme | 54 | 0.3 | 2.5 | 150
poire / poire ferme | 55 | 0.4 | 3 | 160
demi poire au sirop | 70 | 0.3 | 5 | 60 | boite=470
banane | 90 | 1.1 | 2 | 120
fraise | 33 | 0.7 | 8 | 15
framboise | 50 | 1.2 | 15
myrtille | 57 | 0.7 | 15
fruit rouge / fruit surgele | 45 | 1 | 10
fruit / fruit frai | 50 | 0.7 | 4 | 150
mangue | 65 | 0.8 | 5 | 350
anana | 50 | 0.5 | 3 | 1200 | boite=340
peche / abricot / quetsche / prune | 45 | 0.8 | 4 | 60
cerise / cerise au sirop | 60 | 1 | 8 | | boite=400
kiwi | 60 | 1 | 4 | 80
melon | 35 | 0.8 | 3 | 1000
pasteque | 30 | 0.6 | 1.5 | 3000
raisin / raisin blanc | 70 | 0.7 | 4
figue / figue fraiche | 70 | 1 | 10 | 50
rhubarbe | 20 | 1 | 5
grenade / graine de grenade | 80 | 1.5 | 8 | 300
pruneau | 240 | 2.5 | 9 | 8
raisin sec / cranberrie / fruit confit / ecorce d orange confite | 310 | 2 | 10
compote | 70 | 0.3 | 3 | 100 | pot=100
marron / chataigne | 180 | 2.5 | 12 | | boite=400
creme de marron | 270 | 1.5 | 9 | | boite=250
noi / cerneau de noi | 690 | 15 | 18
amande / amande effilee / amande emondee / poudre d amande / amande grillee / amande entiere | 600 | 25 | 14 | 1.2
noisette | 650 | 15 | 15
pistache | 600 | 20 | 25
cacahuete | 590 | 26 | 8
noi de cajou | 590 | 18 | 18
pignon | 670 | 14 | 60
noi de coco rapee | 650 | 7 | 10
graine / sesame / graine de sesame / graine de tournesol / graine de courge / graine de lin | 580 | 20 | 10
tahin / tahini / tahine | 600 | 18 | 12
beurre de cacahuete | 600 | 25 | 10
praline / pate de praline / pralinoise | 550 | 9 | 20
fruit sec | 600 | 18 | 15
pate / spaghetti / penne / tagliatelle / fusilli / macaroni / farfalle / linguine / coquillette / petite pate / orzo / crozet / pate alphabet / tube de cannelloni / feuille de lasagne | 355 | 12.5 | 2 | 10 | paquet=500 / feuille=20
nouille / vermicelle / vermicelle de riz / nouille de riz / udon / soba / ramen | 355 | 9 | 5 | | paquet=250
gnocchi | 150 | 4 | 4 | | paquet=500
tortellini / ravioli / raviole | 280 | 11 | 10 | | paquet=250 / plaque=60
riz / riz basmati / riz long / riz rond / riz thai / riz a sushi / riz cru | 350 | 7 | 2.5 | | paquet=1000
riz arborio | 350 | 7 | 4
riz noir | 350 | 8 | 8
riz cuit | 130 | 2.7 | 2.5
galette de riz | 340 | 6 | 10 | 8 | feuille=8
semoule / semoule fine / semoule moyenne | 350 | 12 | 2
boulgour / frik / petit epeautre / orge perle | 340 | 12 | 3
quinoa | 370 | 14 | 8
polenta / farine de mai | 360 | 8 | 3
tapioca | 350 | 0.5 | 6
flocon d avoine | 370 | 13 | 3
farine / farine de ble | 350 | 10 | 1 | | sachet=500 / pot=70
maizena | 350 | 0.3 | 6
chapelure / chapelure panko | 380 | 12 | 4
corn flake | 380 | 7 | 6
pain / pain de campagne / pain rassi / pain grille / baguette / pain de mie / brioche | 270 | 9 | 4 | 250 | tranche=35
pain de mie / pain de mie grille | 270 | 8 | 4 | 25 | tranche=25
brioche | 370 | 8 | 6 | 300 | tranche=40
pain a burger / pain a hot dog / muffin anglai | 280 | 9 | 6 | 60
pain pita / pain libanai / galette / naan | 270 | 9 | 6 | 70
tortilla / grande tortilla / tortilla de mai | 300 | 8 | 7 | 40
pain d epice | 330 | 4 | 8 | | tranche=25
crepe / crepe salee | 220 | 7 | 8 | 50
galette de sarrasin | 180 | 6 | 8 | 60
pate feuilletee | 400 | 6 | 6 | 230 | rouleau=230
croute de bouchee / croute de bouchee feuilletee | 450 | 7 | 25 | 15
pate brisee / pate sablee | 420 | 6 | 5 | 230 | rouleau=230
pate a pizza | 280 | 8 | 6 | 260 | rouleau=260
pate a brioche | 370 | 8 | 6 | 400
pate filo / feuille de filo / feuille de brick / feuille a wonton / feuille a gyoza | 300 | 8 | 12 | 10 | feuille=12 / paquet=250
biscuit / biscuit sable / speculoo / biscuit a la cuillere / petit beurre | 450 | 6 | 8 | 8 | paquet=200
genoise / biscuit roule | 300 | 7 | 10 | 300
meringue | 390 | 4 | 15 | 10
chip / chip de mai | 500 | 7 | 10 | | sachet=150
guimauve | 330 | 3 | 10 | 6 | sachet=200
nem | 220 | 8 | 12 | 50
lait / lait entier / lait tiede / lait chaud / lait ribot | 47 | 3.3 | 1 | | verre=200 / bol=250
lait de coco / creme de coco | 180 | 2 | 4 | | boite=400
lait concentre / lait concentre sucre | 330 | 8 | 6 | | boite=397
lait concentre non sucre | 135 | 7 | 5 | | boite=410
lait en poudre | 500 | 26 | 10
creme / creme fraiche / creme liquide / creme epaisse / creme entiere | 300 | 2.4 | 6 | | pot=200
creme aigre | 200 | 3 | 6 | | pot=200
beurre / margarine / beurre demi sel | 745 | 0.7 | 10
graisse de canard / saindou | 900 | 0 | 12
yaourt / yaourt nature | 60 | 4 | 3 | 125 | pot=125
yaourt grec / skyr | 120 | 7 | 5 | 150 | pot=150
fromage blanc / faisselle | 75 | 7.5 | 3 | | pot=500
fromage / fromage a raclette / raclette | 350 | 24 | 15 | | tranche=30
parmesan / pecorino / grana padano | 400 | 33 | 25
emmental / emmental rape / gruyere / gruyere rape / comte / comte rape / beaufort / cantal / tomme | 390 | 28 | 13 | | sachet=200
mozzarella / mozzarella rapee | 250 | 18 | 10 | 125
burrata | 300 | 15 | 20 | 125
feta | 270 | 15 | 12 | 200
chevre / buche de chevre | 300 | 20 | 18 | 180
chevre frai | 200 | 11 | 15 | 150
ricotta | 150 | 9 | 10 | 250 | pot=250
mascarpone | 450 | 4.5 | 9 | 250 | pot=250
fromage frai / fromage frai aux herbe / portion de fromage frai / cervelle | 250 | 7 | 10 | 17 | pot=150
portion de fromage fondu | 250 | 12 | 12 | 17
reblochon | 330 | 20 | 15 | 450
roquefort / bleu / gorgonzola | 360 | 20 | 22
camembert / brie | 300 | 20 | 10 | 250
cheddar / cheddar rape | 400 | 25 | 15 | | tranche=20
halloumi | 320 | 22 | 20 | 250
glace / glace vanille | 200 | 3.5 | 6
oeuf / oeuf dur / oeuf entier / oeuf au plat | 145 | 12.5 | 4 | 60
jaune d oeuf | 320 | 16 | 4 | 18
blanc d oeuf | 48 | 11 | 4 | 35
poulet / blanc de poulet / escalope de poulet / filet de poulet / poulet hache / blanc de poulet cuit / poulet cuit | 110 | 23 | 13 | 150
cuisse de poulet / haut de cuisse / pilon / aile de poulet / cuisse ou pilon de poulet / pilon et haut de cuisse | 150 | 14 | 7 | 200
haut de cuisse desosse / cuisse de poulet desossee | 150 | 19 | 10 | 120
poulet entier / poulet fermier / coq / poulet coupe en crapaudine | 120 | 13 | 6 | 1600
dinde / escalope de dinde / filet de dinde / roti de dinde | 110 | 23 | 11 | 150
cuisse de dinde | 150 | 20 | 7 | 600
canard / magret / magret de canard | 200 | 19 | 22 | 350
cuisse de canard confite / gesier de canard confit / confit | 280 | 20 | 15 | 250
magret seche ou fume | 300 | 30 | 50
foie de volaille | 130 | 20 | 8
foie gra | 450 | 7 | 60 | 500
caille | 130 | 13 | 18 | 180
pintade / pintade decoupee | 110 | 14 | 12 | 1200
chapon | 140 | 14 | 14 | 3000
lapin / lapin decoupe | 100 | 15 | 12 | 1400
boeuf / boeuf a braiser / boeuf a bourguignon / viande a pot au feu / joue de boeuf / boeuf en cube | 160 | 21 | 14
boeuf hache / viande hachee / melange boeuf porc hache / steak hache / agneau hache | 200 | 18 | 12 | 100
boeuf emince / boeuf en laniere / steak / bavette / rumsteck / pave de boeuf / boeuf a fondue / boeuf en fine tranche / boeuf cuit | 140 | 22 | 25 | 150
filet de boeuf / roti de boeuf / cote de boeuf / boeuf tre frai | 150 | 22 | 35 | 1000
os a moelle | 100 | 3 | 5 | 150
veau / saute de veau / veau a blanquette / roti de veau / tranche de jarret de veau | 130 | 21 | 20
escalope de veau / escalope de veau fine | 110 | 22 | 28 | 120
paupiette | 200 | 15 | 14 | 120
porc / roti de porc / filet de porc / echine de porc / cote de porc / cotelette de porc / joue de porc / porc en laniere | 180 | 19 | 10 | 200
filet mignon de porc | 130 | 21 | 14 | 500
traver de porc / poitrine de porc | 280 | 17 | 9
porc hache / chair a saucisse / farce fine | 270 | 15 | 10
lardon / lardon fume / poitrine fumee / lard fume | 300 | 15 | 12 | | paquet=200 / tranche=15
bacon | 250 | 17 | 18 | | tranche=15
jambon / jambon blanc / des de jambon / jambon a cuire | 110 | 20 | 14 | | tranche=40 / paquet=200
jambon cru / jambon serrano / jambon de bayonne / charcuterie / coppa | 250 | 26 | 30 | | tranche=15
chorizo / chorizo fin / saucisson | 450 | 22 | 15 | 200 | tranche=4
saucisse / saucisse de toulouse / saucisse fumee / diot / saucisse de montbeliard / chipolata / merguez | 280 | 14 | 10 | 100
saucisse de strasbourg | 280 | 12 | 9 | 50
saucisse de morteau | 300 | 15 | 14 | 400
andouillette | 200 | 20 | 12 | 150
boudin noir | 270 | 13 | 8 | 120
palette / kassler / jambon demi sel | 200 | 20 | 11 | 1000
quenelle | 160 | 7 | 10 | 50
agneau / gigot d agneau / epaule d agneau / souri d agneau | 230 | 18 | 18 | 300
cotelette d agneau / cotelette | 230 | 17 | 22 | 80
carre d agneau | 230 | 17 | 30 | 600
saumon / pave de saumon / filet de saumon / saumon frai / saumon tre frai | 200 | 20 | 25 | 130
saumon fume | 180 | 22 | 40 | | tranche=25
truite | 100 | 14 | 15 | 300
poisson / filet de poisson / poisson blanc / poisson ferme / cabillaud / dos de cabillaud / colin / merlu / lieu / lieu noir / merlan / sole / bar / loup / dorade / rouget / filet de colin / assortiment de poisson / poisson a soupe | 80 | 18 | 20 | 150
dorade videe / gro bar | 80 | 18 | 15 | 600
filet de rouget / rouget | 100 | 19 | 30 | 40
lotte / lotte en cube | 75 | 16 | 30
morue dessalee | 80 | 18 | 22
thon / thon en boite / thon a l huile | 190 | 26 | 15 | 140 | boite=140
thon frai / pave de thon | 140 | 24 | 30 | 150
sardine / sardine a l huile | 200 | 21 | 10 | 40 | boite=115
sardine fraiche | 200 | 19 | 9 | 60
maquereau / maquereau vide | 200 | 19 | 9 | 250
hareng / filet de hareng fume | 200 | 18 | 15 | 60
anchoi / filet d anchoi | 200 | 25 | 40 | 4 | boite=50
crevette / gamba / crevette crue / crevette cuite / crevette decortiquee | 90 | 19 | 20 | 20
noi de saint jacque / saint jacque | 80 | 15 | 60 | 25
moule / moule de bouchot / palourde | 50 | 7 | 5
huitre | 70 | 9 | 15 | 15
calamar / encornet / anneau de calamar | 80 | 16 | 12
fruit de mer / melange de fruit de mer | 80 | 15 | 12
oeuf de cabillaud | 120 | 18 | 30
fumet de poisson / bouillon / bouillon de volaille / bouillon de legume / bouillon de boeuf / fond de volaille / bouillon chaud | 5 | 0.5 | 1
cube de bouillon / cube | 250 | 10 | 15 | 10
tofu / tofu ferme | 120 | 13 | 8 | 200
haricot rouge / haricot blanc / haricot noir / flageolet | 110 | 7 | 3 | | boite=250
haricot blanc sec | 330 | 22 | 4
huile / huile d olive / huile de tournesol / huile de coco | 900 | 0 | 9 | | pot=100
huile de sesame / huile de noi | 900 | 0 | 22
vinaigre / vinaigre de vin / vinaigre de cidre / vinaigre de riz / vinaigre de xere / vinaigre blanc | 20 | 0 | 3
vinaigre balsamique | 90 | 0.5 | 8
creme de balsamique / melasse de grenade | 200 | 0 | 15
moutarde / moutarde a l ancienne / moutarde de dijon | 150 | 7 | 6
mayonnaise / mayonnaise a l ail / rouille / aioli / sauce tartare | 680 | 1.5 | 8
ketchup / sauce barbecue | 120 | 1.5 | 5
sauce soja | 60 | 8 | 6
sauce nuoc mam | 35 | 5 | 8
sauce huitre / sauce hoisin | 120 | 2 | 10
sauce / sauce burger / sauce blanche | 200 | 2 | 8
salsa | 30 | 1 | 8
tzatziki | 100 | 4 | 8
pesto / pesto rouge | 450 | 5 | 18 | | pot=190
tapenade | 300 | 2 | 20
harissa / gochujang / pate de piment / sriracha | 150 | 4 | 15
pate de curry / pate de curry rouge / pate de curry vert | 150 | 3 | 30
pate de miso | 200 | 12 | 15
mirin | 230 | 0 | 15
vinaigrette | 400 | 0.5 | 6
vin / vin blanc / vin rouge / vin jaune / vin blanc sec / vin blanc moelleu | 75 | 0 | 6 | | verre=150
biere / biere blonde / biere brune / cidre / cidre brut | 40 | 0.4 | 3 | | canette=330
rhum / cognac / calvado / kirsch / porto / madere / grand marnier / amaretto / pasti / alcool | 230 | 0 | 25
cafe / cafe fort | 2 | 0.1 | 3
eau de fleur d oranger | 0 | 0 | 8
sucre / sucre glace / sucre rou / cassonade / sucre en grain / vergeoise | 400 | 0 | 1.5 | | pot=100
sucre vanille | 400 | 0 | 20 | | sachet=7.5
miel | 320 | 0.4 | 12
sirop / sirop d erable / caramel / caramel liquide | 280 | 0 | 15
confiture / confiture de fraise / confiture d airelle | 250 | 0.5 | 6 | | pot=370
confiture de lait | 320 | 7 | 12
pate a tartiner | 540 | 6 | 8
chocolat / chocolat noir / chocolat noir patissier | 550 | 7 | 12 | | tablette=200
carre de chocolat | 550 | 7 | 12 | 5
chocolat au lait | 540 | 7 | 10
chocolat blanc | 550 | 6 | 12
pepite de chocolat / vermicelle en chocolat | 500 | 6 | 15
cacao / cacao amer / cacao non sucre | 350 | 20 | 15
gelatine | 340 | 85 | 60 | | feuille=2 / sachet=9
levure chimique / bicarbonate | 100 | 0 | 15 | | sachet=11
levure de boulanger | 300 | 40 | 30 | | sachet=5.5
// Salades protéinées (lot 12)
petits pois cuits / petit pois cuit | 80 | 5.5 | 5
lentilles cuites / lentilles vertes cuites / lentilles corail cuites | 115 | 9 | 4
epeautre cru / epeautre | 340 | 14 | 6
canneberges sechees / cranberries sechees | 330 | 0.5 | 15
cottage cheese | 100 | 11 | 8 | | pot=200
gigot / filet d agneau | 200 | 20 | 22
chair de crabe / surimi / batonnet de surimi | 90 | 8 | 12
bresaola | 160 | 33 | 45 | | tranche=15
tempeh | 190 | 19 | 18
seitan | 120 | 24 | 16
`;

// Poids moyen par unité quand l'ingrédient ne précise rien (en g)
export const POIDS_UNITE = {
  'c. à soupe': 13, 'c. à café': 5, pincée: 0.5, gousse: 5, brin: 1, feuille: 2, tranche: 30, boîte: 400,
  sachet: 10, paquet: 500, pot: 125, rouleau: 230, botte: 30, verre: 200, bol: 250, pièce: 100,
};
