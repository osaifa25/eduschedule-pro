<?php
/**
 * API Classes — Gestion CRUD des classes
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

// Récupération de la méthode HTTP et de l'ID
$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

// ---- GET : Liste des classes ----
if ($method === 'GET') {
    authentifierRequete();
    $conn  = getConnection();
    $annee = isset($_GET['annee']) ? $conn->real_escape_string($_GET['annee']) : '';
    $sql   = "SELECT * FROM classes";
    if ($annee) $sql .= " WHERE annee_academique = '$annee'";
    $sql  .= " ORDER BY niveau, libelle";
    $result  = $conn->query($sql);
    $classes = [];
    while ($row = $result->fetch_assoc()) $classes[] = $row;
    echo json_encode(['success' => true, 'data' => $classes]);
    $conn->close();

// ---- POST : Créer une classe ----
} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $donnees = json_decode(file_get_contents('php://input'), true);

    // Vérification des champs obligatoires
    if (!isset($donnees['code'], $donnees['libelle'], $donnees['niveau'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn    = getConnection();
    $code    = $conn->real_escape_string($donnees['code']);
    $libelle = $conn->real_escape_string($donnees['libelle']);
    $niveau  = $conn->real_escape_string($donnees['niveau']);
    $annee   = $conn->real_escape_string($donnees['annee_academique'] ?? '2025-2026');
    $conn->query("INSERT INTO classes (code, libelle, niveau, annee_academique)
                  VALUES ('$code', '$libelle', '$niveau', '$annee')");
    echo json_encode(['success' => true, 'message' => 'Classe créée', 'id' => $conn->insert_id]);
    $conn->close();

// ---- PUT : Modifier une classe ----
} elseif ($method === 'PUT') {
    verifierRole(['administrateur']);
    $donnees = json_decode(file_get_contents('php://input'), true);
    $conn    = getConnection();
    $code    = $conn->real_escape_string($donnees['code']    ?? '');
    $libelle = $conn->real_escape_string($donnees['libelle'] ?? '');
    $niveau  = $conn->real_escape_string($donnees['niveau']  ?? '');
    $annee   = $conn->real_escape_string($donnees['annee_academique'] ?? '2025-2026');
    $conn->query("UPDATE classes SET code='$code', libelle='$libelle',
                  niveau='$niveau', annee_academique='$annee' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Classe modifiée']);
    $conn->close();

// ---- DELETE : Supprimer une classe ----
} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    $conn->query("DELETE FROM classes WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Classe supprimée']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>