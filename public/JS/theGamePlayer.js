
// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Stockage des parties
const parties = {};

// Servir les fichiers statiques (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Route principale pour servir la page HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'theGame.html')); // Chemin vers votre fichier HTML
});

// Gestion des connexions Socket.io
/*
io.on('connection', (socket) => {
    console.log('Un joueur s\'est connecté :', socket.id);

    // Création d'une nouvelle partie
    socket.on('creerPartie', (data) => {
        const { nombreJoueurs, nomJoueur } = data;
        const idPartie = socket.id; // Utiliser l'ID du socket comme identifiant de la partie
        parties[idPartie] = {
            nombreMaxJoueurs: nombreJoueurs,
            joueurs: [{ id: socket.id, nom: nomJoueur }],
            enCours: false, // Statut de la partie
        };
        socket.join(idPartie);
        io.to(socket.id).emit('partieCree', { idPartie, message: 'Partie créée avec succès !' });
        console.log(`Partie créée avec ID ${idPartie} pour ${nombreJoueurs} joueurs.`);
    });

    // Rejoindre une partie existante
    socket.on('rejoindrePartie', (data) => {
        const { idPartie, nomJoueur } = data;
        const partie = parties[idPartie];

        if (partie && partie.joueurs.length < partie.nombreMaxJoueurs) {
            partie.joueurs.push({ id: socket.id, nom: nomJoueur });
            socket.join(idPartie);
            io.to(idPartie).emit('joueurRejoint', { nomJoueur });
            console.log(`${nomJoueur} a rejoint la partie ${idPartie}.`);

            // Démarrer la partie lorsque tous les joueurs sont connectés
            if (partie.joueurs.length === partie.nombreMaxJoueurs) {
                partie.enCours = true;
                io.to(idPartie).emit('demarrerPartie', { message: 'La partie commence maintenant!' });
                console.log(`La partie ${idPartie} commence.`);
            }
        } else {
            io.to(socket.id).emit('erreur', { message: 'La partie est déjà pleine ou n\'existe pas.' });
        }
    });

    // Déconnexion d'un joueur
    socket.on('disconnect', () => {
        console.log('Un joueur s\'est déconnecté :', socket.id);

        // Rechercher la partie à laquelle le joueur était connecté
        for (let idPartie in parties) {
            let partie = parties[idPartie];
            const index = partie.joueurs.findIndex(joueur => joueur.id === socket.id);

            if (index !== -1) {
                // Supprimer le joueur de la partie
                const joueurParti = partie.joueurs.splice(index, 1)[0];
                console.log(`Joueur ${joueurParti.nom} a quitté la partie ${idPartie}.`);

                // Si la partie était en cours, la terminer en informant les autres joueurs
                if (partie.enCours) {
                    io.to(idPartie).emit('finPartie', { message: 'La partie est terminée car un joueur a quitté.' });
                    console.log(`La partie ${idPartie} est terminée à cause de la déconnexion d'un joueur.`);
                    delete parties[idPartie];
                }

                // Si tous les joueurs ont quitté, supprimer la partie
                if (partie.joueurs.length === 0) {
                    delete parties[idPartie];
                    console.log(`Partie ${idPartie} supprimée (plus de joueurs connectés).`);
                }
                break;
            }
        }
    });
});*/

// Gestion des erreurs du serveur HTTP
server.on('error', (err) => {
    console.error('Erreur serveur :', err);
});

// Serveur écoute sur le port 8080
server.listen(8080, () => {
    console.log('Serveur démarré sur http://localhost:8080');
});

function darkModeUpdate(){
    let html = document.querySelector('HTML');
    console.log(html);
    html.classList.toggle("darkMode");
    html.classList.toggle("lightMode");
}

document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("btnShowOff").addEventListener("click", function() {
        const footer = document.querySelector('footer');
        if (footer.style.display === 'none'){
            footer.style.display='';
        }else{
            footer.style.display = 'none';
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.code === 'KeyD'){
            darkModeUpdate();
        }
        console.log(`Touche appuyée : ${event.key} (ou ${event.code})`);
    });
});