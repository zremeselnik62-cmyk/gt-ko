<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
start_session();

$r = (string)($_GET['r'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = db();

$writes = ['register', 'login', 'logout', 'change_password', 'skin_upload', 'skin_reset', 'profile_update', 'player_add', 'ban_create', 'ban_remove', 'set_role', 'purge_demo'];
if (in_array($r, $writes, true)) {
    if ($method !== 'POST') fail('Povolen je jen POST.', 405);
    require_csrf();
}

function public_user(?array $u): ?array {
    if (!$u) return null;
    return ['id' => (int)$u['id'], 'username' => $u['username'], 'role' => $u['role'], 'level' => role_level($u),
            'mc_nick' => $u['mc_nick'], 'created_at' => $u['created_at'], 'last_login' => $u['last_login'],
            'skin_ver' => $u['skin_ver'] ? (int)$u['skin_ver'] : null, 'skin_model' => $u['skin_model'] ?? 'classic'];
}

const BAN_STATUS = "CASE WHEN b.active = 0 THEN 'removed' WHEN b.expires_at IS NOT NULL AND b.expires_at <= :now THEN 'expired' ELSE 'active' END";

switch ($r) {

    case 'me':
        out(['user' => public_user(current_user()), 'csrf' => $_SESSION['csrf']]);

    case 'register': {
        $b = body();
        $name = str($b, 'username', 16); $pass = (string)($b['password'] ?? ''); $nick = str($b, 'mc_nick', 16);
        if (!valid_nick($name)) fail('Jméno musí mít 3–16 znaků: písmena, čísla a podtržítko.');
        if ($nick !== '' && !valid_nick($nick)) fail('Minecraft nick má špatný formát.');
        if (strlen($pass) < 8 || strlen($pass) > 72) fail('Heslo musí mít 8–72 znaků.');
        $st = $pdo->prepare('SELECT 1 FROM users WHERE username = ?'); $st->execute([$name]);
        if ($st->fetch()) fail('Tohle jméno už někdo používá.', 409);
        $st = $pdo->prepare('INSERT INTO users(username, pass_hash, role, mc_nick, created_at, last_login) VALUES(?,?,?,?,?,?)');
        $st->execute([$name, password_hash($pass, PASSWORD_DEFAULT), 'player', $nick ?: null, now(), now()]);
        session_regenerate_id(true);
        $_SESSION['uid'] = (int)$pdo->lastInsertId();
        audit($name, 'register');
        out(['user' => public_user(current_user())], 201);
    }

    case 'login': {
        $b = body();
        $name = str($b, 'username', 16); $pass = (string)($b['password'] ?? '');
        $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
        $pdo->prepare('DELETE FROM attempts WHERE ts < ?')->execute([time() - 600]);
        $st = $pdo->prepare('SELECT COUNT(*) c FROM attempts WHERE ip = ? AND ts > ?'); $st->execute([$ip, time() - 600]);
        if ((int)$st->fetch()['c'] >= 8) fail('Příliš mnoho pokusů. Zkus to za chvíli.', 429);
        $st = $pdo->prepare('SELECT * FROM users WHERE username = ?'); $st->execute([$name]);
        $u = $st->fetch();
        $hash = $u['pass_hash'] ?? '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG';
        if (!password_verify($pass, $hash) || !$u) {
            $pdo->prepare('INSERT INTO attempts(ip, ts) VALUES(?,?)')->execute([$ip, time()]);
            fail('Špatné jméno nebo heslo.', 401);
        }
        if (password_needs_rehash($u['pass_hash'], PASSWORD_DEFAULT)) {
            $pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $u['id']]);
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = (int)$u['id'];
        $pdo->prepare('UPDATE users SET last_login = ? WHERE id = ?')->execute([now(), $u['id']]);
        audit($u['username'], 'login');
        out(['user' => public_user(current_user())]);
    }

    case 'logout':
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

    case 'change_password': {
        $u = require_login(); $b = body();
        $old = (string)($b['old'] ?? ''); $new = (string)($b['new'] ?? '');
        $st = $pdo->prepare('SELECT pass_hash FROM users WHERE id = ?'); $st->execute([$u['id']]);
        if (!password_verify($old, (string)$st->fetch()['pass_hash'])) fail('Staré heslo nesedí.', 403);
        if (strlen($new) < 8 || strlen($new) > 72) fail('Nové heslo musí mít 8–72 znaků.');
        if ($new === $old) fail('Nové heslo musí být jiné než staré.');
        $pdo->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        session_regenerate_id(true);
        audit($u['username'], 'change_password');
        out(['ok' => true]);
    }

    case 'admin_stats': {
        require_role('helper');
        $now = now();
        $one = fn(string $sql, array $p = []) => (function () use ($pdo, $sql, $p) { $s = $pdo->prepare($sql); $s->execute($p); return (int)$s->fetchColumn(); })();
        $active = "active = 1 AND (expires_at IS NULL OR expires_at > ?)";
        $data = [
            'players' => $one('SELECT COUNT(*) FROM players'),
            'active_bans' => $one("SELECT COUNT(*) FROM bans WHERE $active", [$now]),
            'bans_total' => $one('SELECT COUNT(*) FROM bans'),
            'bans_7d' => $one('SELECT COUNT(*) FROM bans WHERE created_at > ?', [gmdate('Y-m-d H:i:s', time() - 7 * 86400)]),
            'new_players_7d' => $one('SELECT COUNT(*) FROM players WHERE first_seen > ?', [gmdate('Y-m-d H:i:s', time() - 7 * 86400)]),
            'users' => $one('SELECT COUNT(*) FROM users'),
            'demo' => $one('SELECT COUNT(*) FROM players WHERE demo = 1'),
        ];
        $data['recent'] = $pdo->query('SELECT user, action, detail, ts FROM audit ORDER BY id DESC LIMIT 8')->fetchAll();
        out($data);
    }

    case 'players': {
        require_role('helper');
        $q = trim((string)($_GET['q'] ?? '')); $f = (string)($_GET['filter'] ?? 'all'); $sort = (string)($_GET['sort'] ?? 'last_seen');
        $page = max(1, (int)($_GET['page'] ?? 1)); $per = 12;
        $where = []; $p = [':now' => now()];
        if ($q !== '') { $where[] = "p.nick LIKE :q ESCAPE '!'"; $p[':q'] = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $q) . '%'; }
        $banExpr = "(SELECT COUNT(*) FROM bans b WHERE b.player_id = p.id AND b.active = 1 AND (b.expires_at IS NULL OR b.expires_at > :now))";
        if ($f === 'banned') $where[] = "$banExpr > 0";
        if ($f === 'clean') $where[] = "$banExpr = 0";
        $w = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $order = ['last_seen' => 'p.last_seen DESC', 'nick' => 'p.nick COLLATE NOCASE ASC', 'playtime' => 'p.playtime_min DESC', 'first_seen' => 'p.first_seen DESC'][$sort] ?? 'p.last_seen DESC';
        $total = (int)qexec($pdo, "SELECT COUNT(*) FROM players p $w", $p)->fetchColumn();
        $st = qexec($pdo, "SELECT p.*, $banExpr AS banned, (SELECT COUNT(*) FROM bans b WHERE b.player_id = p.id) AS bans_count
                             FROM players p $w ORDER BY $order LIMIT $per OFFSET " . (($page - 1) * $per), $p);
        out(['items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'per' => $per]);
    }

    case 'player': {
        require_role('helper');
        $id = (int)($_GET['id'] ?? 0);
        $st = $pdo->prepare('SELECT * FROM players WHERE id = ?'); $st->execute([$id]);
        $pl = $st->fetch();
        if (!$pl) fail('Hráč nenalezen.', 404);
        $st = $pdo->prepare('SELECT b.*, ' . BAN_STATUS . ' AS status FROM bans b WHERE b.player_id = :id ORDER BY b.id DESC');
        $st->execute([':id' => $id, ':now' => now()]);
        out(['player' => $pl, 'bans' => $st->fetchAll()]);
    }

    case 'player_add': {
        $u = require_role('moderator'); $b = body();
        $nick = str($b, 'nick', 16);
        if (!valid_nick($nick)) fail('Nick musí mít 3–16 znaků: písmena, čísla a podtržítko.');
        $st = $pdo->prepare('SELECT 1 FROM players WHERE nick = ?'); $st->execute([$nick]);
        if ($st->fetch()) fail('Hráč s tímhle nickem už existuje.', 409);
        $pdo->prepare('INSERT INTO players(nick, first_seen, last_seen, playtime_min, last_game) VALUES(?,?,?,?,?)')
            ->execute([$nick, now(), now(), 0, null]);
        audit($u['username'], 'player_add', $nick);
        out(['id' => (int)$pdo->lastInsertId()], 201);
    }

    case 'bans': {
        require_role('helper');
        $status = (string)($_GET['status'] ?? 'active'); $q = trim((string)($_GET['q'] ?? ''));
        $page = max(1, (int)($_GET['page'] ?? 1)); $per = 12;
        $p = [':now' => now()]; $where = [];
        if (in_array($status, ['active', 'expired', 'removed'], true)) $where[] = '(' . BAN_STATUS . ') = :st';
        if (in_array($status, ['active', 'expired', 'removed'], true)) $p[':st'] = $status;
        if ($q !== '') { $where[] = "(p.nick LIKE :q ESCAPE '!' OR b.reason LIKE :q ESCAPE '!' OR b.by_name LIKE :q ESCAPE '!')"; $p[':q'] = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $q) . '%'; }
        $w = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $total = (int)qexec($pdo, "SELECT COUNT(*) FROM bans b JOIN players p ON p.id = b.player_id $w", $p)->fetchColumn();
        $st = qexec($pdo, "SELECT b.*, p.nick, " . BAN_STATUS . " AS status FROM bans b JOIN players p ON p.id = b.player_id $w
                             ORDER BY b.id DESC LIMIT $per OFFSET " . (($page - 1) * $per), $p);
        out(['items' => $st->fetchAll(), 'total' => $total, 'page' => $page, 'per' => $per]);
    }

    case 'ban_create': {
        $u = require_role('moderator'); $b = body();
        $nick = str($b, 'nick', 16); $reason = str($b, 'reason', 255);
        $minutes = isset($b['minutes']) && $b['minutes'] !== null && $b['minutes'] !== '' ? (int)$b['minutes'] : 0;
        if (!valid_nick($nick)) fail('Nick musí mít 3–16 znaků: písmena, čísla a podtržítko.');
        if (mb_strlen($reason) < 3) fail('Napiš důvod (aspoň 3 znaky).');
        if ($minutes < 0 || $minutes > 60 * 24 * 365 * 5) fail('Neplatná délka banu.');
        $pdo->beginTransaction();
        $st = $pdo->prepare('SELECT id FROM players WHERE nick = ?'); $st->execute([$nick]);
        $pid = $st->fetchColumn();
        if (!$pid) {
            $pdo->prepare('INSERT INTO players(nick, first_seen, last_seen) VALUES(?,?,?)')->execute([$nick, now(), now()]);
            $pid = (int)$pdo->lastInsertId();
        }
        $st = $pdo->prepare('SELECT 1 FROM bans WHERE player_id = ? AND active = 1 AND (expires_at IS NULL OR expires_at > ?)');
        $st->execute([$pid, now()]);
        if ($st->fetch()) { $pdo->rollBack(); fail('Tenhle hráč už aktivní ban má.', 409); }
        $exp = $minutes > 0 ? gmdate('Y-m-d H:i:s', time() + $minutes * 60) : null;
        $pdo->prepare('INSERT INTO bans(player_id, reason, by_name, by_user_id, created_at, expires_at) VALUES(?,?,?,?,?,?)')
            ->execute([$pid, $reason, $u['username'], $u['id'], now(), $exp]);
        $id = (int)$pdo->lastInsertId();
        $pdo->commit();
        audit($u['username'], 'ban', $nick . ' – ' . $reason . ($exp ? ' (do ' . $exp . ')' : ' (trvale)'));
        out(['id' => $id], 201);
    }

    case 'ban_remove': {
        $u = require_role('moderator'); $b = body();
        $id = (int)($b['id'] ?? 0); $why = str($b, 'reason', 255);
        $st = $pdo->prepare('SELECT b.*, p.nick FROM bans b JOIN players p ON p.id = b.player_id WHERE b.id = ?'); $st->execute([$id]);
        $ban = $st->fetch();
        if (!$ban) fail('Ban nenalezen.', 404);
        if (!(int)$ban['active']) fail('Tenhle ban už je zrušený.', 409);
        $pdo->prepare('UPDATE bans SET active = 0, removed_by = ?, removed_at = ?, remove_reason = ? WHERE id = ?')
            ->execute([$u['username'], now(), $why ?: null, $id]);
        audit($u['username'], 'unban', $ban['nick'] . ($why ? ' – ' . $why : ''));
        out(['ok' => true]);
    }

    case 'users': {
        require_role('admin');
        out(['items' => $pdo->query('SELECT id, username, role, mc_nick, created_at, last_login FROM users ORDER BY id')->fetchAll()]);
    }

    case 'set_role': {
        $u = require_role('admin'); $b = body();
        $id = (int)($b['id'] ?? 0); $role = (string)($b['role'] ?? '');
        if (!isset(ROLES[$role])) fail('Neznámá role.');
        if ($id === (int)$u['id']) fail('Vlastní roli měnit nemůžeš.', 403);
        $st = $pdo->prepare('SELECT * FROM users WHERE id = ?'); $st->execute([$id]);
        $t = $st->fetch();
        if (!$t) fail('Uživatel nenalezen.', 404);
        $mine = role_level($u);
        if ($mine < ROLES['owner'] && (ROLES[$t['role']] >= $mine || ROLES[$role] >= $mine)) fail('Nemůžeš měnit role na tvé úrovni nebo vyšší.', 403);
        $pdo->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $id]);
        audit($u['username'], 'set_role', $t['username'] . ' → ' . $role);
        out(['ok' => true]);
    }

    case 'purge_demo': {
        $u = require_role('admin');
        $n = $pdo->exec('DELETE FROM players WHERE demo = 1');
        audit($u['username'], 'purge_demo', (string)$n);
        out(['removed' => $n]);
    }

    case 'skin': {
        $id = (int)($_GET['id'] ?? 0);
        $f = $id > 0 ? skin_path($id) : '';
        if ($f === '' || !is_file($f)) { http_response_code(404); header('Content-Type: text/plain'); exit('žádný skin'); }
        header('Content-Type: image/png');
        header('Cache-Control: public, max-age=86400');
        if (!empty($_GET['download'])) header('Content-Disposition: attachment; filename="skin.png"');
        readfile($f);
        exit;
    }

    case 'skin_upload': {
        $u = require_login(); $b = body();
        $data = (string)($b['data'] ?? '');
        $model = ($b['model'] ?? 'classic') === 'slim' ? 'slim' : 'classic';
        if (!preg_match('#^data:image/png;base64,([A-Za-z0-9+/=]+)$#', $data, $m) || strlen($m[1]) > 280000) fail('Nahraj PNG soubor do 200 kB.');
        $raw = base64_decode($m[1], true);
        if ($raw === false) fail('Soubor se nepodařilo přečíst.');
        try { $png = sanitize_skin_png($raw); } catch (RuntimeException $e) { fail($e->getMessage(), 422); }
        if (file_put_contents(skin_path((int)$u['id']), $png, LOCK_EX) === false) fail('Skin se nepodařilo uložit.', 500);
        $pdo->prepare('UPDATE users SET skin_ver = ?, skin_model = ? WHERE id = ?')->execute([time(), $model, $u['id']]);
        audit($u['username'], 'skin_upload');
        out(['user' => public_user(current_user())]);
    }

    case 'skin_reset': {
        $u = require_login();
        $f = skin_path((int)$u['id']);
        if (is_file($f)) @unlink($f);
        $pdo->prepare("UPDATE users SET skin_ver = NULL, skin_model = 'classic' WHERE id = ?")->execute([$u['id']]);
        out(['user' => public_user(current_user())]);
    }

    case 'profile_update': {
        $u = require_login(); $b = body();
        $nick = str($b, 'mc_nick', 16);
        if ($nick !== '' && !valid_nick($nick)) fail('Minecraft nick má špatný formát (3–16 znaků, písmena, čísla, _).');
        $pdo->prepare('UPDATE users SET mc_nick = ? WHERE id = ?')->execute([$nick ?: null, $u['id']]);
        if (in_array($b['skin_model'] ?? '', ['classic', 'slim'], true)) {
            $pdo->prepare('UPDATE users SET skin_model = ? WHERE id = ?')->execute([$b['skin_model'], $u['id']]);
        }
        out(['user' => public_user(current_user())]);
    }

    default:
        fail('Neznámý požadavek.', 404);
}
