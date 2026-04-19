<?php
require_once __DIR__ . '/../utils/token.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'login') {
    $donnees = json_decode(file_get_contents('php://input'), true);

    if (!isset($donnees['email']) || !isset($donnees['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email et mot de passe requis']);
        exit();
    }

    $conn = getConnection();
    $email = $conn->real_escape_string($donnees['email']);

    $sql = "SELECT * FROM utilisateurs WHERE email = '$email' AND actif = 1";
    $result = $conn->query($sql);

    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
        exit();
    }

    $utilisateur = $result->fetch_assoc();

    if (!password_verify($donnees['password'], $utilisateur['mot_de_passe_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
        exit();
    }

    $payload = [
        'id'    => $utilisateur['id'],
        'email' => $utilisateur['email'],
        'role'  => $utilisateur['role'],
        'exp'   => time() + JWT_EXPIRATION
    ];

    $token = genererToken($payload);

    // Log de connexion
    $ip = $_SERVER['REMOTE_ADDR'];
    $conn->query("INSERT INTO logs_activite (id_utilisateur, action, ip) 
                  VALUES ({$utilisateur['id']}, 'connexion', '$ip')");

    echo json_encode([
        'success' => true,
        'token'   => $token,
        'user'    => [
            'id'    => $utilisateur['id'],
            'email' => $utilisateur['email'],
            'role'  => $utilisateur['role']
        ]
    ]);

    $conn->close();

} elseif ($method === 'POST' && $action === 'logout') {
    $utilisateur = authentifierRequete();
    $conn = getConnection();
    $conn->query("INSERT INTO logs_activite (id_utilisateur, action, ip) 
                  VALUES ({$utilisateur['id']}, 'deconnexion', '{$_SERVER['REMOTE_ADDR']}')");
    $conn->close();
    echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);

} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Route non trouvée']);
}
?>