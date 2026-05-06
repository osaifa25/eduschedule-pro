# EduSchedule Pro

> Système Intégré de Gestion de l'Emploi du Temps et de Suivi Pédagogique des Séances de Cours

EduSchedule Pro est une application web complète conçue pour faciliter la gestion des emplois du temps, le suivi des séances de cours et la coordination pédagogique au sein des établissements d'enseignement supérieur.

---

## 🛠️ Technologies utilisées

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Bootstrap 5 |
| Backend | PHP 8, API REST |
| Base de données | MySQL 8 (MariaDB) |

---

## ⚙️ Installation

### Prérequis

- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL)
- [Node.js](https://nodejs.org/)

### 1. Configuration du Backend

1. Copier le dossier `eduschedule-pro` dans `C:\xampp\htdocs\`
2. Importer le fichier `database/eduschedule_pro.sql` dans **phpMyAdmin**
3. Démarrer **Apache** et **MySQL** depuis le panneau de contrôle XAMPP

### 2. Lancement du Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@isge.bf | password |
| Enseignant | bere@isge.bf | password |
| Délégué | delegue1@isge.bf | password |
| Surveillant | surveillant@isge.bf | password |
| Comptable | comptable@isge.bf | password |

---

## 📦 Modules principaux

1. **Gestion de l'emploi du temps** — Planification et organisation des cours
2. **Pointage QR-Code** — Suivi automatisé des présences
3. **Cahier de texte numérique** — Enregistrement du contenu des séances
4. **Fiche de vacation et paiement** — Gestion administrative des enseignants
5. **Tableau de bord et statistiques** — Vue d'ensemble et indicateurs de performance

---

## 👥 Équipe — Groupe 3 · ISGE RST 2025-2026

Ce projet a été réalisé de manière entièrement collaborative par :

| Membre | Rôle |
|--------|------|
| KABORE Osaifa | Développement Backend |
| SANKARA Moniqua | Développement Frontend |
| ZAONGO Leila | Conception & Documentation |