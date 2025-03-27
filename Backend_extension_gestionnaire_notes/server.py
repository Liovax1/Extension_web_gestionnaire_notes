import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mariadb
import hashlib
import uuid
import secrets
from datetime import datetime, timedelta
import bcrypt

app = Flask(__name__)
CORS(app)

try:
    db = mariadb.connect(
        host="localhost",
        user="root",
        password="Liova2004",
        database="gestionnaire_notes"
    )
    print("Connexion réussie à la base de données MariaDB")
except mariadb.Error as e:
    print(f"Erreur de connexion à la base de données MariaDB : {e}")
    exit(1)

def generate_token():
    return secrets.token_hex(32)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Email et mot de passe sont requis"}), 400
    
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({"message": "L'email est déjà utilisé"}), 400
    
    # Générer un UUID et garder les 8 premiers caractères
    user_id = str(uuid.uuid4())[:8]
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    cursor.execute("INSERT INTO users (userId, email, password) VALUES (%s, %s, %s)", 
                   (user_id, email, password_hash))
    db.commit()
    return jsonify({"message": "Utilisateur enregistré", "userId": user_id}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    cursor = db.cursor()
    cursor.execute("SELECT userId, password FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user and bcrypt.checkpw(password.encode(), user[1].encode()):
        token = generate_token()
        expires_at = datetime.now() + timedelta(days=1)
        
        cursor.execute("INSERT INTO sessions (userId, token, expires_at) VALUES (%s, %s, %s)", 
                       (user[0], token, expires_at))
        db.commit()
        return jsonify({"message": "Connexion réussie", "token": token}), 200
    else:
        return jsonify({"message": "Email ou mot de passe incorrect"}), 400

@app.route("/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"message": "Jeton manquant"}), 400
    
    cursor = db.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = %s", (token,))
    db.commit()
    return jsonify({"message": "Déconnexion réussie"}), 200

# on vérifie l'authentification
def authenticate_request():
    token = request.headers.get("Authorization")
    if not token:
        return None
    
    cursor = db.cursor()
    cursor.execute("SELECT userId FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
    session = cursor.fetchone()
    return session[0] if session else None

@app.route("/notes", methods=["GET", "POST", "DELETE"])
def handle_notes():
    user_id = authenticate_request()
    if not user_id:
        return jsonify({"message": "Non autorisé"}), 401

    if request.method == "GET":
        cursor = db.cursor()
        cursor.execute("SELECT noteId, content FROM notes WHERE userId = %s", (user_id,))
        notes = cursor.fetchall()
        return jsonify(notes)

    elif request.method == "POST":
        note = request.json.get("note")
        cursor = db.cursor()
        cursor.execute("INSERT INTO notes (content, userId) VALUES (%s, %s)", (note, user_id))
        db.commit()
        return jsonify({"message": "Note ajoutée"}), 201

    elif request.method == "DELETE":
        note_id = request.json.get("note_id")
        cursor = db.cursor()
        cursor.execute("DELETE FROM notes WHERE noteId = %s AND userId = %s", (note_id, user_id))
        db.commit()
        return jsonify({"message": "Note supprimée"})

@app.route("/change-password", methods=["POST"])
def change_password():
    user_id = authenticate_request()
    if not user_id:
        return jsonify({"message": "Non autorisé"}), 401

    data = request.json
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"message": "Tous les champs sont requis"}), 400

    cursor = db.cursor()
    cursor.execute("SELECT password FROM users WHERE userId = %s", (user_id,))
    user = cursor.fetchone()

    if user and bcrypt.checkpw(current_password.encode(), user[0].encode()):
        new_password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        cursor.execute("UPDATE users SET password = %s WHERE userId = %s", (new_password_hash, user_id))
        db.commit()
        return jsonify({"message": "Mot de passe changé avec succès"}), 200
    else:
        return jsonify({"message": "Mot de passe actuel incorrect"}), 400

@app.route("/user-info", methods=["GET"])
def user_info():
    user_id = authenticate_request()
    if not user_id:
        return jsonify({"message": "Non autorisé"}), 401

    cursor = db.cursor()
    cursor.execute("SELECT userId FROM users WHERE userId = %s", (user_id,))
    user = cursor.fetchone()

    if user:
        return jsonify({"userId": user[0]}), 200
    else:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

# Stockage temporaire des utilisateurs vérifiés (à remplacer par une solution plus robuste si nécessaire)
verified_users = {}

@app.route("/verify-forgot-password", methods=["POST"])
def verify_forgot_password():
    data = request.json
    email = data.get("email")
    user_id = data.get("userId")

    if not email or not user_id:
        return jsonify({"message": "Email et ID utilisateur requis"}), 400

    cursor = db.cursor()
    cursor.execute("SELECT userId FROM users WHERE email = %s AND userId = %s", (email, user_id))
    user = cursor.fetchone()

    if user:
        # Stocker temporairement l'utilisateur vérifié
        verified_users[user_id] = True
        return jsonify({"message": "Vérification réussie"}), 200
    else:
        return jsonify({"message": "Email ou ID utilisateur incorrect"}), 404

@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json
    new_password = data.get("new_password")
    user_id = data.get("userId")  # Inclure l'ID utilisateur dans la requête

    if not new_password or not user_id:
        return jsonify({"message": "Nouveau mot de passe et ID utilisateur requis"}), 400

    # Vérifier si l'utilisateur a été vérifié
    if not verified_users.get(user_id):
        return jsonify({"message": "Utilisateur non vérifié"}), 403

    cursor = db.cursor()
    new_password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    cursor.execute("UPDATE users SET password = %s WHERE userId = %s", (new_password_hash, user_id))
    db.commit()

    # Supprimer l'utilisateur vérifié après réinitialisation
    del verified_users[user_id]

    return jsonify({"message": "Mot de passe réinitialisé avec succès"}), 200

if __name__ == "__main__":
    app.run(debug=True)
