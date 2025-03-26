// Vérifie si un ID unique est déjà stocké
let localUserID = localStorage.getItem("localUserID");

if (!localUserID) {
    // Génère un ID unique (UUID v4)
    localUserID = crypto.randomUUID();
    localStorage.setItem("localUserID", localUserID);
}

console.log("ID utilisateur local :", localUserID);
