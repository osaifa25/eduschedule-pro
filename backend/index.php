<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = ltrim($uri, '/');
$file = __DIR__ . '/' . $uri;

if (file_exists($file) && !is_dir($file)) {
    return false;
}

echo json_encode([
    'success' => true,
    'message' => 'EduSchedule Pro API v1.0',
    'status'  => 'running'
]);