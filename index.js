const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

var game = {
    player: {},
    games: {},
};

app.use(express.static("Public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/Public/HTML/theGame.html");
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});

io.on("connection", (socket) => {
    const userId = socket.id;

    // Handle joining a game
    socket.on("JoinGame", (key, name) => {
        if (game.games[key]) {
            game.games[key].players[userId] = {name : name, hand: []};
            game.player[userId] = key;

            socket.join(key);
            const playerCount = Object.keys(game.games[key].players).length;
            if (playerCount === game.games[key].maxPlayers) {
                io.to(key).emit("GameStarted");
                startingDealCards(game.games[key].deck, game.games[key].maxPlayers,userId); // 5 cards per player as an example
            }
            socket.emit("hasJoinGame", key, playerCount === game.games[key].maxPlayers ? "1" : "10");
        } else {
            socket.emit("error", "Game not found");
        }
    });

    // Handle sending messages
    socket.on("sendMessage", (message) => {
        const gameKey = game.player[userId];
        if (gameKey) {
            io.to(gameKey).emit(
                "receivedMessage",
                `${game.games[gameKey].players[userId].name}: ${message}`
            );
        }
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
        const gameKey = game.player[userId];
        if (gameKey && game.games[gameKey]) {
            delete game.games[gameKey].players[userId];
            delete game.player[userId];
        }
        // ajouter un message d'alerte aux autres joueurs de la partie et les renvoyé au menu
    });

    socket.on("NewGame", (nbrPlayer, name) => {
        const key = generateUniqueGameKey(userId);
        const deck = generateDeck(); // Create and shuffle a deck


        game.games[key] = {
            players:[],
            maxPlayers: nbrPlayer,
            deck: deck, // Remaining deck for the game
            cardPerPlayer :0
        };

        game.games[key].players[userId] = {name : name, hand:[]}
        game.player[userId] = key;



        socket.join(key);

        if (nbrPlayer === 1) {
            socket.emit("hasJoinGame", key, "1");
            io.to(key).emit("GameStarted"); // Send hand to the player
        } else {
            socket.emit("hasJoinGame", key, "10");
        }

        io.to(key).emit("receivedMessage", `${name} created the game: ${key}`);
    });

    socket.on("EndTurn", (nbrPlayer) => {
        const gameKey = game.player[userId];
        //partieFailed?=
        if(game[gameKey].players.hand.length > (nbrPlayer-2)){
         handleFailedPartie();
        }
        //  partieContinue?
        //    => cardsToDeal = games.game[key].cardPerPlayer - games.game[key].players[id].hand.length;
        //    => dealCards(cardsToDeal, games.game[key].gameDeck, games.game[key].players[id]);
        // permet de gerer la fin d'un tour avec verification si la partie est perdu ou si elle continue
        // deal les nouvelles cartes avant de passer au joueur suivant
        // verifie si la partie est gagné si elle est gagné affiche l'écran de win ? et permet de retourner au menu
        // ?? affichage d'un score (nombre de cartes posé ? points supplémentaire lors d'une serie de plus de n cartes dans le tour)
        // ??? logger le nombre de série obtenue par le joueurs / la longueur de la série
        // passe le joueur suivant au state playing et le joueur actuel au state waiting
    });
    
    socket.on("cardPlaced", () => {
        // verifie la validité du move si move invalide (carte modifié en inspecter l'élément ou autre envoyer un message d'erreur à la source)
        // si erreur emit("invalidMoveDone")
        // si move valide emit("CardPlayed") et mise a jours de la main du joueur;
        
    });

    function handleFailedPartie() {
        // L passe les joueurs au statue ExitScreen avec affichage du score.
    }

    function handleWinnedPartie() {
        // L passe les joueurs au statue ExitScreen avec affichage du score.
    }

});

// Helper functions
function generateUniqueGameKey(userId) {
    var key = reduceRandomString(userId, 6);
    return game.games[key] ? generateUniqueGameKey(userId) : key;
}

function reduceRandomString(original, newLength) {
    const chars = Array.from(original);
    const shuffled = chars.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, newLength).join('');
}
function generateDeck () {
    var deck = Array.from({ length : 98}, (v, k) => k + 2);
    // from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj#:~:text=The%20first%20and%20simplest%20way,)%20%3D%3E%200.5%20%2D%20Math.
    return deck.sort(() => 0.5 - Math.random());
}

function startingDealCards (gameDeck, nbrPlayer,userId) {
    const gameKey = game.player[userId];
    var cardToDeal;
    (nbrPlayer === 2)? cardToDeal=7 : (nbrPlayer === 3 || nbrPlayer===4)? cardToDeal=6 :cardToDeal= 5;
    // ajouter la condition pour le nombre de cartes par joueurs
    // if (?) {
    // cardToDeal = X;
    // }
    console.log("Avant ");
    console.log(userId);
    console.log(game);
    console.log(gameKey);
    console.log(game.games[gameKey]);
    console.log("before foreach");
    console.log(game.games[gameKey].players);
    var playerKeys = game.games[gameKey].players.entries();
    console.log(playerKeys);
    for (var [key, value] of Object.entries(game.games[gameKey].players)) {
        var currentPlayer=game.games[gameKey].players[key];
        console.log("current player");
        console.log(currentPlayer);
        dealCards(cardToDeal, gameDeck, currentPlayer,key)
    }
    console.log("after foreach");
    game.games[gameKey].cardPerPlayer = cardToDeal;

    console.log("Après TOUT ");
    console.log(userId);
    console.log(game);
    console.log(gameKey);
    console.log(game.games[gameKey]);
}

function dealCards(cardToDeal, gameDeck, currentPlayer,userId) {
    var cards = [];
    var i = 0;

    while (i < cardToDeal && gameDeck.length > 0) {
        cards.push(gameDeck.shift());
        i++;
    }

    console.log("CARDS ICI")
    console.log(cards);
    currentPlayer.hand= cards;
    game.games[game.player[userId]].players[userId].hand =cards;
    io.to(userId).emit("cardDealed", (cards));

}


