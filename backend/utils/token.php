<?php
require_once __DIR__ . '/../config/jwt.php';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function genererToken($payload) {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload_encode = base64url_encode(json_encode($payload));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$payload_encode", JWT_SECRET, true));
    return "$header.$payload_encode.$signature";
}

function verifierToken($token) {
    $parties = explode('.', $token);
    if (count($parties) !== 3) return false;
    [$header, $payload, $signature] = $parties;
    $signatureValide = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    if (!hash_equals($signature, $signatureValide)) return false;
    $donnees = json_decode(base64url_decode($payload), true);
    if (!$donnees || $donnees['exp'] < time()) return false;
    return $donnees;
}
?>