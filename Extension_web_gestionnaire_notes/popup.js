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
const settingsLink = document.getElementById("settings-link");
const settingsForm = document.getElementById("settings-form");
const changePasswordButton = document.getElementById("change-password-button");
const forgotPasswordForm = document.getElementById("forgot-password-form");
const resetPasswordForm = document.getElementById("reset-password-form");

let userId = null;
let token = localStorage.getItem("token");

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
                const noteText = document.createElement("span");
                noteText.innerText = note[1]; // Afficher la note (note[1] contient le texte de la note)
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'; // Remplacer par l'icône
                deleteBtn.onclick = () => deleteNote(note[0]); // Utilisation de note[0] pour l'ID
                li.appendChild(noteText);
                li.appendChild(deleteBtn);
                notesList.appendChild(li);
            });
        });
    } else {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        notesList.innerHTML = "";
        notes.forEach((note, index) => {
            const li = document.createElement("li");
            const noteText = document.createElement("span");
            noteText.innerText = note;
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'; // Remplacer par l'icône
            deleteBtn.onclick = () => deleteLocalNote(index);
            li.appendChild(noteText);
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
            alert(`Inscription réussie. Votre ID utilisateur est : ${data.userId}. Conservez-le précieusement pour recupérer votre compte.`);
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
        settingsLink.style.display = "inline"; // Afficher le lien "Paramètres"
        authToggle.onclick = () => {
            fetch("http://localhost:5000/logout", {
                method: "POST",
                headers: { "Authorization": token }
            })
            .then(response => {
                if (response.ok) {
                    localStorage.removeItem("token");
                    token = null;
                    notesSection.style.display = "block";
                    loginForm.style.display = "none";
                    registerForm.style.display = "none";
                    settingsForm.style.display = "none";
                    settingsLink.style.display = "none";
                    updateAuthLinks();
                    fetchNotes();
                }
            });
        };
    } else {
        authToggle.innerText = "Connexion";
        settingsLink.style.display = "none"; // Masquer le lien "Paramètres"
        authToggle.onclick = () => {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            notesSection.style.display = "none";
            settingsForm.style.display = "none";
            forgotPasswordForm.style.display = "none"; // Masquer le formulaire "Mot de passe oublié"
            resetPasswordForm.style.display = "none"; // Masquer le formulaire de réinitialisation
        };
    }
}

// Gestion du lien "Paramètres"
settingsLink.onclick = () => {
    settingsForm.style.display = "block";
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    notesSection.style.display = "none";

    // Afficher l'UUID de l'utilisateur dans les paramètres
    if (token) {
        fetch("http://localhost:5000/user-info", {
            method: "GET",
            headers: { "Authorization": token }
        })
        .then(response => response.json())
        .then(data => {
            if (data.userId) {
                document.getElementById("user-id-display").innerText = data.userId;
            } else {
                alert("Impossible de récupérer l'ID utilisateur.");
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération de l'ID utilisateur :", error);
        });
    }
};

// Gestion du changement de mot de passe
changePasswordButton.onclick = () => {
    const currentPassword = document.getElementById("current-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmNewPassword = document.getElementById("confirm-new-password").value.trim();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert("Tous les champs sont requis.");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert("Les nouveaux mots de passe ne correspondent pas.");
        return;
    }

    fetch("http://localhost:5000/change-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Mot de passe changé avec succès") {
            alert("Votre mot de passe a été changé.");
            settingsForm.style.display = "none";
            notesSection.style.display = "block";
        } else {
            alert(data.message || "Erreur lors du changement de mot de passe.");
        }
    });
};

// Gestion de la suppression du compte
document.getElementById("delete-account-button").onclick = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos notes.")) {
        fetch("http://localhost:5000/delete-account", {
            method: "DELETE",
            headers: {
                "Authorization": token
            }
        })
        .then(response => {
            if (response.ok) {
                alert("Votre compte a été supprimé avec succès.");
                localStorage.removeItem("token");
                token = null;
                settingsForm.style.display = "none";
                loginForm.style.display = "block";
                updateAuthLinks();
            } else {
                alert("Erreur lors de la suppression du compte. Veuillez réessayer.");
            }
        })
        .catch(error => {
            console.error("Erreur lors de la suppression du compte :", error);
        });
    }
};

// Gestion du lien "Mot de passe oublié"
document.getElementById("forgot-password-link").onclick = () => {
    loginForm.style.display = "none";
    forgotPasswordForm.style.display = "block";
};

// Retour à la connexion depuis le formulaire "Mot de passe oublié"
document.getElementById("back-to-login").onclick = () => {
    forgotPasswordForm.style.display = "none";
    resetPasswordForm.style.display = "none";
    loginForm.style.display = "block";
};

// Vérification de l'email et de l'UUID pour mot de passe oublié
document.getElementById("verify-forgot-password").onclick = () => {
    const email = document.getElementById("forgot-email").value.trim();
    const uuid = document.getElementById("forgot-uuid").value.trim();

    if (!email || !uuid) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    fetch("http://localhost:5000/verify-forgot-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, userId: uuid })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Vérification réussie") {
            forgotPasswordForm.style.display = "none";
            resetPasswordForm.style.display = "block";
        } else {
            alert(data.message || "Erreur lors de la vérification.");
        }
    })
    .catch(error => {
        console.error("Erreur lors de la vérification :", error);
    });
};

// Réinitialisation du mot de passe après vérification
document.getElementById("reset-password-button").onclick = () => {
    const newPassword = document.getElementById("reset-new-password").value.trim();
    const confirmPassword = document.getElementById("reset-confirm-password").value.trim();
    const uuid = document.getElementById("forgot-uuid").value.trim(); // Récupérer l'UUID de l'utilisateur

    if (!newPassword || !confirmPassword) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
    }

    fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ new_password: newPassword, userId: uuid }) // Inclure l'UUID dans la requête
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Mot de passe réinitialisé avec succès") {
            alert("Votre mot de passe a été réinitialisé.");
            resetPasswordForm.style.display = "none";
            loginForm.style.display = "block";
        } else {
            alert(data.message || "Erreur lors de la réinitialisation.");
        }
    })
    .catch(error => {
        console.error("Erreur lors de la réinitialisation :", error);
    });
};

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
    forgotPasswordForm.style.display = "none"; // Masquer le formulaire "Mot de passe oublié"
    resetPasswordForm.style.display = "none"; // Masquer le formulaire de réinitialisation
};

document.getElementById("home-link").onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    settingsForm.style.display = "none";
    forgotPasswordForm.style.display = "none"; // Masquer le formulaire "Mot de passe oublié"
    resetPasswordForm.style.display = "none"; // Masquer le formulaire de réinitialisation
    notesSection.style.display = "block";
};

// Affichage par défaut de la section des notes
if (token) {
    notesSection.style.display = "block";
    fetchNotes(); // Recharger les notes distantes à l'ouverture
} else {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    if (notes.length > 0) {
        notesSection.style.display = "block";
        fetchNotes(); // Recharger les notes locales à l'ouverture
    } else {
        notesSection.style.display = "block";
        loginForm.style.display = "none";
        registerForm.style.display = "none";
    }
}
updateAuthLinks();
if (token) fetchNotes();

// Associer la fonction d'ajout de note au bouton
addNoteBtn.onclick = addNote;
