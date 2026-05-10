<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

if ($method === 'GET' && $id > 0) {
    verifierRole(['administrateur']);
    $conn = getConnection();

    // Générer un token unique
    $token  = bin2hex(random_bytes(16));
    $expire = date('Y-m-d H:i:s', strtotime('+1 day'));

    $conn->query("UPDATE creneaux SET qr_token='$token', qr_expire='$expire' WHERE id=$id");

    // URL automatique basée sur le serveur
    $host   = $_SERVER['SERVER_ADDR'] ?? '172.20.10.3';
    $qr_url = "http://$host/eduschedule-pro/backend/api/pointage_scan.php?token=$token";

    echo json_encode([
        'success' => true,
        'token'   => $token,
        'qr_url'  => $qr_url,
        'expire'  => $expire
    ]);

    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>