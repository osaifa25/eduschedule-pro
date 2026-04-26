<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    authentifierRequete();
    $conn = getConnection();
    $where = [];
    if (isset($_GET['id_classe'])) $where[] = "et.id_classe=" . intval($_GET['id_classe']);
    if (isset($_GET['semaine'])) $where[] = "et.semaine_debut='" . $conn->real_escape_string($_GET['semaine']) . "'";
    $sql = "SELECT et.*, c.libelle AS classe_libelle 
            FROM emploi_temps et 
            JOIN classes c ON et.id_classe = c.id";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY et.semaine_debut DESC";
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        // Charger les créneaux
        $id = $row['id'];
        $creneaux = [];
        $rc = $conn->query("SELECT cr.*, m.libelle AS matiere, e.nom, e.prenom, s.code AS salle
                            FROM creneaux cr
                            JOIN matieres m ON cr.id_matiere = m.id
                            JOIN enseignants e ON cr.id_enseignant = e.id
                            JOIN salles s ON cr.id_salle = s.id
                            WHERE cr.id_emploi_temps = $id");
        while ($c = $rc->fetch_assoc()) $creneaux[] = $c;
        $row['creneaux'] = $creneaux;
        $data[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'POST' && $action === '') {
    $admin = verifierRole(['administrateur']);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['id_classe'], $d['semaine_debut'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn = getConnection();
    $id_classe    = intval($d['id_classe']);
    $semaine      = $conn->real_escape_string($d['semaine_debut']);
    $cree_par     = $admin['id'];
    $conn->query("INSERT INTO emploi_temps (id_classe, semaine_debut, cree_par) 
                  VALUES ($id_classe, '$semaine', $cree_par)");
    $id_et = $conn->insert_id;

   // Insérer les créneaux si fournis
$conflits = [];
if (!empty($d['creneaux'])) {
    foreach ($d['creneaux'] as $cr) {
        $id_matiere    = intval($cr['id_matiere']);
        $id_enseignant = intval($cr['id_enseignant']);
        $id_salle      = intval($cr['id_salle']);
        $jour          = $conn->real_escape_string($cr['jour']);
        $heure_debut   = $conn->real_escape_string($cr['heure_debut']);
        $heure_fin     = $conn->real_escape_string($cr['heure_fin']);

        // Vérifier conflit enseignant
        $conflitEns = $conn->query("
            SELECT cr2.id FROM creneaux cr2
            JOIN emploi_temps et2 ON cr2.id_emploi_temps = et2.id
            WHERE cr2.id_enseignant = $id_enseignant
            AND cr2.jour = '$jour'
            AND et2.statut_publication = 'publie'
            AND (
                (cr2.heure_debut <= '$heure_debut' AND cr2.heure_fin > '$heure_debut')
                OR (cr2.heure_debut < '$heure_fin' AND cr2.heure_fin >= '$heure_fin')
                OR (cr2.heure_debut >= '$heure_debut' AND cr2.heure_fin <= '$heure_fin')
            )
        ");

        if ($conflitEns->num_rows > 0) {
            $conflits[] = "Conflit enseignant le $jour de $heure_debut à $heure_fin";
            continue;
        }

        // Vérifier conflit salle
        $conflitSalle = $conn->query("
            SELECT cr2.id FROM creneaux cr2
            JOIN emploi_temps et2 ON cr2.id_emploi_temps = et2.id
            WHERE cr2.id_salle = $id_salle
            AND cr2.jour = '$jour'
            AND et2.statut_publication = 'publie'
            AND (
                (cr2.heure_debut <= '$heure_debut' AND cr2.heure_fin > '$heure_debut')
                OR (cr2.heure_debut < '$heure_fin' AND cr2.heure_fin >= '$heure_fin')
                OR (cr2.heure_debut >= '$heure_debut' AND cr2.heure_fin <= '$heure_fin')
            )
        ");

        if ($conflitSalle->num_rows > 0) {
            $conflits[] = "Conflit salle le $jour de $heure_debut à $heure_fin";
            continue;
        }

        // Insérer le créneau sans conflit
        $conn->query("INSERT INTO creneaux 
            (id_emploi_temps, id_matiere, id_enseignant, id_salle, jour, heure_debut, heure_fin)
            VALUES ($id_et, $id_matiere, $id_enseignant, $id_salle, '$jour', '$heure_debut', '$heure_fin')");
    }
}

// Retourner les conflits s'il y en a
if (!empty($conflits)) {
    echo json_encode([
        'success'  => true,
        'message'  => 'Emploi du temps créé avec ' . count($conflits) . ' conflit(s) ignoré(s)',
        'id'       => $id_et,
        'conflits' => $conflits
    ]);
} else {
    echo json_encode(['success' => true, 'message' => 'Emploi du temps créé', 'id' => $id_et]);
}
$conn->close();
    

} elseif ($method === 'PUT' && $action === 'publier') {
    verifierRole(['administrateur']);
    $id = intval($_GET['id'] ?? 0);
    $conn = getConnection();
    $conn->query("UPDATE emploi_temps SET statut_publication='publie' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Emploi du temps publié']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>