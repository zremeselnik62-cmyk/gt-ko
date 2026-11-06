<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
header('Content-Type: text/html; charset=utf-8');
start_session();

/* První spuštění: vytvoří prvního majitele. Jen z localhostu a jen dokud neexistuje žádný uživatel. */
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
$local = in_array($ip, ['127.0.0.1', '::1'], true);
$pdo = db();
$has = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() > 0;
$msg = ''; $done = false;

if (!$local) { http_response_code(403); $msg = 'Instalace je povolena jen z localhostu.'; }
elseif ($has) { $msg = 'Už je nainstalováno. Majitel existuje.'; }
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tok = (string)($_POST['csrf'] ?? '');
    $name = trim((string)($_POST['username'] ?? '')); $pass = (string)($_POST['password'] ?? ''); $demo = !empty($_POST['demo']);
    if (!hash_equals($_SESSION['csrf'], $tok)) $msg = 'Neplatný token, obnov stránku.';
    elseif (!valid_nick($name)) $msg = 'Jméno musí mít 3–16 znaků (písmena, čísla, _).';
    elseif (strlen($pass) < 8 || strlen($pass) > 72) $msg = 'Heslo musí mít 8–72 znaků.';
    else {
        $pdo->prepare('INSERT INTO users(username, pass_hash, role, created_at) VALUES(?,?,?,?)')
            ->execute([$name, password_hash($pass, PASSWORD_DEFAULT), 'owner', now()]);
        audit($name, 'install');
        if ($demo) {
            $names = ['Kopac_Pepa', 'SkyMaster99', 'CreeperSlayer', 'PixelNinja', 'DiamondDan', 'ParkourKral', 'LavaWalker', 'NetherFox', 'BuilderBob', 'RedstoneRay', 'ZombieHunter', 'Steve_CZ'];
            $games = ['SkyBlock', 'Parkour', 'Prison', 'Klasik'];
            $ins = $pdo->prepare('INSERT OR IGNORE INTO players(nick, first_seen, last_seen, playtime_min, last_game, demo) VALUES(?,?,?,?,?,1)');
            foreach ($names as $i => $n) {
                $ins->execute([$n, gmdate('Y-m-d H:i:s', time() - ($i + 3) * 86400 * 2), gmdate('Y-m-d H:i:s', time() - $i * 5400), 90 + $i * 137, $games[$i % 4]]);
            }
            $bn = $pdo->prepare('INSERT INTO bans(player_id, reason, by_name, created_at, expires_at) SELECT id, ?, ?, ?, ? FROM players WHERE nick = ?');
            $bn->execute(['Použití cheatů (fly)', $name, gmdate('Y-m-d H:i:s', time() - 86400), null, 'CreeperSlayer']);
            $bn->execute(['Spamování v chatu', $name, gmdate('Y-m-d H:i:s', time() - 3600), gmdate('Y-m-d H:i:s', time() + 86400 * 2), 'ZombieHunter']);
            $bn->execute(['Urážky hráčů', $name, gmdate('Y-m-d H:i:s', time() - 86400 * 9), gmdate('Y-m-d H:i:s', time() - 86400 * 2), 'LavaWalker']);
        }
        $done = true;
    }
}
$csrf = htmlspecialchars($_SESSION['csrf'], ENT_QUOTES);
?><!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GameTeam – instalace</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#110c07;color:#f6efe3;font:16px/1.5 'Segoe UI',system-ui,sans-serif}
.box{width:min(440px,92vw);padding:34px;border:1px solid rgba(232,176,46,.35);border-radius:22px;background:#1a120a;box-shadow:0 30px 80px -30px rgba(232,176,46,.4)}
h1{margin:0 0 6px;font-size:1.6rem}h1 b{color:#ffd54a}p{color:#a89a85;margin:0 0 18px}
label{display:block;font-weight:700;margin:14px 0 6px;font-size:.9rem}
input[type=text],input[type=password]{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:2px solid #3a2a12;background:#0b0805;color:#fff;font:inherit}
input:focus{outline:none;border-color:#e8b02e}
.chk{display:flex;gap:10px;align-items:center;margin:16px 0;color:#a89a85;font-size:.9rem}
button,.btn{display:block;width:100%;box-sizing:border-box;margin-top:18px;padding:14px;border:0;border-radius:14px;font:inherit;font-weight:800;text-align:center;text-decoration:none;cursor:pointer;color:#2a1a02;background:linear-gradient(180deg,#ffe27a,#f2b92e 55%,#c98c14)}
.err{padding:12px 14px;border-radius:12px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);color:#fca5a5;margin-bottom:14px}
.ok{padding:12px 14px;border-radius:12px;background:rgba(52,210,122,.12);border:1px solid rgba(52,210,122,.45);color:#9ef0bf;margin-bottom:14px}
</style></head><body><div class="box">
<h1>Game<b>Team</b> – instalace</h1>
<?php if ($done): ?>
  <div class="ok">Hotovo. Majitel byl vytvořen.</div>
  <p>Teď se můžeš přihlásit na webu a otevřít Admin panel.</p>
  <a class="btn" href="../#/admin">Otevřít web</a>
<?php elseif ($msg && ($has || !$local)): ?>
  <div class="err"><?= htmlspecialchars($msg) ?></div>
  <a class="btn" href="../">Zpět na web</a>
<?php else: ?>
  <p>Vytvoř prvního majitele. Heslo si vybereš sám. Nikde se neukládá v čitelné podobě.</p>
  <?php if ($msg): ?><div class="err"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
  <form method="post" autocomplete="off">
    <input type="hidden" name="csrf" value="<?= $csrf ?>">
    <label for="u">Uživatelské jméno</label><input id="u" name="username" type="text" maxlength="16" required>
    <label for="p">Heslo (aspoň 8 znaků)</label><input id="p" name="password" type="password" minlength="8" maxlength="72" required>
    <label class="chk"><input type="checkbox" name="demo" value="1" checked> Vložit ukázkové hráče a bany (půjdou smazat v Admin panelu)</label>
    <button type="submit">Vytvořit majitele</button>
  </form>
<?php endif; ?>
</div></body></html>
