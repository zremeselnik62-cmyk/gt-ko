<?php
declare(strict_types=1);

/* GameTeam API – spoločný základ (SQLite, sessions, pomocné funkcie)
   Databáza leží MIMO webroot: C:\xampp\gameteam-data\gameteam.sqlite */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const ROLES = ['player' => 0, 'helper' => 1, 'moderator' => 2, 'admin' => 3, 'owner' => 4];

function data_dir(): string {
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? __DIR__), '/\\');
    $d = dirname($root) . DIRECTORY_SEPARATOR . 'gameteam-data';
    if (!is_dir($d)) { @mkdir($d, 0775, true); }
    return $d;
}

function now(): string { return gmdate('Y-m-d H:i:s'); }

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO('sqlite:' . data_dir() . DIRECTORY_SEPARATOR . 'gameteam.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    migrate($pdo);
    return $pdo;
}

function migrate(PDO $p): void {
    $p->exec("
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      pass_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      mc_nick TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT
    );
    CREATE TABLE IF NOT EXISTS players(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nick TEXT NOT NULL UNIQUE COLLATE NOCASE,
      first_seen TEXT,
      last_seen TEXT,
      playtime_min INTEGER NOT NULL DEFAULT 0,
      last_game TEXT,
      demo INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bans(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      by_name TEXT NOT NULL,
      by_user_id INTEGER,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      removed_by TEXT,
      removed_at TEXT,
      remove_reason TEXT
    );
    CREATE TABLE IF NOT EXISTS audit(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT, action TEXT, detail TEXT, ts TEXT
    );
    CREATE TABLE IF NOT EXISTS attempts(ip TEXT, ts INTEGER);
    CREATE INDEX IF NOT EXISTS idx_bans_player ON bans(player_id);
    CREATE INDEX IF NOT EXISTS idx_bans_active ON bans(active, expires_at);
    CREATE INDEX IF NOT EXISTS idx_attempts ON attempts(ip, ts);
    ");
    $cols = array_column($p->query('PRAGMA table_info(users)')->fetchAll(), 'name');
    if (!in_array('skin_ver', $cols, true)) $p->exec('ALTER TABLE users ADD COLUMN skin_ver INTEGER');
    if (!in_array('skin_model', $cols, true)) $p->exec("ALTER TABLE users ADD COLUMN skin_model TEXT NOT NULL DEFAULT 'classic'");
}

function skin_path(int $uid): string {
    $d = data_dir() . DIRECTORY_SEPARATOR . 'skins';
    if (!is_dir($d)) { @mkdir($d, 0775, true); }
    return $d . DIRECTORY_SEPARATOR . $uid . '.png';
}

const PNG_SIG = "\x89PNG\r\n\x1a\n";

/* Overí PNG skin 64x64 a postaví ho znova len z bezpečných chunkov (bez metadát). Vráti PNG alebo vyhodí výnimku. */
function sanitize_skin_png(string $raw): string {
    if (strlen($raw) < 100 || strlen($raw) > 200000) throw new RuntimeException('Skin musí mít do 200 kB.');
    if (substr($raw, 0, 8) !== PNG_SIG) throw new RuntimeException('Soubor není PNG.');
    $pos = 8; $n = strlen($raw); $keep = []; $idat = ''; $ihdr = null; $seenEnd = false; $count = 0;
    while ($pos + 12 <= $n && $count++ < 64) {
        $len = unpack('N', substr($raw, $pos, 4))[1];
        $type = substr($raw, $pos + 4, 4);
        if ($len > $n || $pos + 12 + $len > $n) throw new RuntimeException('Poškozené PNG.');
        $data = substr($raw, $pos + 8, $len);
        $crc = unpack('N', substr($raw, $pos + 8 + $len, 4))[1];
        if ($crc !== crc32($type . $data)) throw new RuntimeException('Poškozené PNG (CRC).');
        if ($type === 'IHDR') {
            if ($len !== 13) throw new RuntimeException('Poškozené PNG.');
            $ihdr = unpack('Nw/Nh/Cdepth/Cctype/Ccomp/Cfilter/Cinterlace', $data);
            $keep[] = [$type, $data];
        } elseif (in_array($type, ['PLTE', 'tRNS'], true)) {
            $keep[] = [$type, $data];
        } elseif ($type === 'IDAT') {
            $idat .= $data;
            if (strlen($idat) > 150000) throw new RuntimeException('Skin je příliš velký.');
        } elseif ($type === 'IEND') { $seenEnd = true; break; }
        $pos += 12 + $len;
    }
    if (!$ihdr || !$seenEnd || $idat === '') throw new RuntimeException('Neúplné PNG.');
    if ($ihdr['w'] !== 64 || $ihdr['h'] !== 64) throw new RuntimeException('Skin musí mít přesně 64×64 pixelů (novější formát).');
    if ($ihdr['depth'] !== 8 || !in_array($ihdr['ctype'], [2, 3, 6], true) || $ihdr['comp'] !== 0 || $ihdr['filter'] !== 0 || $ihdr['interlace'] !== 0) {
        throw new RuntimeException('Nepodporovaný typ PNG. Ulož skin jako běžné 8bitové PNG bez prokládání.');
    }
    $bpp = [2 => 3, 3 => 1, 6 => 4][$ihdr['ctype']];
    $expect = (1 + 64 * $bpp) * 64;
    $raw2 = @gzuncompress($idat, $expect + 16);
    if ($raw2 === false || strlen($raw2) !== $expect) throw new RuntimeException('Obrazová data PNG jsou neplatná.');
    $out = PNG_SIG;
    $chunk = fn(string $t, string $d) => pack('N', strlen($d)) . $t . $d . pack('N', crc32($t . $d));
    foreach ($keep as [$t, $d]) $out .= $chunk($t, $d);
    $out .= $chunk('IDAT', $idat) . $chunk('IEND', '');
    return $out;
}

/* ---------- session ---------- */
function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $base = rtrim(dirname(dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/'))), '/\\');
    session_name('gt_sess');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $base === '' ? '/' : $base,
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
}

/* ---------- odpovede ---------- */
function out($data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $msg, int $code = 400): never { out(['error' => $msg], $code); }

function body(): array {
    static $b = null;
    if ($b !== null) return $b;
    $raw = file_get_contents('php://input') ?: '';
    $j = json_decode($raw, true);
    return $b = is_array($j) ? $j : [];
}

function str(array $a, string $k, int $max = 255): string {
    $v = $a[$k] ?? '';
    return is_string($v) ? trim(mb_substr($v, 0, $max)) : '';
}

/* ---------- používateľ / práva ---------- */
function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    $st = db()->prepare('SELECT id, username, role, mc_nick, created_at, last_login, skin_ver, skin_model FROM users WHERE id = ?');
    $st->execute([(int)$_SESSION['uid']]);
    return $st->fetch() ?: null;
}
function role_level(?array $u): int { return $u ? (ROLES[$u['role']] ?? 0) : -1; }

function require_login(): array {
    $u = current_user();
    if (!$u) fail('Musíš být přihlášený.', 401);
    return $u;
}
function require_role(string $min): array {
    $u = require_login();
    if (role_level($u) < ROLES[$min]) fail('Na tohle nemáš oprávnění.', 403);
    return $u;
}
function require_csrf(): void {
    $h = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($h) || !hash_equals($_SESSION['csrf'] ?? '', $h)) fail('Neplatný bezpečnostní token. Obnov stránku.', 403);
}

function audit(string $user, string $action, string $detail = ''): void {
    $st = db()->prepare('INSERT INTO audit(user, action, detail, ts) VALUES(?,?,?,?)');
    $st->execute([$user, $action, mb_substr($detail, 0, 300), now()]);
}

function valid_nick(string $n): bool { return (bool)preg_match('/^[A-Za-z0-9_]{3,16}$/', $n); }

/* spustí dotaz len s parametrami, ktoré sa v ňom naozaj vyskytujú */
function qexec(PDO $pdo, string $sql, array $params = []): PDOStatement {
    foreach (array_keys($params) as $k) { if (strpos($sql, (string)$k) === false) unset($params[$k]); }
    $st = $pdo->prepare($sql);
    $st->execute($params);
    return $st;
}
