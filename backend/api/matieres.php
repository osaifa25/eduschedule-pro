<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    authentifierRequete();
    $conn = getConnection();
    $result = $conn->query("SELECT * FROM matieres ORDER BY libelle");
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $code    = $conn->real_escape_string($d['code']);
    $libelle = $conn->real_escape_string($d['libelle']);
    $volume  = intval($d['volume_horaire_total'] ?? 0);
    $coef    = floatval($d['coefficient'] ?? 1);
    $conn->query("INSERT INTO matieres (code, libelle, volume_horaire_total, coefficient) VALUES ('$code','$libelle',$volume,$coef)");
    echo json_encode(['success' => true, 'message' => 'Matière créée', 'id' => $conn->insert_id]);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>