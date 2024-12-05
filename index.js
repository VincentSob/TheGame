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
    });
});
function generateUniqueGameKey(userId) {
    let key = reduceRandomString(userId, 6);
    return game.games[key] ? generateUniqueGameKey(userId) : key;
}

function reduceRandomString(original, newLength) {
    const chars = Array.from(original);
    const shuffled = chars.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, newLength).join('');
}
