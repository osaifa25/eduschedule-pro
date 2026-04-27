<?php
/**
 * API Créneaux — Modification et suppression des créneaux
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

// ---- PUT : Modifier un créneau ----
if ($method === 'PUT') {
    verifierRole(['administrateur']);
    $d    = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $id_matiere    = intval($d['id_matiere']    ?? 0);
    $id_enseignant = intval($d['id_enseignant'] ?? 0);
    $id_salle      = intval($d['id_salle']      ?? 0);
    $jour          = $conn->real_escape_string($d['jour']        ?? '');
    $heure_debut   = $conn->real_escape_string($d['heure_debut'] ?? '');
    $heure_fin     = $conn->real_escape_string($d['heure_fin']   ?? '');

    // Vérification conflit enseignant
    $conflitEns = $conn->query("
        SELECT cr2.id FROM creneaux cr2
        JOIN emploi_temps et2 ON cr2.id_emploi_temps = et2.id
        WHERE cr2.id_enseignant = $id_enseignant
        AND cr2.jour = '$jour'
        AND cr2.id != $id
        AND (
            (cr2.heure_debut <= '$heure_debut' AND cr2.heure_fin > '$heure_debut')
            OR (cr2.heure_debut < '$heure_fin' AND cr2.heure_fin >= '$heure_fin')
            OR (cr2.heure_debut >= '$heure_debut' AND cr2.heure_fin <= '$heure_fin')
        )
    ");
    if ($conflitEns->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => "Conflit : enseignant déjà occupé ce créneau"]);
        exit();
    }

    // Vérification conflit salle
    $conflitSalle = $conn->query("
        SELECT cr2.id FROM creneaux cr2
        WHERE cr2.id_salle = $id_salle
        AND cr2.jour = '$jour'
        AND cr2.id != $id
        AND (
            (cr2.heure_debut <= '$heure_debut' AND cr2.heure_fin > '$heure_debut')
            OR (cr2.heure_debut < '$heure_fin' AND cr2.heure_fin >= '$heure_fin')
            OR (cr2.heure_debut >= '$heure_debut' AND cr2.heure_fin <= '$heure_fin')
        )
    ");
    if ($conflitSalle->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => "Conflit : salle déjà occupée ce créneau"]);
        exit();
    }

    $conn->query("UPDATE creneaux SET
                  id_matiere=$id_matiere, id_enseignant=$id_enseignant,
                  id_salle=$id_salle, jour='$jour',
                  heure_debut='$heure_debut', heure_fin='$heure_fin'
                  WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Créneau modifié']);
    $conn->close();

// ---- DELETE : Supprimer un créneau ----
} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    // Supprimer d'abord les pointages liés
    $conn->query("DELETE FROM pointages WHERE id_creneau=$id");
    // Supprimer les cahiers liés
    $conn->query("DELETE FROM signatures WHERE id_cahier IN
                  (SELECT id FROM cahiers_texte WHERE id_creneau=$id)");
    $conn->query("DELETE FROM travaux_demandes WHERE id_cahier IN
                  (SELECT id FROM cahiers_texte WHERE id_creneau=$id)");
    $conn->query("DELETE FROM cahiers_texte WHERE id_creneau=$id");
    // Supprimer le créneau
    $conn->query("DELETE FROM creneaux WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Créneau supprimé']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>