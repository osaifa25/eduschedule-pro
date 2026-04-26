# EduSchedule Pro 📅

Système Intégré de Gestion de l'Emploi du Temps et de Suivi Pédagogique des Séances de Cours.

**Institut Supérieur de Génie Électrique (ISGE) — RST 2025-2026**

---

## Technologies utilisées

| Couche | Technologie |
|--------|-------------|
| Frontend statique | HTML5, CSS3, Bootstrap 5 |
| Frontend dynamique | React 18, React Router |
| Communication | API REST, JSON, Axios |
| Backend | PHP 8.2 |
| Base de données | MySQL 8 (MariaDB) |
| Authentification | JWT (JSON Web Token) |
| PDF | TCPDF |
| QR Code | API QR Server |
| Graphiques | Recharts |

---

## Prérequis

- XAMPP (Apache + MySQL) version 8+
- Node.js version 16+
- Composer version 2+
- Navigateur moderne (Chrome, Firefox, Edge)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/osaifa25/eduschedule-pro.git
cd eduschedule-pro
```

### 2. Configurer le backend

Copier le dossier dans XAMPP :C:\xampp\htdocs\eduschedule-pro\
Installer les dépendances PHP :
```bash
cd backend
composer install
```

### 3. Configurer la base de données

1. Démarrer XAMPP (Apache + MySQL)
2. Ouvrir phpMyAdmin : `http://localhost/phpmyadmin`
3. Importer le script SQL : `database/eduschedule_pro.sql`

### 4. Installer le frontend

```bash
cd frontend
npm install
npm start
```

L'application s'ouvre sur `http://localhost:3000`

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@isge.bf | password |
| Enseignant | bere@isge.bf | password |
| Enseignant 2 | kabore@isge.bf | password |
| Délégué | delegue1@isge.bf | password |
| Surveillant | surveillant@isge.bf | password |
| Comptable | comptable@isge.bf | password |

---

## Modules

### 1. Gestion de l'emploi du temps
- Création et gestion des plannings hebdomadaires
- Détection automatique des conflits (enseignant/salle)
- Publication et export PDF
- Génération des QR Codes par créneau

### 2. Pointage QR-Code
- Scan QR via caméra ou saisie manuelle du token
- Validation temporelle (±15 minutes)
- Détection des retards et absences
- Journal de tous les pointages

### 3. Cahier de texte numérique
- Saisie du contenu pédagogique par le délégué
- Signatures numériques (canvas HTML5)
- Workflow de validation (délégué → enseignant)
- Export PDF de chaque fiche

### 4. Fiche de vacation et paiement
- Calcul automatique des montants
- Workflow de validation (surveillant → comptable)
- Export PDF comptable
- Historique des paiements

### 5. Tableau de bord et statistiques
- KPIs en temps réel par rôle
- Graphiques (séances par jour, statut vacations)
- Notifications automatiques
- Mode sombre / clair

---

## Structure du projet
eduschedule-pro/
├── backend/
│   ├── api/          # Endpoints REST PHP
│   ├── config/       # Configuration BDD, CORS, JWT
│   ├── middleware/   # Authentification JWT
│   ├── models/       # Classes métier
│   ├── utils/        # Utilitaires (token, PDF)
│   └── vendor/       # Dépendances Composer
├── frontend/
│   ├── public/       # Fichiers statiques
│   └── src/
│       ├── components/  # Composants réutilisables
│       ├── context/     # Contextes React (Auth, Theme)
│       ├── pages/       # Pages de l'application
│       └── utils/       # Utilitaires (API)
├── html/
│   ├── index.html    # Page d'accueil statique
│   └── login.html    # Page login statique
├── database/
│   └── eduschedule_pro.sql  # Script SQL complet
└── README.md
---

## Auteurs
KABORE Osaifa
ZAONGO Leila Hindatou
SANKARA Analie Moniqua 

Groupe — ISGE RST 2025-2026
Module Développement Web — Dr Wend-Panga Cédric BÉRÉ