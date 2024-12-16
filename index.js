const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

var stock = {
    player: {},
    games: {},
};

app.use(express.static("Public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/Public/HTML/theGame.html");
});

server.listen(8080, () => {
    console.log("Server is running on port 8080");
});

io.on("connection", (socket) => {
    const userId = socket.id
    console.log("Nouveau joueur connecté :", userId);
    socket.emit("yourSocketId", userId); // Envoi de l'ID au client

    // Handle joining a game
    socket.on("JoinGame", (key, name) => {
        if (stock.games[key]) {
            stock.games[key].players[userId] = {name : name, hand: []};
            stock.player[userId] = key;
            stock.piles = [1,1,100,100];

            socket.join(key);
            const playerCount = Object.keys(stock.games[key].players).length;
            if (playerCount === stock.games[key].maxPlayers) {
                io.to(key).emit("GameStarted");
                startingDealCards(stock.games[key].deck, stock.games[key].maxPlayers,userId); // 5 cards per player as an example
            }
            socket.emit("hasJoinGame", key, playerCount === stock.games[key].maxPlayers ? "1" : "10");
        } else {
            socket.emit("error", "Game not found");
        }
    });

    // Handle sending messages
    socket.on("sendMessage", (message) => {
        const gameKey = stock.player[userId];
        if (gameKey) {
            io.to(gameKey).emit(
                "receivedMessage",
                `${stock.games[gameKey].players[userId].name}: ${message}`
            );
        }
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
        const gameKey = stock.player[userId];
        if (gameKey && stock.games[gameKey]) {
            delete stock.games[gameKey].players[userId];
            delete stock.player[userId];
        }
        // ajouter un message d'alerte aux autres joueurs de la partie et les renvoyé au menu
    });

    socket.on("NewGame", (nbrPlayer, name) => {
        const key = generateUniqueGameKey(userId);
        const deck = generateDeck(); // Create and shuffle a deck


        stock.games[key] = {
            players:[],
            maxPlayers: nbrPlayer,
            deck: deck, // Remaining deck for the game
            cardPerPlayer :0,
            piles : [1,1,100,100]
        };

        stock.games[key].players[userId] = {name : name, hand:[]}
        stock.player[userId] = key;

        socket.join(key);

        if (nbrPlayer === 1) {
            socket.emit("hasJoinGame", key, "1");
            io.to(key).emit("GameStarted"); // Send hand to the player
        } else {
            socket.emit("hasJoinGame", key, "10");
        }

        io.to(key).emit("receivedMessage", `${name} created the game: ${key}`);
    });

    socket.on("EndTurn", () => {
        const gameKey = stock.player[userId];
        var maxCard= stock.games[gameKey].cardPerPlayer;
        if((stock.games[gameKey].players[userId].hand.length > (maxCard-2) && stock.games[gameKey].deck.length!==0) || (stock.games[gameKey].deck.length===0 && stock.games[gameKey].players[userId].hand.length > (maxCard-1))){
            handleFailedPartie();
        }
        cardsToDeal = stock.games[gameKey].cardPerPlayer - stock.games[gameKey].players[userId].hand.length;
        dealCards(cardsToDeal, stock.games[gameKey].deck, stock.games[gameKey].players[userId], userId);
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

    socket.on("cardPlaced", (pile, value) => {
        var gameKey = stock.player[userId];
        console.log(stock.games[gameKey]);

        if (!gameKey || !stock.games[gameKey] || !stock.games[gameKey].players[userId]) {
            console.error("Invalid game state or user ID.");
            return;
        }

        var player = stock.games[gameKey].players[userId];
        var curentHand = player.hand;

        // Check if the card exists in the player's hand
        if (!curentHand.includes(value)) {
            socket.emit("invalidMoveDone", stock.games[gameKey].piles,  curentHand)
            return;
        }
        console.log( stock.games[gameKey]);
        var pileValue = stock.games[gameKey].piles[pile];
        console.log(pileValue - 10, pileValue + 10);
        console.log("pile : ",pile, "value",stock.games[gameKey].piles[pile]);

        if (((pile === 0 || pile === 1) && (pileValue < value || pileValue - 10 === value))||
            ((pile === 2 || pile === 3) && (pileValue > value || pileValue + 10 === value)) ) {
            // Emit valid move event
            io.to(gameKey).emit("cardPlayed", userId, value, pile);

            // Update pile and player's hand
            stock.games[gameKey].piles[pile] = value;
            var cardIndex = curentHand.indexOf(value);
            console.log("pile : ",pile, "value",stock.games[gameKey].piles[pile]);
            if (cardIndex > -1) curentHand.splice(cardIndex, 1);
            console.log( stock.games[gameKey]);
        } else {
            // Emit invalid move event
            socket.emit("invalidMoveDone", stock.games[gameKey].piles, curentHand)
        }
        io.to(gameKey).emit("gameStateUpdate","playing");
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
    return stock.games[key] ? generateUniqueGameKey(userId) : key;
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
    const gameKey = stock.player[userId];
    var cardToDeal = (stock.games[gameKey].maxPlayers ===2 )? 7:6;
    var playerKeys = stock.games[gameKey].players.entries();
    for (var [key, value] of Object.entries(stock.games[gameKey].players)) {
        var currentPlayer=stock.games[gameKey].players[key];
        stock.games[stock.player[userId]].players[userId].hand=[];
        dealCards(cardToDeal, gameDeck, currentPlayer,key)
    }
    stock.games[gameKey].cardPerPlayer = cardToDeal;
}

function dealCards(cardToDeal, gameDeck, currentPlayer,userId) {
    var cards = [];
    var i = 0;

    while (i < cardToDeal && gameDeck.length > 0) {
        cards.push(gameDeck.shift());
        i++;
    }
    for (const cardsKey in cards) {
        stock.games[stock.player[userId]].players[userId].hand.push(cards[cardsKey])
    }
    io.to(userId).emit("cardDealed", (stock.games[stock.player[userId]].players[userId].hand));

}


