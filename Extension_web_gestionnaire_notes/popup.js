// Sélection des éléments HTML
const loginBtn = document.getElementById("login-button");
const registerBtn = document.getElementById("register-button");
const addNoteBtn = document.getElementById("save");
const notesList = document.getElementById("notes-list");
const noteInput = document.getElementById("note");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const authLinks = document.getElementById("auth-links");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const notesSection = document.getElementById("notes-section");

let userId = null;

// Vérification ou création d'un ID utilisateur unique
if (!localStorage.getItem("userId")) {
    const newUserId = crypto.randomUUID();
    localStorage.setItem("userId", newUserId);
    console.log("Nouvel ID utilisateur généré :", newUserId);
}

// Fonction pour récupérer et afficher les notes
function fetchNotes() {
    if (userId) {
        fetch("http://localhost:5000/notes", {
            method: "GET",
            headers: { "user_id": userId }
        })
        .then(response => response.json())
        .then(notes => {
            notesList.innerHTML = "";
            notes.forEach(note => {
                const li = document.createElement("li");
                li.innerText = note[1]; // Afficher la note (note[1] contient le texte de la note)
                const deleteBtn = document.createElement("button");
                deleteBtn.innerText = "Supprimer";
                deleteBtn.onclick = () => deleteNote(note[0]); // Utilisation de note[0] pour l'ID
                li.appendChild(deleteBtn);
                notesList.appendChild(li);
            });
        });
    } else {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        notesList.innerHTML = "";
        notes.forEach((note, index) => {
            const li = document.createElement("li");
            li.innerText = note;
            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "Supprimer";
            deleteBtn.onclick = () => deleteLocalNote(index);
            li.appendChild(deleteBtn);
            notesList.appendChild(li);
        });
    }
}


// Fonction pour ajouter une note
function addNote() {
    const note = noteInput.value.trim();

    if (note === "") {
        alert("La note ne peut pas être vide.");
        return;
    }

    if (userId) {
        fetch("http://localhost:5000/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "user_id": userId
            },
            body: JSON.stringify({ note: note })
        })
        .then(response => response.json())
        .then(data => {
            fetchNotes(); // Rafraîchir les notes après ajout
        });
    } else {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        notes.push(note);
        localStorage.setItem("notes", JSON.stringify(notes));
        fetchNotes(); // Rafraîchir les notes après ajout local
    }

    noteInput.value = ""; // Réinitialiser le champ de texte
}


// Fonction pour supprimer une note
function deleteNote(noteId) {
    fetch("http://localhost:5000/notes", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "user_id": userId
        },
        body: JSON.stringify({ note_id: noteId })
    })
    .then(response => response.json())
    .then(data => {
        fetchNotes(); // Rafraîchir la liste des notes après suppression
    });
}


// Fonction pour supprimer une note localement
function deleteLocalNote(index) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    fetchNotes();
}

// Connexion de l'utilisateur
loginBtn.onclick = () => {
    const email = loginEmail.value;
    const password = loginPassword.value;

    fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.user_id) {
            userId = data.user_id;
            localStorage.setItem("userId", userId);
            authLinks.style.display = "none"; // Masquer les liens de connexion et inscription
            loginForm.style.display = "none";
            registerForm.style.display = "none";
            notesSection.style.display = "block"; // Afficher la section des notes
            fetchNotes();
        } else {
            alert("Erreur de connexion");
        }
    });
};

// Inscription de l'utilisateur
registerBtn.onclick = () => {
    const email = registerEmail.value;
    const password = registerPassword.value;

    fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.user_id) {
            userId = data.user_id;
            localStorage.setItem("userId", userId);
            authLinks.style.display = "none"; // Masquer les liens de connexion et inscription
            loginForm.style.display = "none";
            registerForm.style.display = "none";
            notesSection.style.display = "block"; // Afficher la section des notes
            fetchNotes();
        } else {
            alert("Erreur d'inscription");
        }
    });
};

// Gestion du changement entre connexion et inscription
document.getElementById("register-link").onclick = () => {
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    notesSection.style.display = "none"; // Masquer la section des notes
};

document.getElementById("login-link").onclick = () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    notesSection.style.display = "none"; // Masquer la section des notes
};

// Gestion de l'affichage du formulaire de connexion
document.getElementById("auth-toggle").onclick = () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    notesSection.style.display = "none"; // Masquer la section des notes
};

document.getElementById("home-link").onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    notesSection.style.display = "block"; // Afficher la section des notes
    authLinks.style.display = "block"; // Afficher les liens de connexion et inscription
};

// Vérification si l'utilisateur est déjà connecté
if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
    authLinks.style.display = "none"; // Masquer les liens de connexion et inscription
    notesSection.style.display = "block"; // Afficher la section des notes
    fetchNotes();
}

// Associer la fonction d'ajout de note au bouton
addNoteBtn.onclick = addNote;
