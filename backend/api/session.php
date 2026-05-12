<?php
/**
 * API Sessions actives — Voir qui est connecté
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

// Seul l'admin peut voir les sessions
verifierRole(['administrateur']);

$conn = getConnection();

// Récupérer les dernières connexions (30 dernières minutes = session active)
$result = $conn->query("
    SELECT 
        u.email,
        u.role,
        l.ip,
        l.date_heure,
        TIMESTAMPDIFF(MINUTE, l.date_heure, NOW()) AS minutes_depuis,
        CASE 
            WHEN TIMESTAMPDIFF(MINUTE, l.date_heure, NOW()) <= 30 THEN 'actif'
            ELSE 'inactif'
        END AS statut_session
    FROM logs_activite l
    JOIN utilisateurs u ON l.id_utilisateur = u.id
    WHERE l.action = 'connexion'
    AND l.date_heure >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY l.date_heure DESC
");

$sessions = [];
$emailsVus = [];

while ($row = $result->fetch_assoc()) {
    // Garder seulement la dernière session par utilisateur
    if (!in_array($row['email'], $emailsVus)) {
        $emailsVus[] = $row['email'];
        $sessions[]  = $row;
    }
}

// Compter les sessions actives
$actives = count(array_filter($sessions, fn($s) => $s['statut_session'] === 'actif'));

echo json_encode([
    'success'         => true,
    'data'            => $sessions,
    'total_sessions'  => count($sessions),
    'sessions_actives'=> $actives
]);

$conn->close();
?>