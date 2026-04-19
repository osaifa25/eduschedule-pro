<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    authentifierRequete();
    $conn = getConnection();
    $annee = isset($_GET['annee']) ? $conn->real_escape_string($_GET['annee']) : '';
    $sql = "SELECT * FROM classes";
    if ($annee) $sql .= " WHERE annee_academique = '$annee'";
    $sql .= " ORDER BY niveau, libelle";
    $result = $conn->query($sql);
    $classes = [];
    while ($row = $result->fetch_assoc()) $classes[] = $row;
    echo json_encode(['success' => true, 'data' => $classes]);
    $conn->close();

} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $donnees = json_decode(file_get_contents('php://input'), true);
    if (!isset($donnees['code'], $donnees['libelle'], $donnees['niveau'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn = getConnection();
    $code    = $conn->real_escape_string($donnees['code']);
    $libelle = $conn->real_escape_string($donnees['libelle']);
    $niveau  = $conn->real_escape_string($donnees['niveau']);
    $annee   = $conn->real_escape_string($donnees['annee_academique'] ?? '2025-2026');
    $conn->query("INSERT INTO classes (code, libelle, niveau, annee_academique) 
                  VALUES ('$code', '$libelle', '$niveau', '$annee')");
    echo json_encode(['success' => true, 'message' => 'Classe créée', 'id' => $conn->insert_id]);
    $conn->close();

} elseif ($method === 'PUT') {
    verifierRole(['administrateur']);
    $id = intval($_GET['id'] ?? 0);
    $donnees = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $libelle = $conn->real_escape_string($donnees['libelle'] ?? '');
    $niveau  = $conn->real_escape_string($donnees['niveau'] ?? '');
    $conn->query("UPDATE classes SET libelle='$libelle', niveau='$niveau' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Classe modifiée']);
    $conn->close();

} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $id = intval($_GET['id'] ?? 0);
    $conn = getConnection();
    $conn->query("DELETE FROM classes WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Classe supprimée']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>