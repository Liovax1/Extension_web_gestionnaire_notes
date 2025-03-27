# Gestionnaire de Notes

Une extension de navigateur avec un backend pour gérer vos notes. Vous pouvez ajouter, consulter et supprimer des notes, que vous soyez connecté ou non. Les notes des utilisateurs connectés sont synchronisées sur tous les appareils.

## Fonctionnalités

### Frontend (Extension Web)
- **Prendre des notes** : Ajoutez des notes via une interface simple.
- **Connexion/Inscription** : Créez un compte ou connectez-vous pour synchroniser vos notes.
- **Stockage local** : Les notes des utilisateurs non connectés sont stockées localement dans le navigateur.
- **Synchronisation** : Les utilisateurs connectés peuvent accéder à leurs notes sur n'importe quel appareil.

### Backend (API Flask)
- **Gestion des utilisateurs** :
  - Inscription avec hachage sécurisé des mots de passe (`bcrypt`).
  - Connexion avec génération de jetons de session.
  - Déconnexion avec invalidation des jetons.
- **Gestion des notes** :
  - Ajout, consultation et suppression des notes dans une base de données MariaDB.
  - Authentification des requêtes via des jetons.

## Installation

### Prérequis
- Python 3.11.3 (recommandé)
- MariaDB (vous pouvez également utiliser un environnement de développement comme WampServer)
- Navigateur compatible avec les extensions (Chrome, Edge, etc.)

### Backend
1. Clonez le projet.
2. **(Optionnel mais recommandé)** Créez un environnement virtuel :
   ```bash
   py -3.11 -m venv myenv
   myenv\Scripts\activate
   ```
3. Installez les dépendances Python :
   ```bash
   pip install flask flask-cors mariadb bcrypt
   ```
4. Configurez la base de données MariaDB :
   - Exécutez le fichier SQL `extension.sql` pour créer la base de données et les tables.
5. Lancez le serveur Flask :
   ```bash
   python server.py
   ```

### Frontend
1. Ouvrez le dossier `Extension_web_gestionnaire_notes` dans votre navigateur.
2. Chargez l'extension :
   - Allez dans `chrome://extensions/` (ou équivalent pour votre navigateur).
   - Activez le mode développeur.
   - Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier.

## Utilisation

### En tant qu'utilisateur non connecté
1. Ouvrez l'extension.
2. Ajoutez des notes. Elles seront stockées localement dans le navigateur.
3. Supprimez des notes si nécessaire.

### En tant qu'utilisateur connecté
1. Inscrivez-vous ou connectez-vous via l'extension.
2. Ajoutez des notes. Elles seront synchronisées avec le backend.
3. Accédez à vos notes sur n'importe quel appareil en vous connectant.

## Structure du Projet

```
Exploitation_base_de_donnees/
├── Backend_extension_gestionnaire_notes/
│   ├── server.py                # API Flask pour gérer les utilisateurs et les notes
│   ├── extension.sql            # Script SQL pour créer la base et les tables
├── Extension_web_gestionnaire_notes/
│   ├── popup.html               # Interface utilisateur de l'extension
│   ├── popup.js                 # Logique de l'extension
│   ├── style.css                # Styles de l'extension
│   ├── manifest.json            # Configuration de l'extension
│   ├── background.js            # Gestion des tâches en arrière-plan
└── README.md                    # Documentation du projet
```

## API Backend

### Endpoints

#### `/register` (POST)
- **Description** : Inscription d'un nouvel utilisateur.
- **Corps** :
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Réponse** :
  - `201` : Utilisateur enregistré.
  - `400` : Email déjà utilisé ou champs manquants.

#### `/login` (POST)
- **Description** : Connexion d'un utilisateur.
- **Corps** :
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Réponse** :
  - `200` : Jeton de session renvoyé.
  - `400` : Email ou mot de passe incorrect.

#### `/logout` (POST)
- **Description** : Déconnexion de l'utilisateur.
- **En-tête** :
  ```text
  Authorization: <token>
  ```
- **Réponse** :
  - `200` : Déconnexion réussie.
  - `400` : Jeton manquant.

#### `/notes` (GET, POST, DELETE)
- **GET** : Récupère les notes de l'utilisateur connecté.
- **POST** : Ajoute une nouvelle note.
  - **Corps** :
    ```json
    {
      "note": "Ma nouvelle note"
    }
    ```
- **DELETE** : Supprime une note.
  - **Corps** :
    ```json
    {
      "note_id": 1
    }
    ```

## Licence

Ce projet est sous licence MIT. Cela signifie que vous êtes libre d'utiliser, modifier et distribuer ce projet, à condition de conserver la licence d'origine. Pour plus d'informations, consultez [la licence MIT](https://opensource.org/licenses/MIT).
