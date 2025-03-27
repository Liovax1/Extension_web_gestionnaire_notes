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
let token = localStorage.getItem("token");

// Vérification ou création d'un ID utilisateur unique
if (!localStorage.getItem("userId")) {
    const newUserId = crypto.randomUUID();
    localStorage.setItem("userId", newUserId);
    console.log("Nouvel ID utilisateur généré :", newUserId);
}

// Fonction pour récupérer et afficher les notes
function fetchNotes() {
    if (token) {
        fetch("http://localhost:5000/notes", {
            method: "GET",
            headers: { "Authorization": token }
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

    if (token) {
        fetch("http://localhost:5000/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ note: note })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Erreur lors de l'ajout de la note.");
            }
        })
        .then(data => {
            fetchNotes(); // Rafraîchir les notes après ajout
            noteInput.value = ""; // Réinitialiser le champ de texte
        })
        .catch(error => {
            console.error(error);
            alert("Impossible d'ajouter la note. Veuillez réessayer.");
        });
    } else {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        notes.push(note);
        localStorage.setItem("notes", JSON.stringify(notes));
        fetchNotes(); // Rafraîchir les notes après ajout local
        noteInput.value = ""; // Réinitialiser le champ de texte
    }
}

// Fonction pour supprimer une note
function deleteNote(noteId) {
    if (token) {
        fetch("http://localhost:5000/notes", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            },
            body: JSON.stringify({ note_id: noteId })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Erreur lors de la suppression de la note.");
            }
        })
        .then(data => {
            fetchNotes(); // Rafraîchir la liste des notes après suppression
        })
        .catch(error => {
            console.error(error);
            alert("Impossible de supprimer la note. Veuillez réessayer.");
        });
    } else {
        alert("Vous devez être connecté pour supprimer une note.");
    }
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
        if (data.token) {
            token = data.token;
            localStorage.setItem("token", token);
            loginForm.style.display = "none";
            registerForm.style.display = "none";
            notesSection.style.display = "block";
            updateAuthLinks();
            fetchNotes();
        } else {
            alert("L'adresse e-mail ou le mot de passe est incorrect.");
        }
    });
};

// Inscription de l'utilisateur
registerBtn.onclick = () => {
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const passwordConfirm = document.getElementById("register-password-confirm").value.trim();

    // Validation des champs
    if (!email || !password || !passwordConfirm) {
        alert("Tous les champs sont requis.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("Les mots de passe ne correspondent pas.");
        return;
    }

    fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Utilisateur enregistré") {
            alert("Inscription réussie. Vous pouvez maintenant vous connecter.");
            registerForm.style.display = "none";
            loginForm.style.display = "block";
        } else {
            alert(data.message || "Erreur d'inscription.");
        }
    });
};


// Mise à jour des liens de navigation en fonction de l'état de connexion
function updateAuthLinks() {
    const authToggle = document.getElementById("auth-toggle");
    if (token) {
        authToggle.innerText = "Déconnexion";
        authToggle.onclick = () => {
            fetch("http://localhost:5000/logout", {
                method: "POST",
                headers: { "Authorization": token }
            })
            .then(response => {
                if (response.ok) {
                    localStorage.removeItem("token");
                    token = null;
                    notesSection.style.display = "none";
                    loginForm.style.display = "none";
                    registerForm.style.display = "none";
                    updateAuthLinks();
                }
            });
        };
    } else {
        authToggle.innerText = "Connexion";
        authToggle.onclick = () => {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            notesSection.style.display = "none";
        };
    }
}

// Navigation entre les formulaires
document.getElementById("register-link").onclick = () => {
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    notesSection.style.display = "none";
};

document.getElementById("login-link").onclick = () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    notesSection.style.display = "none";
};

document.getElementById("home-link").onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    notesSection.style.display = "block";
};

// Affichage par défaut de la section d'ajout de note
if (localStorage.getItem("userId")) {
    userId = localStorage.getItem("userId");
    notesSection.style.display = "block";
    fetchNotes(); // Recharger les notes locales ou distantes à l'ouverture
} else {
    notesSection.style.display = "none";
    loginForm.style.display = "none";
    registerForm.style.display = "none";
}
updateAuthLinks();
if (token) fetchNotes();

// Associer la fonction d'ajout de note au bouton
addNoteBtn.onclick = addNote;
