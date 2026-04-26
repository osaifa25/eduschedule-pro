<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$utilisateur = authentifierRequete();
$conn = getConnection();
$role = $utilisateur['role'];
$notifications = [];

if ($role === 'administrateur') {
    // Cahiers non signés
    $r = $conn->query("SELECT COUNT(*) c FROM cahiers_texte WHERE statut='brouillon'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'warning',
        'icon'    => '📝',
        'message' => "$nb cahier(s) de texte en attente de signature",
        'lien'    => '/cahiers'
    ];

    // Vacations en attente
    $r = $conn->query("SELECT COUNT(*) c FROM vacations WHERE statut='generee'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'info',
        'icon'    => '💰',
        'message' => "$nb fiche(s) de vacation en attente de visa",
        'lien'    => '/vacations'
    ];

    // Séances sans pointage aujourd'hui
    $jour = date('l');
    $joursMap = [
        'Monday' => 'Lundi', 'Tuesday' => 'Mardi', 'Wednesday' => 'Mercredi',
        'Thursday' => 'Jeudi', 'Friday' => 'Vendredi', 'Saturday' => 'Samedi'
    ];
    $jourFR = $joursMap[$jour] ?? '';
    if ($jourFR) {
        $r = $conn->query("SELECT COUNT(*) c FROM creneaux cr
                           JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                           LEFT JOIN pointages p ON p.id_creneau = cr.id
                           WHERE cr.jour = '$jourFR'
                           AND et.statut_publication = 'publie'
                           AND p.id IS NULL");
        $nb = $r->fetch_assoc()['c'];
        if ($nb > 0) $notifications[] = [
            'type'    => 'danger',
            'icon'    => '⚠️',
            'message' => "$nb séance(s) non pointée(s) aujourd'hui",
            'lien'    => '/emploi-temps'
        ];
    }
}

if ($role === 'surveillant') {
    $r = $conn->query("SELECT COUNT(*) c FROM vacations WHERE statut='generee'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'warning',
        'icon'    => '💰',
        'message' => "$nb fiche(s) à viser",
        'lien'    => '/vacations'
    ];
}

if ($role === 'comptable') {
    $r = $conn->query("SELECT COUNT(*) c FROM vacations WHERE statut='visee_surveillant'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'success',
        'icon'    => '✅',
        'message' => "$nb fiche(s) à approuver",
        'lien'    => '/vacations'
    ];
}

if ($role === 'delegue') {
    $r = $conn->query("SELECT COUNT(*) c FROM cahiers_texte WHERE id_delegue={$utilisateur['id']} AND statut='brouillon'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'warning',
        'icon'    => '📝',
        'message' => "$nb cahier(s) à signer",
        'lien'    => '/cahiers'
    ];
}

if ($role === 'enseignant') {
    $id_ens = $utilisateur['id_lien'] ?? 0;
    $r = $conn->query("SELECT COUNT(*) c FROM cahiers_texte ct
                       JOIN creneaux cr ON ct.id_creneau = cr.id
                       WHERE cr.id_enseignant = $id_ens
                       AND ct.statut = 'signe_delegue'");
    $nb = $r->fetch_assoc()['c'];
    if ($nb > 0) $notifications[] = [
        'type'    => 'info',
        'icon'    => '✍️',
        'message' => "$nb cahier(s) en attente de votre signature",
        'lien'    => '/cahiers'
    ];
}

echo json_encode(['success' => true, 'data' => $notifications, 'count' => count($notifications)]);
$conn->close();
?>