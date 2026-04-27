<?php
/**
 * API Matières — Gestion CRUD des matières
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

// ---- GET : Liste des matières ----
if ($method === 'GET') {
    authentifierRequete();
    $conn   = getConnection();
    $result = $conn->query("SELECT * FROM matieres ORDER BY libelle");
    $data   = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

// ---- POST : Créer une matière ----
} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d    = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $code    = $conn->real_escape_string($d['code']    ?? '');
    $libelle = $conn->real_escape_string($d['libelle'] ?? '');
    $volume  = intval($d['volume_horaire_total'] ?? 0);
    $coef    = floatval($d['coefficient']        ?? 1);
    $conn->query("INSERT INTO matieres (code, libelle, volume_horaire_total, coefficient)
                  VALUES ('$code','$libelle',$volume,$coef)");
    echo json_encode(['success' => true, 'message' => 'Matière créée', 'id' => $conn->insert_id]);
    $conn->close();

// ---- PUT : Modifier une matière ----
} elseif ($method === 'PUT') {
    verifierRole(['administrateur']);
    $d    = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $code    = $conn->real_escape_string($d['code']    ?? '');
    $libelle = $conn->real_escape_string($d['libelle'] ?? '');
    $volume  = intval($d['volume_horaire_total']   ?? 0);
    $coef    = floatval($d['coefficient']           ?? 1);
    $conn->query("UPDATE matieres SET code='$code', libelle='$libelle',
                  volume_horaire_total=$volume, coefficient=$coef
                  WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Matière modifiée']);
    $conn->close();

// ---- DELETE : Supprimer une matière ----
} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    $conn->query("DELETE FROM matieres WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Matière supprimée']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>