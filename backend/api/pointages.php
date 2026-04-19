<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'scan') {
    $utilisateur = authentifierRequete();
    $d = json_decode(file_get_contents('php://input'), true);

    if (!isset($d['token_qr'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token QR requis']);
        exit();
    }

    $conn = getConnection();
    $token = $conn->real_escape_string($d['token_qr']);

    // Vérifier que le token existe et n'est pas expiré
    $result = $conn->query("SELECT cr.*, m.libelle AS matiere, c.libelle AS classe
                            FROM creneaux cr
                            JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                            JOIN matieres m ON cr.id_matiere = m.id
                            JOIN classes c ON et.id_classe = c.id
                            WHERE cr.qr_token = '$token' 
                            AND cr.qr_expire > NOW()");

    if ($result->num_rows === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'QR Code invalide ou expiré']);
        exit();
    }

    $creneau = $result->fetch_assoc();

    // Vérifier si déjà pointé
    $dejaPointe = $conn->query("SELECT id FROM pointages WHERE id_creneau={$creneau['id']}");
    if ($dejaPointe->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cette séance a déjà été pointée']);
        exit();
    }

    // Calculer le statut (retard si > 15 min)
    $heurePrevu = strtotime(date('Y-m-d') . ' ' . $creneau['heure_debut']);
    $maintenant = time();
    $diff = ($maintenant - $heurePrevu) / 60;
    $statut = $diff > 15 ? 'retard' : 'a_lheure';

    $ip = $conn->real_escape_string($_SERVER['REMOTE_ADDR']);
    $conn->query("INSERT INTO pointages (id_creneau, ip_source, token_utilise, statut)
                  VALUES ({$creneau['id']}, '$ip', '$token', '$statut')");

    // Invalider le QR après usage
    $conn->query("UPDATE creneaux SET qr_token=NULL, qr_expire=NULL WHERE id={$creneau['id']}");

    echo json_encode([
        'success' => true,
        'message' => 'Pointage enregistré',
        'statut'  => $statut,
        'seance'  => [
            'matiere' => $creneau['matiere'],
            'classe'  => $creneau['classe'],
            'heure_debut' => $creneau['heure_debut'],
            'heure_fin'   => $creneau['heure_fin']
        ]
    ]);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>