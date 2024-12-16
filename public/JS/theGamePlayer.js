
var hand = [];
var piles =[1,1,100,100];

document.addEventListener(D)
document.addEventListener("DOMContentLoaded", function () {
    // Initialize localStorage variables
    if (!localStorage.getItem("Pseudos")) localStorage.setItem("Pseudos", "");
    if (!localStorage.getItem("state")) localStorage.setItem("state", "0");
    if (!localStorage.getItem("gameId")) localStorage.setItem("gameId", "");

    const socket = io.connect();

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
                alert("Aucune partie avec cette id.");
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

    // ajouter un socket.on "cardDealed" =>
    socket.on("cardDealed", (cards) => {
        hand = cards;
        console.log(cards);
        Update();

    });

    socket.on("invalidMoveDone", () => {
        console.log("Merci d\'annuler le dernier move");
    });

    socket.on("cardPlayed", () => {
        // affiche la carte joué par le joueurs si la source est différente du joueur actuel
        // si la carte est joué par le joueur actuel remove la carte du tableau playerHand
        //if (actual == emmiter) {
        // needed ?? => a mettre dans invalid move done
        //} else {
        //  diplayPlayedCard();
        // }
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
        localStorage.setItem("state", "1");
        //init
        Update();
        updateUI("playing");
        console.log("The game has started!");
    });
});

function moveCard(e) {
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add(".dragging"); // Add a visual cue for the dragged card
    e.dataTransfer.setData("text/plain", e); // Set card's HTML as data
}

// Allows dragging over a valid target
function overMoveCard(e) {
    e.preventDefault(); // Prevent default to allow dropping
    e.dataTransfer.dropEffect = "move";
}

// Handles the drop event to append the card to the target container
// Démarre le drag
function handleDragStart(e) {
    const card = e.target.closest(".card");
    if (!card) {
        console.error("L'élément sélectionné n'est pas une carte valide.");
        return;
    }

    const cardValue = card.querySelector(".card-front h2").textContent.trim();
    e.dataTransfer.setData("text/plain", cardValue); // Stocke uniquement la valeur de la carte
    e.dataTransfer.effectAllowed = "move"; // Définit l'effet du drag
    console.log("Drag started with card value:", cardValue);
}

// Gère le drop
function dropCard(event) {
    event.preventDefault(); // Empêche le comportement par défaut

    const draggedValue = parseInt(event.dataTransfer.getData("text/plain"), 10); // Valeur de la carte
    const dropZone = event.currentTarget; // Zone où la carte est déposée
    const dropZoneValue = parseInt(dropZone.querySelector(".card-front h2").innerText, 10);

    if (isNaN(draggedValue) || isNaN(dropZoneValue)) {
        console.error("Valeur invalide détectée.");
        return;
    }

    const pileIndex = Array.from(dropZone.parentElement.children).indexOf(dropZone);
    // Valide le mouvement
    if (( (pileIndex== 2 || pileIndex==3) && draggedValue < dropZoneValue && dropZoneValue <= 100) ||
        ( (pileIndex== 1 || pileIndex==0) && draggedValue > dropZoneValue && dropZoneValue >= 1)) {
        // Met à jour la pile
        piles[pileIndex] = draggedValue;

        // Retire la carte de la main
        const handIndex = hand.indexOf(draggedValue);
        if (handIndex !== -1) {
            hand.splice(handIndex, 1); // Supprime la carte de la main
        }

        // Met à jour l'interface
        updateUI("playing");
        console.log("Carte déplacée avec succès !");
    } else {
        console.log("Mouvement invalide !");
    }
}


// Fin du drag
function handleDragEnd(e) {
}


function handUpdate() {
    // Check if 'hand' is defined
    if (typeof hand !== "object" || hand === null) {
        console.error("The 'hand' object is not defined or is invalid.");
        return;
    }

    // Remove the existing footer
    var footer = document.querySelector("footer");
    if (footer) footer.remove();

    // Create a new footer element
    footer = document.createElement("footer");

    // Create a container div with a draggable attribute

    // Iterate through the hand object and populate cards
    for (var handKey in hand) {
        if (hand.hasOwnProperty(handKey)) {

            var div = document.createElement("div");
            div.className = "card";
            div.setAttribute("draggable", "true");
            div.addEventListener("dragstart",function (e){handleDragStart(e)});
            div.addEventListener("dragend", function (e){handleDragEnd(e)});

            console.log(handKey);

            var div1 = document.createElement("div");
            div1.className = "card-inner";

            var div2 = document.createElement("div");
            div2.className = "card-front";
            div2.innerHTML = `<h2>${hand[handKey]}</h2>`; // Correct string interpolation

            var div3 = document.createElement("div");
            div3.className = "card-back"; // Changed class name for clarity
            div3.innerHTML = `<h2>The Game</h2>`;

            div1.appendChild(div2);
            div1.appendChild(div3);
            div.appendChild(div1);


            // Append the new structure to the footer and then to the body
            footer.appendChild(div);
        }
    }

    document.body.appendChild(footer);
}
function pilesUpdate() {
    console.log("updatePiles");
    const HTMLpiles = document.createElement("div");
    HTMLpiles.className = "playingCard";

    const playingCardContainer = document.querySelector(".playingCard");
    if (playingCardContainer) {
        playingCardContainer.innerHTML = ""; // Nettoie les anciennes cartes
    }
    for (const pilesKey in piles) {
        if (piles.hasOwnProperty(pilesKey)) {

            const div = document.createElement("div");
            div.classList.add("card");
            div.setAttribute("draggable", "false"); // Les piles ne sont pas draggables

            // Ajout des événements de drag and drop
            div.addEventListener("dragover", function (event) {
                event.preventDefault(); // Autorise le drop
                event.dataTransfer.dropEffect = "move";
            });

            div.addEventListener("drop", function (event) {
                console.log("Carte déposée !");
                dropCard(event); // Gère l'événement de dépôt
            });

            div.addEventListener("dragenter", (event) => {
                event.preventDefault(); // Permet le survol
                div.style.backgroundColor = "lightgray"; // Indication visuelle
            });

            div.addEventListener("dragleave", () => {
                div.style.backgroundColor = ""; // Réinitialise l'indication visuelle
            });

            const div1 = document.createElement("div");
            div1.className = "card-inner";

            const div2 = document.createElement("div");
            div2.className = "card-front";
            div2.innerHTML = `<h2>${piles[pilesKey]}</h2>`; // Correct string interpolation

            const div3 = document.createElement("div");
            div3.className = "card-back";

            if (pilesKey == 0 || pilesKey == 1) {
                if (piles[pilesKey] > 10) {
                    div3.innerHTML = `<h2>${piles[pilesKey]} to 100</h2><h2>OR</h2><h2>${piles[pilesKey] - 10}</h2>`;
                } else {
                    div3.innerHTML = `<h2>${piles[pilesKey]} to 100</h2>`;
                }
            } else {
                if (piles[pilesKey] < 90) {
                    div3.innerHTML = `<h2>${piles[pilesKey]} to 1</h2><h2>OR</h2><h2>${piles[pilesKey] + 10}</h2>`;
                } else {
                    div3.innerHTML = `<h2>${piles[pilesKey]} to 1</h2>`;
                }
            }

            div1.appendChild(div2);
            div1.appendChild(div3);
            div.appendChild(div1);

            playingCardContainer.appendChild(div);
        }
    }

}

function Update() {
    handUpdate();
    pilesUpdate();
}


// Function to update the UI based on the state
function updateUI(state) {
    const startDiv = document.getElementById("start");
    const joinDiv = document.getElementById("join");
    const waitingDiv = document.getElementById("waitingScreen");
    const messagesDiv = document.getElementById("messages");
    const boardDiv = document.getElementById("board");
    const footer = document.querySelector("footer");
    const quit = document.getElementById("btnQuitGame");
    const showOff = document.getElementById("btnShowOff");

    if (state === "start") {
        startDiv.style.display = "block";
        joinDiv.style.display = "block";
        waitingDiv.style.display = "none";
        messagesDiv.style.display = "none";
        boardDiv.style.display = "none";
        footer.style.display = "none";
        quit.style.display = "none";
        showOff.style.display = "none";
    } else if (state === "waiting") {
        startDiv.style.display = "none";
        joinDiv.style.display = "none";
        waitingDiv.style.display = "block";
        messagesDiv.style.display = "block";
        boardDiv.style.display = "none";
        footer.style.display = "none";
        quit.style.display = "block";
        showOff.style.display = "none";
    } else if (state === "playing") {
        Update()
        startDiv.style.display = "none";
        joinDiv.style.display = "none";
        waitingDiv.style.display = "none";
        messagesDiv.style.display = "none";
        boardDiv.style.display = "block";
        footer.style.display = "flex";
        quit.style.display = "block";
        showOff.style.display = "inline-block";
    }// ajouter le state ExitScreen (page de score si win le score des joueurs si loose le score de cartes restantes)
}
