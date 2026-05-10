<?php
// Point d'entrée principal — redirige vers les APIs
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = ltrim($uri, '/');

// Router les requetes vers les bons fichiers
if (file_exists(__DIR__ . '/' . $uri)) {
    return false;
}

// Route par défaut
echo json_encode([
    'success' => true,
    'message' => 'EduSchedule Pro API',
    'version' => '1.0'
]);