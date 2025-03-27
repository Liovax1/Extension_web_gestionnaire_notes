import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mariadb  # Utilisation de mariadb au lieu de mysql
import hashlib
import uuid
import secrets
from datetime import datetime, timedelta
import bcrypt  # Importation de bcrypt pour le hachage sécurisé

app = Flask(__name__)
CORS(app)

# Connexion à la base de données MariaDB
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

# Fonction pour générer un jeton de session
def generate_token():
    return secrets.token_hex(32)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    # Vérifier que les champs requis sont fournis
    if not email or not password:
        return jsonify({"message": "Email et mot de passe sont requis"}), 400
    
    # Vérifier si l'email existe déjà
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({"message": "L'email est déjà utilisé"}), 400
    
    # Hacher le mot de passe avec bcrypt
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    # Insérer l'utilisateur dans la base
    cursor.execute("INSERT INTO users (email, password) VALUES (%s, %s)", 
                   (email, password_hash))
    db.commit()
    return jsonify({"message": "Utilisateur enregistré"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    cursor = db.cursor()
    cursor.execute("SELECT userId, password FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user and bcrypt.checkpw(password.encode(), user[1].encode()):
        # Générer un jeton de session
        token = generate_token()
        expires_at = datetime.now() + timedelta(days=1)
        
        # Insérer la session dans la base
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

# Middleware pour vérifier l'authentification
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

if __name__ == "__main__":
    app.run(debug=True)
