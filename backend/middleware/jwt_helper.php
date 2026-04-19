<?php
require_once __DIR__ . '/../utils/token.php';

function authentifierRequete() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Token manquant']));
    }

    $token = str_replace('Bearer ', '', $authHeader);
    $donnees = verifierToken($token);

    if (!$donnees) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Token invalide ou expiré']));
    }

    return $donnees;
}

function verifierRole($rolesAutorises) {
    $utilisateur = authentifierRequete();
    if (!in_array($utilisateur['role'], $rolesAutorises)) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Accès refusé']));
    }
    return $utilisateur;
}
?>