
var hand = [];
var piles =[1,1,100,100];
var handSize=0;
var nbInDeckCard = 99;

document.addEventListener("DOMContentLoaded", function () {var key68 = false;
    var keyShift = false;

    document.addEventListener('keydown', function(event) {
        console.log(event.key);
        if (event.key === "Shift") {
            keyShift = true;
        }
        if (event.key === "d" || event.key === "D") {
            key68 = true;
        }

        if (keyShift && key68) {
            // Sélectionner tous les éléments ayant la classe "lightMode"
            var lightModeElements = document.querySelectorAll(".lightMode");

            // Si des éléments "lightMode" existent, on les remplace par "darkMode"
            if (lightModeElements.length > 0) {
                lightModeElements.forEach(function(element) {
                    element.classList.remove("lightMode");
                    element.classList.add("darkMode");
                });
            } else {
                // Sinon, on remplace les éléments "darkMode" par "lightMode"
                var darkModeElements = document.querySelectorAll(".darkMode");
                darkModeElements.forEach(function(element) {
                    element.classList.remove("darkMode");
                    element.classList.add("lightMode");
                });
            }
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key === "Shift") {
            keyShift = false;
        }
        if (event.key === "d" || event.key === "D") {
            key68 = false;
        }
    });

    // Initialize localStorage variables
    if (!localStorage.getItem("Pseudos")) localStorage.setItem("Pseudos", "");
    if (!localStorage.getItem("state")) localStorage.setItem("state", "0"); // state "10" = waiting, "0" = menu, other : game started
    if (!localStorage.getItem("gameId")) localStorage.setItem("gameId", "");

    var socket = io.connect();

    socket.on("yourSocketId", (id) => {
        console.log("Votre socket ID reçu du serveur :", id);
        localStorage.setItem("id",id);
    });

    // Get initial state
    let currentState = localStorage.getItem("state");
    console.log("Current state:", currentState); // Debugging


    if (currentState != null) {
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
    socket.on("cardDealed", (cards,nbrCarteRestante) => {
        console.log("cards : ",cards);
        console.log("hand : ",hand);
        nbInDeckCard=nbrCarteRestante;
        hand = cards;
        hand.sort((a, b) => a - b);
        handSize =hand.length;
        console.log(cards);
        handUpdate();
        updateUI("playing");

    });

    socket.on("invalidMoveDone", (resendPiles, resendHand) => {
        piles=resendPiles;
        hand=resendHand;
        updateUI("playing");
    });

    socket.on("cardPlayed", (playerId, value, pileId) => {

        speak(`carte ${value} jouer sur la pile n°${pileId}`);
        console.log("value :"+value+ "played on pile : "+pileId+'\n');
        if(playerId === localStorage.getItem("id")){
            const cardIndex = hand.indexOf(value);
            if (cardIndex > -1) hand.splice(cardIndex, 1);
        }
        piles[pileId]=value;
        updateUI("playing");
        Update();
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


    socket.on("GameStarted", (nbrPlayers) => {
        console.log("The game has started!");

        handUpdate();
        updateUI("playing");
        // Mettre à jour l'état dans localStorage
        localStorage.setItem("state", "1");

        // Mettre à jour l'interface utilisateur

        // Cible l'élément où vous voulez insérer le formulaire
        const boardDiv = document.getElementById("board");
        if (!boardDiv) {
            console.error("L'élément 'board' est introuvable dans le DOM.");
            return;
        }

        // Sauvegarder l'état initial du contenu de la div
        const previousContent = boardDiv.innerHTML;

        // Nettoyer le contenu précédent
        boardDiv.innerHTML = "";

        // Créer un formulaire pour demander la position
        const form = document.createElement("form");
        form.id = "positionForm";
        form.innerHTML = `
        <label for="positionInput">Entrez la position où vous voulez jouer :</label>
        <input type="number" id="positionInput" min="1" max="${nbrPlayers}" required>
        <button type="submit">Confirmer</button>
    `;

        // Ajouter un gestionnaire d'événement pour le formulaire
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const positionInput = document.getElementById("positionInput");
            const pos = parseInt(positionInput.value, 10);

            if (isNaN(pos) || pos < 1 || pos > nbrPlayers) {
                alert(`Veuillez entrer un numéro valide entre 1 et ${nbrPlayers}.`);
                return;
            }

            // Envoyer la position au serveur
            socket.emit("posAsk", pos);

            // Restaurer le contenu précédent de la div après soumission
            boardDiv.innerHTML = previousContent;
            Update();
        });

        // Ajouter le formulaire à la div
        boardDiv.appendChild(form);
    });

    function cardPlayed(pile,value){
        if (pile>3 || pile<0 || value>=100 || value<=1 || currentState !="2"){
            updateUI("playing");
            return;
        }
        socket.emit("cardPlaced", pile, value)
    }


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
        if (( (pileIndex== 2 || pileIndex==3) && (draggedValue < dropZoneValue || draggedValue == dropZoneValue+10)  && dropZoneValue <= 100) ||
            ( (pileIndex== 1 || pileIndex==0) && (draggedValue > dropZoneValue || draggedValue == dropZoneValue-10) && dropZoneValue >= 1)) {
            // Met à jour la pile
            piles[pileIndex] = draggedValue;

            // Retire la carte de la main
            const handIndex = hand.indexOf(draggedValue);
            if (handIndex !== -1) {
                hand.splice(handIndex, 1); // Supprime la carte de la main
            }

            // Met à jour l'interface
            cardPlayed(pileIndex,draggedValue);
            console.log("Carte déplacée avec succès !");
        } else {
            var order = (pileIndex== 2 || pileIndex==3)? "montante" :" descendante";
            speak(`Vraiment, Vous essayer de poser un ${draggedValue} sur un ${dropZoneValue} sur un pile ${order}. Il faut réfléchir un peu`)
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

        const button = document.createElement("button");
        button.classList.add("card");
        button.setAttribute("id", 'btnEndTurn');
        button.setAttribute("draggable", "false"); // Les piles ne sont pas draggables

        const div = document.createElement("div");
        div.className = "card-inner";

        const div1 = document.createElement("div");
        div1.className = "card-front";
        div1.innerHTML = `<h2>${nbInDeckCard}</h2>`;

        const div2 = document.createElement("div");
        div2.className = "card-back";
        div2.innerHTML = "<h2>Pioche</h2>";

        button.addEventListener("click", function ()  {
            if (currentState == "2") {
                speechSynthesis.cancel();

                var nbrCardPlayed = handSize - hand.length;
                const confirmation = confirm(`Vous avez jouez ${nbrCardPlayed} durant se tour, voulez vous finir votre tour`);
                if (confirmation) {

                    const turn = document.getElementById("turn");
                    if (turn){turn.style.display = "none";}
                    currentState = "1";
                    const gameId = localStorage.getItem("gameId");
                    localStorage.setItem("state", "0");
                    localStorage.setItem("Pseudos", "");
                    localStorage.setItem("gameId", "");
                    speak("fin de votre tour")
                    socket.emit("EndTurn");
                }
            }
        });

        div.appendChild(div1);
        div.appendChild(div2);
        button.appendChild(div);
        playingCardContainer.appendChild(button);
    }

    function Update() {
        pilesUpdate();
        handUpdate();
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
        const endTurn = document.getElementById("btnEndTurn");
        const showHelp = document.getElementById("btnShowHelp");
        if (state === "start") {
            startDiv.style.display = "block";
            joinDiv.style.display = "block";
            waitingDiv.style.display = "none";
            messagesDiv.style.display = "none";
            boardDiv.style.display = "none";
            footer.style.display = "none";
            quit.style.display = "none";
            showOff.style.display = "none";
            if (endTurn){ endTurn.style.display = "none"}
            showHelp.style.display = "none";
        } else if (state === "waiting") {
            startDiv.style.display = "none";
            joinDiv.style.display = "none";
            waitingDiv.style.display = "block";
            messagesDiv.style.display = "block";
            boardDiv.style.display = "none";
            footer.style.display = "none";
            quit.style.display = "block";
            showOff.style.display = "none";
            if (endTurn){ endTurn.style.display = "none"}
            showHelp.style.display = "none";
        } else if (state === "playing") {
            startDiv.style.display = "none";
            joinDiv.style.display = "none";
            waitingDiv.style.display = "none";
            messagesDiv.style.display = "none";
            boardDiv.style.display = "block";
            footer.style.display = "flex";
            quit.style.display = "block";
            showOff.style.display = "inline-block";
            if (endTurn) {
                endTurn.style.display = "block"
            }
            showHelp.style.display = "inline-block";
        }// ajouter le state ExitScreen (page de score si win le score des joueurs si loose le score de cartes restantes)
    }

    socket.on("gameStateUpdate", (gameState) => {
        updateUI(gameState); // Function to update the UI with the new state
    });

    socket.on("startTurn", ()=>{
        const turn = document.getElementById("turn");
        if (turn){turn.style.display = "block";}
        console.log(localStorage.getItem("Pseudos"));
        localStorage.setItem("state", "2");
        currentState = "2";
        speak("Début de votre tour");
    });


    socket.on("FailedPartie", (nbrNonPosedCard)=>{
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        currentState="10";
        const messagesContainer = document.getElementById("received");
        var messageElement = document.createElement("div");
        messageElement.textContent = "Félicita... Ha non, vous n'avez pas réussi à batre leu jeu...";
        speak("Félicita... Ha non, vous n'avez pas réussi à batre leu jeu...");
        messagesContainer.appendChild(messageElement);
        messageElement = document.createElement("div");
        messageElement.textContent = `Il vous restait ${nbrNonPosedCard} à poser.`;
        speak(`Il vous restait ${nbrNonPosedCard} à poser.`);
        messagesContainer.appendChild(messageElement);
        if (nbrNonPosedCard>10){
            messageElement = document.createElement("div");
            messageElement.textContent = "On avais dit moins de 10 cartes pour que a soit 'un excellent résultat'.";
            speak("On avais dit moins de 10 cartes pour que a soit 'un excellent résultat'.");
            messagesContainer.appendChild(messageElement);
            messageElement = document.createElement("div");
            messageElement.textContent = "On dirrait qu'on a des petits joueurs ici.";
            speak("On dirrait qu'on a des petits joueurs ici.");
            messagesContainer.appendChild(messageElement);
        }
        Update();
        updateUI("waiting");
    });

    socket.on("WinnedPartie", ()=>{
        currentState="10";
        const messagesContainer = document.getElementById("received");
        const messageElement = document.createElement("div");
        messageElement.textContent = "Félicitation, Vous avez terminée votre partie et déposez toutes les cartes.";
        speak("Félicitation, Vous avez terminée votre partie et déposez toutes les cartes.");
        messagesContainer.appendChild(messageElement);
        Update();
        updateUI("waiting");
    });
});

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR'; // Langue française
        utterance.rate = 3; // Vitesse normale
        window.speechSynthesis.speak(utterance);
    } else {
        alert("La synthèse vocale n'est pas supportée par ce navigateur.");
    }
}
