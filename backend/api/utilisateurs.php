<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    $result = $conn->query("SELECT id, email, role, actif FROM utilisateurs ORDER BY role");
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['email'], $d['password'], $d['role'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn = getConnection();
    $email = $conn->real_escape_string($d['email']);
    $hash  = password_hash($d['password'], PASSWORD_DEFAULT);
    $hash  = $conn->real_escape_string($hash);
    $role  = $conn->real_escape_string($d['role']);
    $id_lien = isset($d['id_lien']) ? intval($d['id_lien']) : 'NULL';
    $conn->query("INSERT INTO utilisateurs (email, mot_de_passe_hash, role, id_lien) VALUES ('$email','$hash','$role',$id_lien)");
    echo json_encode(['success' => true, 'message' => 'Utilisateur créé', 'id' => $conn->insert_id]);
    $conn->close();

} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $id = intval($_GET['id'] ?? 0);
    $conn = getConnection();
    $conn->query("UPDATE utilisateurs SET actif=0 WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Utilisateur désactivé']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>