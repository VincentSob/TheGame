document.addEventListener("DOMContentLoaded", function () {
    // Initialize localStorage variables
    if (!localStorage.getItem("Pseudos")) localStorage.setItem("Pseudos", "");
    if (!localStorage.getItem("state")) localStorage.setItem("state", "0");
    if (!localStorage.getItem("gameId")) localStorage.setItem("gameId", "");

    const socket = io.connect();

    // Function to update the UI based on the state
    function updateUI(state) {
        const startDiv = document.getElementById("start");
        const joinDiv = document.getElementById("join");
        const waitingDiv = document.getElementById("waitingScreen");
        const messagesDiv = document.getElementById("messages");
        const boardDiv = document.getElementById("board");
        const footer = document.querySelector("footer");
        const quit = document.getElementById("btnQuitGame");

        if (state === "start") {
            startDiv.style.display = "block";
            joinDiv.style.display = "block";
            waitingDiv.style.display = "none";
            messagesDiv.style.display = "none";
            boardDiv.style.display = "none";
            footer.style.display = "none";
            quit.style.display = "none";
        } else if (state === "waiting") {
            startDiv.style.display = "none";
            joinDiv.style.display = "none";
            waitingDiv.style.display = "block";
            messagesDiv.style.display = "block";
            boardDiv.style.display = "none";
            footer.style.display = "none";
            quit.style.display = "block";
        } else if (state === "playing") {
            startDiv.style.display = "none";
            joinDiv.style.display = "none";
            waitingDiv.style.display = "none";
            messagesDiv.style.display = "none";
            boardDiv.style.display = "block";
            footer.style.display = "flex";
            quit.style.display = "block";
        }
    }

    // Get initial state
    let currentState = localStorage.getItem("state");
    console.log("Current state:", currentState); // Debugging

    // Ensure valid state
    const validStates = ["0", "10", "1"];
    if (!validStates.includes(currentState)) {
        localStorage.setItem("state", "0");
        currentState = "0";
    }

    // Initial UI update
    updateUI(currentState === "10" ? "waiting" : currentState === "0" ? "start" : "playing");

    // Create Game button functionality
    const createButton = document.getElementById("creerPartie");
    if (createButton) {
        createButton.addEventListener("click", function () {
            const playerName = document.getElementById("nomJoueurCreer").value || "Guest";
            const nbrPlayers = parseInt(document.getElementById("nombreJoueurs").value);

            if (!nbrPlayers || nbrPlayers < 1 || nbrPlayers > 5) {
                alert("Please enter a valid number of players (1-5).");
                return;
            }

            localStorage.setItem("Pseudos", playerName);
            socket.emit("NewGame", nbrPlayers, playerName);
        });
    }

    // Join Game button functionality
    const joinButton = document.getElementById("rejoindrePartie");
    if (joinButton) {
        joinButton.addEventListener("click", function () {
            const playerName = document.getElementById("nomJoueurRejoindre").value || "Guest";
            const gameKey = document.getElementById("idPartie").value;

            if (!gameKey) {
                alert("Please enter a valid game ID.");
                return;
            }

            localStorage.setItem("Pseudos", playerName);
            localStorage.setItem("gameId", gameKey);
            socket.emit("JoinGame", gameKey, playerName);
        });
    }

    // Handle joining a game
    socket.on("hasJoinGame", (key, state) => {
        localStorage.setItem("state", state);
        localStorage.setItem("gameId", key);
        updateUI(state === "10" ? "waiting" : "playing");

        const waitingDiv = document.getElementById("waitingScreen");
        waitingDiv.innerHTML = `<p>Welcome ${localStorage.getItem("Pseudos")}</p>
                                <p>Waiting for game to start...</p>
                                <p>You have joined Game ID: ${key}</p>`;
    });

    // Handle sending messages
    const sendMessageButton = document.getElementById("sendMessage");
    if (sendMessageButton) {
        sendMessageButton.addEventListener("click", function () {
            const message = document.getElementById("messageToSend").value.trim();
            if (message) {
                socket.emit("sendMessage", message);
                document.getElementById("messageToSend").value = "";
            }
        });
    }

    // Handle received messages
    socket.on("receivedMessage", (message) => {
        const messagesContainer = document.getElementById("received");
        const messageElement = document.createElement("div");
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
    });

    // Handle quitting the game
    const quitButton = document.getElementById("btnQuitGame");
    if (quitButton) {
        quitButton.addEventListener("click", function () {
            const confirmation = confirm("Voulez-vous vraiment quitter la partie ?");
            if (confirmation) {
                const gameId = localStorage.getItem("gameId");
                localStorage.setItem("state", "0");
                localStorage.setItem("Pseudos", "");
                localStorage.setItem("gameId", "");

                socket.emit("quitGame", gameId);
                updateUI("start");
                document.getElementById("received").innerHTML = "";
                location.reload(true);
            }
        });
    }

    const showOff = document.getElementById("btnShowOff");
    if (showOff) {
        showOff.addEventListener("click", function () {
            console.log("click");
            const footer = document.querySelector("footer");
            if (footer.style.display === "flex") {
                footer.style.display = "none"
            } else {
                footer.style.display = "flex"
            }
        });
    }

    // Handle game start event
    socket.on("GameStarted", () => {
        updateUI("playing");
        console.log("The game has started!");
    });

});

function moveCard(e) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", e.target.outerHTML); // Set card's HTML as data
    e.target.classList.add("dragging"); // Add a visual cue for the dragged card
}

// Allows dragging over a valid target
function overMoveCard(e) {
    e.preventDefault(); // Prevent default to allow dropping
    e.dataTransfer.dropEffect = "move";
}

// Handles the drop event to append the card to the target container
function dropCard(e) {
    e.preventDefault(); // Prevent default behavior
    const cardHTML = e.dataTransfer.getData("text/plain"); // Get the dragged card's HTML
    const dropZone = e.currentTarget;

    // Ensure the drop zone accepts the card
    if (dropZone.classList.contains("card")) {
        // Find and remove the original card
        const draggingCard = document.querySelector(".dragging");
        dropZone.innerHTML = draggingCard.innerHTML;
        console.log();
        if (draggingCard) {
            draggingCard.parentElement.removeChild(draggingCard); // Remove from original container
            draggingCard.setAttribute("draggable","false");
        }
    }
    e.stopPropagation();
    return false;
}
