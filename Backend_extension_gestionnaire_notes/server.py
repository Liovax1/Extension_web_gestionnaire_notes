import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mariadb  # Utilisation de mariadb au lieu de mysql
import hashlib
import uuid

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

@app.route("/notes", methods=["GET", "POST", "DELETE"])
def handle_notes():
    user_id = request.headers.get("user_id")

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

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    # Vérifier si l'email existe déjà
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({"message": "L'email est déjà utilisé"}), 400
    
    # Hacher le mot de passe
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Insérer l'utilisateur dans la base
    user_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO users (email, password, userId) VALUES (%s, %s, %s)", 
                   (email, password_hash, user_id))
    db.commit()
    return jsonify({"message": "Utilisateur enregistré", "user_id": user_id})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    
    if user and user[2] == hashlib.sha256(password.encode()).hexdigest():
        return jsonify({"message": "Connexion réussie", "user_id": user[3]})
    else:
        return jsonify({"message": "Email ou mot de passe incorrect"}), 400

if __name__ == "__main__":
    app.run(debug=True)
