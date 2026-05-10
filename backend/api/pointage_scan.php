<?php
require_once __DIR__ . '/../config/database.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    afficherPage('❌ Token manquant', 'Lien QR invalide.', 'rouge');
    exit();
}

$conn = getConnection();
$token_safe = $conn->real_escape_string($token);

// Chercher le créneau correspondant
$sql = "SELECT cr.*, 
               m.libelle AS matiere,
               e.nom, e.prenom,
               s.code AS salle,
               c.libelle AS classe
        FROM creneaux cr
        JOIN matieres m ON cr.id_matiere = m.id
        JOIN enseignants e ON cr.id_enseignant = e.id
        JOIN salles s ON cr.id_salle = s.id
        JOIN emploi_temps et ON cr.id_emploi_temps = et.id
        JOIN classes c ON et.id_classe = c.id
        WHERE cr.qr_token = '$token_safe'";

$result = $conn->query($sql);

if ($result->num_rows === 0) {
    afficherPage('❌ QR Code invalide', 'Ce QR code ne correspond à aucune séance.', 'rouge');
    exit();
}

$creneau = $result->fetch_assoc();

// Vérifier expiration
if (strtotime($creneau['qr_expire']) < time()) {
    afficherPage('⏰ QR Code expiré', 'Ce QR code a expiré. Demandez-en un nouveau à l\'administrateur.', 'orange');
    exit();
}

// Vérifier si déjà pointé
$id_creneau = intval($creneau['id']);
$dejaPouinte = $conn->query("SELECT id FROM pointages WHERE id_creneau = $id_creneau");
if ($dejaPouinte->num_rows > 0) {
    afficherPage(
        '✅ Déjà pointé',
        "La séance de <strong>{$creneau['matiere']}</strong> a déjà été pointée.",
        'vert'
    );
    exit();
}

// Enregistrer le pointage
$heure_reelle = date('Y-m-d H:i:s');
$ip           = $_SERVER['REMOTE_ADDR'];
$heure_prev   = $creneau['heure_debut'];
$heure_now    = date('H:i:s');

// Calculer le statut (retard si > 15 min)
$diff = (strtotime($heure_now) - strtotime($heure_prev)) / 60;
$statut = $diff > 15 ? 'retard' : 'valide';

$conn->query("INSERT INTO pointages (id_creneau, heure_pointage_reelle, ip_source, token_utilise, statut)
              VALUES ($id_creneau, '$heure_reelle', '$ip', '$token_safe', '$statut')");

// Invalider le token (usage unique)
$conn->query("UPDATE creneaux SET qr_token = NULL WHERE id = $id_creneau");

$conn->close();

// Message selon statut
if ($statut === 'retard') {
    afficherPage(
        '⚠️ Pointage enregistré avec retard',
        "Séance : <strong>{$creneau['matiere']}</strong><br>
         Classe : {$creneau['classe']}<br>
         Salle : {$creneau['salle']}<br>
         Heure prévue : {$creneau['heure_debut']}<br>
         Heure réelle : " . date('H:i') . "<br><br>
         <em>Un retard a été signalé au surveillant.</em>",
        'orange'
    );
} else {
    afficherPage(
        '✅ Pointage validé !',
        "Séance : <strong>{$creneau['matiere']}</strong><br>
         Classe : {$creneau['classe']}<br>
         Salle : {$creneau['salle']}<br>
         Heure : " . date('H:i') . "<br><br>
         <em>Bonne séance !</em>",
        'vert'
    );
}

// Fonction d'affichage page simple mobile
function afficherPage($titre, $message, $couleur) {
    $couleurs = [
        'vert'   => ['bg' => '#f0fdf4', 'border' => '#16a34a', 'text' => '#14532d', 'icon_bg' => '#dcfce7'],
        'orange' => ['bg' => '#fffbeb', 'border' => '#d97706', 'text' => '#713f12', 'icon_bg' => '#fef9c3'],
        'rouge'  => ['bg' => '#fef2f2', 'border' => '#dc2626', 'text' => '#7f1d1d', 'icon_bg' => '#fee2e2'],
    ];
    $c = $couleurs[$couleur];
    echo "<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>EduSchedule Pro — Pointage</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: {$c['bg']};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: white;
            border-radius: 20px;
            border: 2px solid {$c['border']};
            padding: 40px 32px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .icon {
            width: 72px; height: 72px;
            background: {$c['icon_bg']};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem;
            margin: 0 auto 20px;
        }
        h1 { font-size: 1.4rem; color: {$c['text']}; margin-bottom: 16px; font-weight: 800; }
        p  { font-size: 0.95rem; color: #374151; line-height: 1.7; }
        .footer { margin-top: 32px; font-size: 0.75rem; color: #94a3b8; }
    </style>
</head>
<body>
    <div class='card'>
        <div class='icon'>" . mb_substr($titre, 0, 2) . "</div>
        <h1>$titre</h1>
        <p>$message</p>
        <div class='footer'>EduSchedule Pro — ISGE-BF</div>
    </div>
</body>
</html>";
}
?>