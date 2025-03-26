CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,       -- Identifiant unique de l'utilisateur
    email VARCHAR(255) NOT NULL UNIQUE,          -- Email de l'utilisateur
    password VARCHAR(255) NOT NULL,              -- Mot de passe crypté de l'utilisateur
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Date de création du compte
);

CREATE TABLE notes (
    noteId INT AUTO_INCREMENT PRIMARY KEY,       -- Identifiant unique de la note
    userId INT,                                  -- Référence à l'utilisateur (clé étrangère)
    content TEXT NOT NULL,                       -- Contenu de la note
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date de création de la note
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE -- Suppression en cascade des notes si l'utilisateur est supprimé
);
