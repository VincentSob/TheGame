# TheGame
Ce projet à été effectuer dans le cadre de mon parcours universitaire (L3 en 2024-2025)
Un jeu étais a choisir parmis 2 : 
Yokai : un jeu coopératif dans lequel les joueurs doivent, avec des moyens de communication limités, regrouper des membres de chacune des 4 familles de Yokai en déplaçant des cartes les représentant.
The Game : un jeu coopératif dans lequel les joueurs doivent empiler toutes les cartes numérotées en les répartissant sur 4 tas pour lesquels un ordre croissant ou décroissant d'empilement est exigé.
Je me suis tourné sur le The Game
Vidéo explicative: https://youtu.be/JmyCPwJKMr4 
Règle : http://jeuxstrategie1.free.fr/jeu_the_game/regle.pdf

Projet à réalisé :
Le but du projet est de programmer une version multijoueurs en ligne d'un de ces deux jeux (client + serveur). Les fonctionnalités attendues sont décrites ci-dessous. Celles-ci se divisent en 2 groupes : les fonctionnalités de base qui constituent les attendus de l'application, et les fonctionnalités additionnelles (ou diversifiers) qui constituent un supplément.

Fonctionnalités de base de l'application

Les fonctionnalités attendues pour le projet sont les suivantes :

Les joueurs qui se connectent au serveur peuvent jouer une partie, soit en créant une nouvelle partie de 2 à 4 joueurs, soit en rejoignant une partie déjà créée et pour laquelle les joueurs sont en attente de participants.
Une fois que tous les joueurs sont présents, la partie est démarrée.
La partie doit être jouée selon les règles du jeu correspondant, jusqu'à la victoire ou la défaite des joueurs.
Durant la partie, il n'y a pas de mécanisme de communication entre joueurs autre que ceux proposés par le jeu (cartes de couleurs pour Yokai, indications pré-définies pour The Game).
Un joueur peut quitter une partie à tout moment, mais cela sonne la fin de la partie pour tous les joueurs (jeu coopératif oblige - on gagne ensemble/on perd ensemble).
Vous pouvez bien évidemment reprendre des illustrations sur internet pour les faces des cartes, (ou, par exemple, remplacer les familles de Yokai par des entités de votre choix au nombre de 4 comme les maisons de Pourdlard, les membres des Beatles, les 4 éléments, les 4 saisons, les 4 cavaliers de l'apocalypse, vos 4 profs préférés, etc.).

Fonctionnalités additionnelles -- Diversifiers

Les diversifiers représentent des fonctionnalités annexes et sont des petits challenges techniques (généralement en Javascript ou en CSS) qui permettront de départager les vrais cowboys (a.k.a. Master Players) des petits joueurs (a.k.a. little players).

La liste des diversifiers est donnée ci-dessous, avec le niveau de difficulté que celui-ci représente, symbolisé par un petit nombre d'étoiles.

"Ça va être tout noir" ★★☆☆ 
Ajoutez un mode sombre au jeu, sur lequel on peut basculer via une combinaison de touches.
Boogie-woogie ★★☆☆
Ajoutez des animations CSS pour donner un peu de vie au sein de l'application (menus, changement d'écrans, retournement des cartes, etc.)
Qui me parle ? ★★☆☆ 
Lorsque celle-ci est disponible sur le navigateur, utilisez la synthèse vocale pour donner des informations à l'utilisateur (par exemple pour lui indiquer que c'est à son tour de jouer, décrire l'action réalisée par le joueur actuel, etc.)
Points bonus si le système insulte l'utilisateur parce qu'il est mauvais ou ne joue pas assez vite.
"Vous voulez un whisky ?" ★★★☆
Faire une version jouable sur mobile/tablette (design responsive, touch events).
Dieu du CSS ★★★☆
Réalisez les visuels du jeu (dos de cartes, motifs) uniquement avec du CSS.
Sans les mains ★★★★ 
La démo est réalisée entièrement à l'aide d'un script Selenium.
Tout diversifier entamé mais non finalisé ne sera pas retenu pour la notation.

Si vous avez besoin de précisions concernant les diversifiers, n'hésitez pas à poser vos questions sur le forum.

La notation du projet sera répartie comme suit :

les fonctionnalités et diversifiers implantés -- 50% de la note,
la qualité de la démo réalisée -- 25% de la note,
la qualité du code -- 25% de la note.

Note finale : en attente
