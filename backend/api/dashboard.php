<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$utilisateur = authentifierRequete();
$conn = getConnection();
$role = $utilisateur['role'];
$stats = [];

if ($role === 'administrateur') {
    $stats['total_classes']     = $conn->query("SELECT COUNT(*) c FROM classes")->fetch_assoc()['c'];
    $stats['total_enseignants'] = $conn->query("SELECT COUNT(*) c FROM enseignants")->fetch_assoc()['c'];
    $stats['seances_aujourd_hui'] = $conn->query("SELECT COUNT(*) c FROM creneaux cr
        JOIN emploi_temps et ON cr.id_emploi_temps=et.id
        WHERE DAYNAME(CURDATE()) = cr.jour")->fetch_assoc()['c'];
    $stats['cahiers_non_signes'] = $conn->query("SELECT COUNT(*) c FROM cahiers_texte WHERE statut='brouillon'")->fetch_assoc()['c'];
    $stats['vacations_en_attente'] = $conn->query("SELECT COUNT(*) c FROM vacations WHERE statut='generee'")->fetch_assoc()['c'];

} elseif ($role === 'enseignant') {
    $id_ens = $utilisateur['id_lien'] ?? 0;
    $stats['mes_seances_semaine'] = $conn->query("SELECT COUNT(*) c FROM creneaux WHERE id_enseignant=$id_ens")->fetch_assoc()['c'];
    $stats['mes_vacations'] = $conn->query("SELECT COUNT(*) c FROM vacations WHERE id_enseignant=$id_ens")->fetch_assoc()['c'];
    $stats['montant_total'] = $conn->query("SELECT COALESCE(SUM(montant_net),0) s FROM vacations WHERE id_enseignant=$id_ens AND statut='approuvee'")->fetch_assoc()['s'];

} elseif ($role === 'delegue') {
    $stats['cahiers_a_remplir'] = $conn->query("SELECT COUNT(*) c FROM cahiers_texte WHERE id_delegue={$utilisateur['id']} AND statut='brouillon'")->fetch_assoc()['c'];
    $stats['cahiers_signes'] = $conn->query("SELECT COUNT(*) c FROM cahiers_texte WHERE id_delegue={$utilisateur['id']} AND statut='cloture'")->fetch_assoc()['c'];
}

echo json_encode(['success' => true, 'data' => $stats]);
$conn->close();
?>