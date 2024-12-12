const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

let game = {
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

    // Handle creating a new game
    socket.on("NewGame", (nbrPlayer, name) => {
        const key = generateUniqueGameKey(userId);
        game.games[key] = {
            players: { [userId]: name },
            maxPlayers: nbrPlayer,
        };
        game.player[userId] = key;

        socket.join(key);
        if (nbrPlayer === 1) {
            socket.emit("hasJoinGame", key, "1");
            io.to(key).emit("GameStarted");
        } else {
            socket.emit("hasJoinGame", key, "10");
        }
        io.to(key).emit("receivedMessage", `${name} created the game: ${key}`);
    });

    // Handle joining a game
    socket.on("JoinGame", (key, name) => {
        if (game.games[key]) {
            game.games[key].players[userId] = name;
            game.player[userId] = key;

            socket.join(key);
            const playerCount = Object.keys(game.games[key].players).length;
            if (playerCount === game.games[key].maxPlayers) {
                io.to(key).emit("GameStarted");
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
                `${game.games[gameKey].players[userId]}: ${message}`
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
        var hands = startingDealCards(deck, nbrPlayer); // 5 cards per player as an example

        game.games[key] = {
            players: { [userId]: { name, hand: hands[] } }, // Assign the first hand to the creator
            maxPlayers: nbrPlayer,
            deck, // Remaining deck for the game
            cardPerPlayer
        };

        game.player[userId] = key;

        socket.join(key);

        if (nbrPlayer === 1) {
            socket.emit("hasJoinGame", key, "1");
            io.to(key).emit("GameStarted", hands[0]); // Send hand to the player
        } else {
            socket.emit("hasJoinGame", key, "10");
        }

        io.to(key).emit("receivedMessage", `${name} created the game: ${key}`);
    });

    function generateDeck () {
        var deck = Array.from({ length : 98}, (v, k) => k + 2);
        var suffledDeck = deck.sort((a, b) => 0.5 - Math.random()); // from https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj#:~:text=The%20first%20and%20simplest%20way,)%20%3D%3E%200.5%20%2D%20Math.

        return suffledDeck;
    };

    function startingDealCards (gameDeck, nbrPlayer) {
        var cardToDeal = 5;
        // ajouter la condition pour le nombre de cartes par joueurs 
        // if (?) {
        // cardToDeal = X;
        // }
        games.game[key].players.forEach((currentPlayer) => {
            // currentPlayer => player n
            dealCards(cardToDeal, gameDeck, currentPlayer)
        });
        cardPerPlayer = cardToDeal;
    };

    function dealCards(cardToDeal, gameDeck, currentPlayer) {
        var cards = [];
        var i = 0;

        while (i < cardToDeal && gameDeck.length != 0) {
            cards.append(gameDeck.shift());
            i++;
        }
        currentPlayer.hand = cards;
        io.socket.socket(currentPlayer.userId).emit("cardDealed", (cards));
    };

    socket.on("EndTurn", (nbrPlayer, name) => {
        partieFailed?=>handleFailedPartie();

        partieContinue?
            => cardsToDeal = games.game[key].cardPerPlayer - games.game[key].players[id].hand.length;
            => dealCards(cardsToDeal, games.game[key].gameDeck, games.game[key].players[id]);
        // permet de gerer la fin d'un tour avec verification si la partie est perdu ou si elle continue
        // deal les nouvelles cartes avant de passer au joueur suivant
        // verifie si la partie est gagné si elle est gagné affiche l'écran de win ? et permet de retourner au menu
        // ?? affichage d'un score (nombre de cartes posé ? points supplémentaire lors d'une serie de plus de n cartes dans le tour)
        // ??? logger le nombre de série obtenue par le joueurs / la longueur de la série
        // passe le joueur suivant au state playing et le joueur actuel au state waiting
    });
    
    socket.on("cardPlaced", (nbrPlayer, name) => {
        // verifie la validité du move si move invalide (carte modifié en inspecter l'élément ou autre envoyer un message d'erreur à la source)
        // si erreur emit("invalidMoveDone")
        // si move valide emit("CardPlayed") et mise a jours de la main du joueur;
        
    });

    function handleFailedPartie() {
        // L passe les joueurs au statue ExitScreen avec affichage du score.
    };

    function handleWinnedPartie() {
        // L passe les joueurs au statue ExitScreen avec affichage du score.
    }

});

// Helper functions
function generateUniqueGameKey(userId) {
    let key = reduceRandomString(userId, 6);
    return game.games[key] ? generateUniqueGameKey(userId) : key;
}

function reduceRandomString(original, newLength) {
    const chars = Array.from(original);
    const shuffled = chars.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, newLength).join('');
}



