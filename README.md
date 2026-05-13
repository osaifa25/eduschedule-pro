# EduSchedule Pro 📅

Système Intégré de Gestion de l'Emploi du Temps et de Suivi Pédagogique des Séances de Cours.
Tres performant 


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
| QR Code | qrcode.react (génération locale) |
| Scan QR | Page PHP directe (sans connexion requise) |
| Graphiques | Recharts |

---

## Prérequis

- XAMPP (Apache + MySQL) version 8+
- Node.js version 18+
- Navigateur moderne (Chrome, Firefox, Edge, Safari)
- Réseau local WiFi (pour le scan QR depuis mobile)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/osaifa25/eduschedule-pro.git
cd eduschedule-pro
```

### 2. Configurer le backend

Copier le dossier dans XAMPP :C:\xampp\htdocs\eduschedule-pro\
### 3. Configurer la base de données

1. Démarrer XAMPP (Apache + MySQL)
2. Ouvrir phpMyAdmin : `http://localhost/phpmyadmin`
3. Créer la base de données `eduschedule_pro`
4. Importer le script SQL : `database/eduschedule_pro.sql`

### 4. Installer le frontend

```bash
cd frontend
npm install
npm start
```

L'application s'ouvre sur `http://localhost:3000`

### 5. Accès depuis un appareil mobile (scan QR)

Pour permettre aux enseignants de scanner les QR codes depuis leur téléphone :

1. Activer le hotspot sur le téléphone OU connecter PC et téléphone au même réseau WiFi
2. Trouver l'IP du PC :
```bash
ipconfig
# Noter l'adresse IPv4 sous "Carte réseau sans fil Wi-Fi"
# Exemple : 172.20.10.3
```
3. Lancer React en mode réseau :
```bash
cd frontend
set HOST=0.0.0.0
set PORT=3000
npm start
```
4. Ouvrir le pare-feu pour Apache et React :
```bash
netsh advfirewall firewall add rule name="React 3000" protocol=TCP dir=in localport=3000 action=allow
netsh advfirewall firewall add rule name="XAMPP Apache 80" protocol=TCP dir=in localport=80 action=allow
```
5. Le téléphone accède à l'app via : `http://[IP_DU_PC]:3000`
6. Le scan QR ouvre directement : `http://[IP_DU_PC]/eduschedule-pro/backend/api/pointage_scan.php?token=XXX`

> ⚠️ Le professeur n'a **pas besoin de se connecter** pour pointer — il scanne le QR et la validation est automatique.

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
- Création et gestion des plannings hebdomadaires par classe
- Affichage style institutionnel ISGE (3 plages horaires : 7h30, 10h, 15h)
- Détection automatique des conflits (enseignant/salle)
- Publication / dépublication d'un planning
- Modification de la classe et de la semaine d'un planning existant
- Ajout / modification / suppression de créneaux individuels
- Marquage des jours fériés par emploi du temps (affichage visuel en orange)
- Ajout de devoirs manuels spécifiques à chaque classe
- Affichage des devoirs issus des cahiers de texte dans le tableau récapitulatif
- Génération des QR Codes par créneau (usage unique, expiration configurable)
- Export PDF de l'emploi du temps

### 2. Pointage QR-Code
- Génération de QR codes contenant un lien direct vers la page de pointage PHP
- Scan QR depuis n'importe quel téléphone sans installation ni connexion requise
- Validation temporelle automatique (retard si > 15 minutes)
- Détection des retards avec alerte au surveillant
- QR code à usage unique (invalidé après scan)
- Page de confirmation mobile responsive (vert = OK, orange = retard, rouge = erreur)
- Journal complet de tous les pointages (réussis et échoués)

### 3. Cahier de texte numérique
- Saisie du contenu pédagogique par le délégué
- Signatures numériques (canvas HTML5) pour délégué et enseignant
- Workflow de validation : Brouillon → Signé délégué → Clôturé
- Saisie des travaux demandés avec dates limites
- Export PDF de chaque fiche
- Verrouillage automatique après clôture

### 4. Fiche de vacation et paiement
- Calcul automatique des montants (durée × taux horaire)
- Workflow de validation multi-niveaux : Enseignant → Surveillant → Comptable
- Contrôles de cohérence automatiques
- Export PDF comptable avec signatures
- Historique des paiements par enseignant et par mois

### 5. Tableau de bord et statistiques
- KPIs en temps réel adaptés à chaque rôle
- Graphiques (séances par jour, statut vacations) via Recharts
- Alertes : séances non pointées, cahiers non signés, retards
- Journal d'activité complet (logs)

---

## Structure du projet
eduschedule-pro/
├── backend/
│   ├── api/
│   │   ├── auth.php              # Authentification JWT
│   │   ├── emploi_temps.php      # CRUD plannings
│   │   ├── creneaux.php          # CRUD créneaux
│   │   ├── qrcode.php            # Génération QR codes
│   │   ├── pointage_scan.php     # Page scan QR (mobile, sans auth)
│   │   ├── cahiers.php           # Cahiers de texte
│   │   ├── vacations.php         # Fiches de vacation
│   │   ├── classes.php           # Référentiel classes
│   │   ├── enseignants.php       # Référentiel enseignants
│   │   ├── matieres.php          # Référentiel matières
│   │   ├── salles.php            # Référentiel salles
│   │   └── dashboard.php         # Statistiques tableau de bord
│   ├── config/
│   │   ├── database.php          # Connexion MySQL
│   │   ├── cors.php              # Headers CORS
│   │   └── jwt.php               # Clé secrète JWT
│   ├── middleware/
│   │   └── jwt_helper.php        # Vérification tokens JWT
│   └── utils/                    # Utilitaires (PDF, emails)
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/           # Composants réutilisables
│       ├── context/              # AuthContext
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── EmploiTempsPage.jsx   # Emploi du temps institutionnel
│       │   ├── PointagePage.jsx
│       │   ├── CahierTextePage.jsx
│       │   ├── VacationPage.jsx
│       │   └── DashboardPage.jsx
│       └── utils/
│           └── api.js            # Configuration Axios (IP automatique)
├── database/
│   └── eduschedule_pro.sql       # Script SQL complet + données de démo
└── README.md
---

## Fonctionnement du scan QR mobile
Admin génère QR (app React)
↓
QR contient : http://[IP_PC]/eduschedule-pro/backend/api/pointage_scan.php?token=XXX
↓
Prof scanne avec son téléphone (caméra native iOS/Android)
↓
Navigateur ouvre la page PHP directement
↓
Système vérifie : token valide ? heure dans la fenêtre ?
↓
✅ Pointage enregistré → page de confirmation affichée
⚠️ Retard détecté → alerte envoyée au surveillant
❌ Token invalide/expiré → message d'erreur

---

## Notes techniques importantes

- **IP automatique** : le fichier `api.js` détecte automatiquement le hostname — fonctionne sur `localhost` (PC) et sur l'IP réseau (mobile) sans modification
- **QR code local** : généré via `qrcode.react` directement dans le navigateur, sans dépendance internet
- **Usage unique** : chaque QR code est invalidé après le premier scan
- **Suppression en cascade** : la suppression d'un emploi du temps supprime automatiquement les créneaux, pointages, cahiers de texte, signatures et travaux associés
- **Devoirs par classe** : les devoirs manuels sont spécifiques à chaque emploi du temps, non partagés entre classes

---

## Auteurs

| Nom | Rôle dans le projet |
|-----|---------------------|
| KABORE Osaifa | Chef de projet, Backend PHP, API REST |
| ZAONGO Leila Hindatou | Frontend React, Interfaces utilisateur |
| SANKARA Analie Moniqua | Base de données, Tests, Documentation |

**Groupe — ISGE RST 2025-2026**
**Module Développement Web — Dr Wend-Panga Cédric BÉRÉ**