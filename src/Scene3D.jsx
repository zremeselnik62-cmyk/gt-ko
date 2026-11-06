import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/* ============ textúry (pixel-art, nearest filter) ============ */
const hash = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n) }
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

function tex(w, h, base, seed, draw, amt = 14) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  const [r, g, b] = hex2rgb(base)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = Math.round((hash(x, y, seed) - 0.5) * amt * 2)
    ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r + v))},${Math.max(0, Math.min(255, g + v))},${Math.max(0, Math.min(255, b + v))})`
    ctx.fillRect(x, y, 1, 1)
  }
  if (draw) draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
const px = (ctx, x, y, col, w = 1, h = 1) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h) }
const mat = (map) => new THREE.MeshLambertMaterial({ map })

// poradie plôch BoxGeometry: +x, -x, +y, -y, +z (predok), -z (zadok)
function boxMats(w, h, d, base, seed, faces = {}) {
  const dim = { px: [d, h], nx: [d, h], py: [w, d], ny: [w, d], pz: [w, h], nz: [w, h] }
  return ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map((k, i) => {
    const f = faces[k] || {}
    return mat(tex(dim[k][0], dim[k][1], f.base || base, seed + i, f.draw))
  })
}
function box(w, h, d, mats, S, y) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * S, h * S, d * S), mats)
  m.position.y = y * S
  return m
}

/* ============ postavy 1:1 ako v Minecrafte ============ */
/* Presný model hráča (hlava 8x8x8, telo 8x12x4, ruky 4x12x4, nohy 4x12x4)
   a skin v 64x64 rozložení ako v hre. Skin je namaľovaný kódom. */

const R = (u, v, w, h, d) => ({
  top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
  right: [u, v + d, d, h], front: [u + d, v + d, w, h],
  left: [u + d + w, v + d, d, h], back: [u + 2 * d + w, v + d, w, h],
})

function paintSkin(o) {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 64
  const ctx = c.getContext('2d')
  const aw = o.slim ? 3 : 4
  const parts = {
    head: R(0, 0, 8, 8, 8), body: R(16, 16, 8, 12, 4),
    rarm: R(40, 16, aw, 12, 4), larm: R(32, 48, aw, 12, 4),
    rleg: R(0, 16, 4, 12, 4), lleg: R(16, 48, 4, 12, 4),
  }
  let seed = 1
  const fill = (r, col, amt = 9) => {
    const [x, y, w, h] = r; seed++
    const [cr, cg, cb] = hex2rgb(col)
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = Math.round((hash(x + i, y + j, seed) - 0.5) * amt * 2)
      ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, cr + v))},${Math.max(0, Math.min(255, cg + v))},${Math.max(0, Math.min(255, cb + v))})`
      ctx.fillRect(x + i, y + j, 1, 1)
    }
  }
  const P = (r, dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(r[0] + dx, r[1] + dy, w, h) }
  const all = (p, col, amt) => Object.values(p).forEach((r) => fill(r, col, amt))

  /* hlava */
  const H = parts.head
  all(H, o.skin, 7)
  if (o.helmet) {
    all(H, o.helmet, 8)
    P(H.front, 0, 3, 8, 1, '#3b4147'); P(H.front, 1, 4, 6, 1, '#14171a'); P(H.front, 3, 3, 2, 5, '#9aa3ab')
    P(H.front, 0, 0, 8, 1, '#d4dadf'); P(H.top, 0, 0, 8, 8, '#c4ccd2')
    fill(H.top, o.helmet, 5)
  } else {
    fill(H.top, o.hair, 8)
    fill(H.back, o.hair, 8); P(H.back, 0, 5, 8, 3, o.skin)
    ;[H.right, H.left].forEach((s, k) => {
      P(s, 0, 0, 8, 2, o.hair)
      const x0 = k === 0 ? 0 : 4
      P(s, x0, 2, 4, 3, o.hair)
    })
    if (o.longHair) { P(H.back, 0, 5, 8, 3, o.hair); P(H.right, 0, 5, 3, 3, o.hair); P(H.left, 5, 5, 3, 3, o.hair) }
    P(H.front, 0, 0, 8, 2, o.hair)
    P(H.front, 0, 2, 1, 1, o.hair); P(H.front, 7, 2, 1, 1, o.hair)
    if (o.fringe) { P(H.front, 1, 2, 2, 1, o.hair); P(H.front, 5, 2, 2, 1, o.hair) }
    P(H.front, 1, 4, 1, 1, '#ffffff'); P(H.front, 2, 4, 1, 1, o.eye)
    P(H.front, 5, 4, 1, 1, o.eye); P(H.front, 6, 4, 1, 1, '#ffffff')
    P(H.front, 3, 5, 2, 1, o.nose || '#a56b4a')
    P(H.front, 2, 6, 4, 1, o.mouth || '#7a4a33')
    if (o.beard) { P(H.front, 1, 6, 6, 2, o.beard); P(H.front, 3, 6, 2, 1, '#6a3e2a') }
  }

  /* telo */
  const B = parts.body
  all(B, o.shirt, 7)
  if (o.armor) { P(B.front, 3, 0, 2, 12, o.armorDark); P(B.front, 0, 0, 8, 1, '#d4dadf') }
  if (o.belt) { P(B.front, 0, 10, 8, 2, o.belt); P(B.back, 0, 10, 8, 2, o.belt); P(B.right, 0, 10, 4, 2, o.belt); P(B.left, 0, 10, 4, 2, o.belt); P(B.front, 3, 10, 2, 2, '#e8b02e') }
  if (o.strap) for (let i = 0; i < 9; i++) P(B.front, Math.floor(i * 0.85), i, 1, 1, o.strap)

  /* ruky */
  ;[parts.rarm, parts.larm].forEach((A) => {
    all(A, o.skin, 7)
    const sl = o.armor ? o.shirt : (o.sleeve || o.shirt)
    const rows = o.armor ? 12 : 4
    ;['right', 'front', 'left', 'back'].forEach((f) => { fill([A[f][0], A[f][1], A[f][2], rows], sl, 7) })
    fill(A.top, sl, 7)
    if (o.armor) { ;['right', 'front', 'left', 'back'].forEach((f) => P(A[f], 0, 9, A[f][2], 3, o.armorDark)); fill(A.bottom, o.armorDark, 5) }
  })

  /* nohy */
  ;[parts.rleg, parts.lleg].forEach((L) => {
    all(L, o.pants, 7)
    ;['right', 'front', 'left', 'back'].forEach((f) => P(L[f], 0, 9, L[f][2], 3, o.shoes))
    fill(L.bottom, o.shoes, 6)
    if (o.armor) { ;['right', 'front', 'left', 'back'].forEach((f) => P(L[f], 0, 0, L[f][2], 1, '#c4ccd2')) }
  })

  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  return { tex: t, parts }
}

/* kocka s UV mapovaním ako v Minecrafte */
function mcBox(w, h, d, rects, S, material, tw = 64, th = 64) {
  const g = new THREE.BoxGeometry(w * S, h * S, d * S)
  const uv = g.attributes.uv
  const map = [rects.left, rects.right, rects.top, rects.bottom, rects.front, rects.back] // px nx py ny pz nz
  map.forEach((r, f) => {
    const [x, y, rw, rh] = r
    const u0 = x / tw, u1 = (x + rw) / tw, v0 = 1 - y / th, v1 = 1 - (y + rh) / th
    uv.setXY(f * 4 + 0, u0, v0); uv.setXY(f * 4 + 1, u1, v0)
    uv.setXY(f * 4 + 2, u0, v1); uv.setXY(f * 4 + 3, u1, v1)
  })
  return new THREE.Mesh(g, material)
}

function buildHuman(o, S) {
  const { tex: skin, parts } = paintSkin(o)
  const m = new THREE.MeshLambertMaterial({ map: skin })
  const aw = o.slim ? 3 : 4
  const root = new THREE.Group()
  const grp = (x, y) => { const g = new THREE.Group(); g.position.set(x * S, y * S, 0); return g }

  const legR = grp(-2, 12), legL = grp(2, 12)
  const lr = mcBox(4, 12, 4, parts.rleg, S, m); lr.position.y = -6 * S; legR.add(lr)
  const ll = mcBox(4, 12, 4, parts.lleg, S, m); ll.position.y = -6 * S; legL.add(ll)
  root.add(legR, legL)

  const body = mcBox(8, 12, 4, parts.body, S, m); body.position.y = 18 * S
  root.add(body)

  const armR = grp(-(4 + aw / 2), 22), armL = grp(4 + aw / 2, 22)
  const ar = mcBox(aw, 12, 4, parts.rarm, S, m); ar.position.y = -4 * S; armR.add(ar)
  const al = mcBox(aw, 12, 4, parts.larm, S, m); al.position.y = -4 * S; armL.add(al)
  root.add(armR, armL)

  const head = grp(0, 24)
  const hd = mcBox(8, 8, 8, parts.head, S, m); hd.position.y = 4 * S; head.add(hd)
  root.add(head)

  root.userData = { armL, armR, legL, legR, head, body, hand: -10 * S }
  return root
}

/* ---------- predmety ako v hre: 16x16 sprite vytlačený do 3D ---------- */
function makeSprite(ops, S, thick = 1) {
  const grid = {}
  const set = (x, y, col) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[x + ',' + y] = col }
  const line = (x0, y0, x1, y1, col, w = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n)
      set(x, y, col); if (w > 1) { set(x + 1, y, col); set(x, y + 1, col) }
    }
  }
  ops.forEach((op) => (op[0] === 'p' ? set(op[1], op[2], op[3]) : line(...op)))
  // tmavý obrys
  const out = []
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!grid[x + ',' + y]) {
    if (grid[(x + 1) + ',' + y] || grid[(x - 1) + ',' + y] || grid[x + ',' + (y + 1)] || grid[x + ',' + (y - 1)]) out.push([x, y])
  }
  out.forEach(([x, y]) => set(x, y, '#1c140c'))
  const g = new THREE.Group()
  const geo = new THREE.BoxGeometry(S, S, S * thick)
  const mats = {}
  Object.entries(grid).forEach(([k, col]) => {
    const [x, y] = k.split(',').map(Number)
    const mm = (mats[col] ||= new THREE.MeshLambertMaterial({ color: col }))
    const b = new THREE.Mesh(geo, mm)
    b.position.set((x - 8) * S, (8 - y) * S, 0)
    g.add(b)
  })
  return g
}

function holdItem(arm, sprite, S, grip, tilt = 0) {
  // sprite leží v rovine y-z (ploška pozerá do strany), špička ide dopredu a hore
  const pivot = new THREE.Group()
  sprite.position.set(-(grip[0] - 8) * S, -(8 - grip[1]) * S, 0)
  pivot.add(sprite)
  pivot.rotation.y = -Math.PI / 2
  pivot.rotation.z = tilt
  pivot.position.set(0, -9.5 * S, 1.5 * S)
  arm.add(pivot)
}

function addPickaxe(root, S) {
  const s = makeSprite([
    [2, 14, 10, 6, '#8a5a24'], [3, 14, 11, 6, '#6b4318'],
    [3, 5, 5, 2, '#dfe5e9', 2], [5, 2, 9, 1, '#dfe5e9', 2], [9, 1, 12, 3, '#cfd6db', 2], [12, 3, 13, 7, '#b4bcc2', 2],
    ['p', 5, 2, '#f4f7f9'], ['p', 7, 1, '#f4f7f9'],
  ], S, 1.1)
  holdItem(root.userData.armR, s, S, [3, 13])
  root.userData.armR.rotation.x = -0.5
  root.userData.armRBase = -0.5
}
function addSword(root, S) {
  const s = makeSprite([
    [14, 1, 7, 8, '#dfe5e9', 2], [15, 1, 8, 8, '#aab3ba'], ['p', 15, 0, '#f4f7f9'],
    [4, 7, 9, 12, '#7a5a2a', 2], [3, 13, 1, 15, '#6b4318'], ['p', 0, 15, '#8a5a24'],
  ], S, 1.1)
  holdItem(root.userData.armR, s, S, [3, 13])
  root.userData.armR.rotation.x = -0.75
  root.userData.armRBase = -0.75
  // štít
  const shield = new THREE.Group()
  const wood = new THREE.MeshLambertMaterial({ map: tex(12, 22, '#8b5a2b', 90, (c, w, h) => {
    px(c, 0, 0, '#5a3a1a', w, 1); px(c, 0, h - 1, '#5a3a1a', w, 1); px(c, 0, 0, '#5a3a1a', 1, h); px(c, w - 1, 0, '#5a3a1a', 1, h)
    px(c, 2, 2, '#c8302a', 8, 8); px(c, 2, 10, '#e8b02e', 8, 3); px(c, 4, 13, '#e8b02e', 4, 3); px(c, 5, 5, '#f6efe3', 2, 3)
  }, 6) })
  const sb = new THREE.Mesh(new THREE.BoxGeometry(12 * S, 22 * S, 1.8 * S), [wood, wood, wood, wood, wood, wood])
  shield.add(sb)
  shield.position.set(1.5 * S, -4.5 * S, 3.2 * S)
  root.userData.armL.add(shield)
  root.userData.armL.rotation.x = -0.35
  root.userData.armLBase = -0.35
}
function addBow(root, S) {
  const s = makeSprite([
    [2, 1, 5, 1, '#6b4318'], [5, 1, 9, 3, '#8a5a24'], [9, 3, 12, 6, '#8a5a24'], [12, 6, 14, 10, '#8a5a24'], [14, 10, 14, 14, '#6b4318'],
    [2, 1, 1, 5, '#6b4318'], [1, 5, 1, 9, '#8a5a24'],
    [2, 2, 14, 14, '#e8e0d0'],
  ], S, 0.8)
  holdItem(root.userData.armR, s, S, [8, 8], 0)
  root.userData.armR.rotation.x = -1.5
  root.userData.armRBase = -1.5
  root.userData.armL.rotation.x = -1.35
  root.userData.armLBase = -1.35
}

/* ---------- creeper (UV 64x32 ako v hre) ---------- */
function buildCreeper(S) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32
  const ctx = c.getContext('2d')
  const greens = ['#4eae3a', '#3f9a2e', '#5cc047', '#2f7f23', '#6bd052']
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) {
    const h = hash(x, y, 77)
    ctx.fillStyle = greens[Math.floor(h * greens.length)]
    ctx.fillRect(x, y, 1, 1)
  }
  const head = R(0, 0, 8, 8, 8), body = R(16, 16, 8, 12, 4), leg = R(0, 16, 4, 6, 4)
  const dk = '#0b1a08'
  const f = head.front
  const P = (r, dx, dy, w, h) => { ctx.fillStyle = dk; ctx.fillRect(r[0] + dx, r[1] + dy, w, h) }
  P(f, 1, 2, 2, 2); P(f, 5, 2, 2, 2); P(f, 3, 4, 2, 1); P(f, 2, 5, 4, 2); P(f, 2, 7, 1, 1); P(f, 5, 7, 1, 1); ctx.fillStyle = greens[1]; ctx.fillRect(f[0] + 3, f[1] + 5, 2, 1)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  const m = new THREE.MeshLambertMaterial({ map: t })
  const root = new THREE.Group()
  const legs = [[-2, 4], [2, 4], [-2, -4], [2, -4]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x * S, 6 * S, z * S)
    const mesh = mcBox(4, 6, 4, leg, S, m, 64, 32); mesh.position.y = -3 * S; g.add(mesh); root.add(g); return g
  })
  const bd = mcBox(8, 12, 4, body, S, m, 64, 32); bd.position.y = 12 * S; root.add(bd)
  const hg = new THREE.Group(); hg.position.y = 18 * S
  const hm = mcBox(8, 8, 8, head, S, m, 64, 32); hm.position.y = 4 * S; hg.add(hm); root.add(hg)
  root.userData = { head: hg, legs }
  return root
}


function buildBlock(S) {
  const dirt = '#7b5232'
  const side = (c) => { px(c, 0, 0, '#4fae3c', 16, 3); for (let x = 0; x < 16; x += 2) px(c, x, 3, '#4fae3c', 1, 1 + (x % 3)) }
  const m = [0, 1, 4, 5].map((i) => mat(tex(16, 16, dirt, 50 + i, side, 18)))
  const top = mat(tex(16, 16, '#5ab845', 60, null, 18)); const bot = mat(tex(16, 16, dirt, 61, null, 18))
  const mats = [m[0], m[1], top, bot, m[2], m[3]]
  const g = new THREE.Group()
  g.add(box(14, 14, 14, mats, S, 7))
  g.userData = {}
  return g
}

const humans = {
  steve: { skin: '#b98a6a', hair: '#3b2616', eye: '#4a3a8c', shirt: '#27a1a8', pants: '#3b3a9c', shoes: '#6b6b6b', beard: '#8a5a3c', add: addPickaxe },
  archer: { skin: '#c28d68', hair: '#5a3418', longHair: true, eye: '#3a8a3a', shirt: '#3f7d3a', sleeve: '#356b30', pants: '#4a3320', shoes: '#2e2013', belt: '#5b3a1c', strap: '#7a4a1e', add: addBow },
  knight: { skin: '#d6a07a', helmet: '#b7bfc7', eye: '#3a5a7a', hair: '#333', shirt: '#a8b0b8', armor: true, armorDark: '#7d868e', pants: '#98a1a9', shoes: '#5d646b', belt: '#e8b02e', add: addSword },
  alex: { slim: true, skin: '#d6a07e', hair: '#d9741a', fringe: true, eye: '#2f7d32', shirt: '#7aa83a', pants: '#6a4a2a', shoes: '#4a4a4a', add: addPickaxe },
}


/* ============ Minecraft bloky do pozadia ============ */
const oreSpots = (seed, n = 7) => Array.from({ length: n }, (_, i) => [Math.floor(hash(i, seed, 3) * 13) + 1, Math.floor(hash(seed, i, 9) * 13) + 1])
const stoneT = (seed) => tex(16, 16, '#808080', seed, (c) => {
  for (let i = 0; i < 18; i++) px(c, Math.floor(hash(i, seed, 1) * 16), Math.floor(hash(seed, i, 2) * 16), '#6a6a6a')
}, 12)
const oreT = (seed, col) => tex(16, 16, '#808080', seed, (c) => {
  oreSpots(seed).forEach(([x, y]) => { px(c, x, y, col, 2, 2); px(c, x, y, '#ffffff66'.slice(0, 7), 1, 1) })
}, 12)
const blockDefs = {
  grass: () => { const side = tex(16, 16, '#7b5232', 1, (c) => { px(c, 0, 0, '#5fb347', 16, 3); for (let x = 0; x < 16; x++) px(c, x, 3, '#5fb347', 1, hash(x, 4, 4) > 0.5 ? 1 : 0) }, 14)
    return [side, side, tex(16, 16, '#5fb347', 2, null, 16), tex(16, 16, '#7b5232', 3, null, 14), side, side] },
  dirt: () => { const t = tex(16, 16, '#7b5232', 4, (c) => { for (let i = 0; i < 14; i++) px(c, Math.floor(hash(i, 5, 1) * 16), Math.floor(hash(5, i, 2) * 16), '#5e3d22') }, 14); return Array(6).fill(t) },
  stone: () => { const t = stoneT(6); return Array(6).fill(t) },
  diamond: () => { const t = oreT(7, '#4eecd8'); return Array(6).fill(t) },
  gold: () => { const t = oreT(8, '#f5c542'); return Array(6).fill(t) },
  iron: () => { const t = oreT(9, '#d8a47f'); return Array(6).fill(t) },
  planks: () => { const t = tex(16, 16, '#a67c45', 10, (c) => { for (const y of [3, 7, 11, 15]) px(c, 0, y, '#7a5a2e', 16, 1); px(c, 5, 0, '#7a5a2e', 1, 4); px(c, 11, 4, '#7a5a2e', 1, 4); px(c, 4, 8, '#7a5a2e', 1, 4); px(c, 12, 12, '#7a5a2e', 1, 4) }, 8); return Array(6).fill(t) },
  tnt: () => { const side = tex(16, 16, '#c8302a', 11, (c) => { px(c, 0, 5, '#e8e2d0', 16, 6); px(c, 3, 7, '#222', 2, 2); px(c, 7, 7, '#222', 2, 2); px(c, 11, 7, '#222', 2, 2) }, 8)
    const top = tex(16, 16, '#b8a98e', 12, (c) => { px(c, 7, 7, '#444', 2, 2) }, 8)
    return [side, side, top, top, side, side] },
  lava: () => { const t = tex(16, 16, '#e8641a', 13, (c) => { for (let i = 0; i < 20; i++) px(c, Math.floor(hash(i, 8, 1) * 16), Math.floor(hash(8, i, 2) * 16), '#ffc440', 2, 1) }, 22); return Array(6).fill(t) },
}
const blockNames = Object.keys(blockDefs)
const blockTexCache = {}
const blockMatCache = {}
function blockMats(name, tier) {
  const key = name + tier
  if (blockMatCache[key]) return blockMatCache[key]
  blockTexCache[name] ||= blockDefs[name]()
  const op = [0.38, 0.6, 0.85][tier]
  const mats = blockTexCache[name].map((t) => new THREE.MeshLambertMaterial({ map: t, transparent: true, opacity: op, emissive: name === 'lava' ? 0x662200 : 0x000000 }))
  return (blockMatCache[key] = mats)
}

/* ============ rozmiestnenie (nezarovnané, plávajúce) ============ */
const placements = [
  { type: 'steve', anchor: '.hero', x: 0.05, y: 470, size: 1.05, rot: 0.5, tilt: 0.06, para: 0.12 },
  { type: 'block', anchor: '.hero', x: 0.93, y: 120, size: 0.9, rot: 0.6, tilt: 0.4, para: 0.25, spin: 0.6, minW: 1100 },
  { type: 'archer', anchor: '#minihry', x: 0.955, y: 90, size: 1.1, rot: -0.55, tilt: -0.08, para: 0.1, minW: 1250 },
  { type: 'creeper', anchor: '#start', x: 0.03, y: 380, size: 0.9, rot: 0.6, tilt: 0.1, para: 0.18, minW: 1250 },
  { type: 'alex', anchor: '#novinky', x: 0.965, y: 420, size: 1.0, rot: -0.5, tilt: 0.08, para: 0.15, minW: 1250 },
  { type: 'knight', anchor: '.big-cta', x: 0.1, y: 320, size: 1.1, rot: 0.55, tilt: -0.05, para: 0.08, minW: 900 },
  { type: 'creeper', anchor: '.big-cta', x: 0.89, y: 330, size: 0.95, rot: -0.6, tilt: -0.1, para: 0.1, minW: 900 },
]

export default function Scene3D() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000)
    scene.add(new THREE.AmbientLight(0xfff1d6, 1.15))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-120, 260, 300); scene.add(sun)
    const rim = new THREE.DirectionalLight(0xe8b02e, 0.8); rim.position.set(200, 80, -200); scene.add(rim)

    const S = 6.2
    const items = placements.map((p, i) => {
      let obj
      if (p.type === 'creeper') obj = buildCreeper(S)
      else if (p.type === 'block') obj = buildBlock(S)
      else { obj = buildHuman(humans[p.type], S); humans[p.type].add(obj, S) }
      const pivot = new THREE.Group()
      pivot.add(obj)
      scene.add(pivot)
      return { p, obj, pivot, el: null, phase: i * 1.7 }
    })


    // --- bloky v pozadí ---
    const unit = new THREE.BoxGeometry(1, 1, 1)
    const bgBlocks = Array.from({ length: 46 }, (_, i) => {
      const tier = i % 3
      const name = blockNames[Math.floor(hash(i, 2, 5) * blockNames.length)]
      const m = new THREE.Mesh(unit, blockMats(name, tier))
      scene.add(m)
      return {
        m, tier,
        x: hash(i, 1, 7), y: hash(i, 3, 8),
        size: [22, 34, 54][tier] * (0.7 + hash(i, 4, 9) * 0.8),
        par: [0.12, 0.3, 0.55][tier],
        rx: hash(i, 5, 1) * 6, ry: hash(i, 6, 2) * 6,
        vx: (hash(i, 7, 3) - 0.5) * 0.5, vy: (hash(i, 8, 4) - 0.5) * 0.7,
        drift: 6 + hash(i, 9, 5) * 14, ph: hash(i, 10, 6) * 6,
      }
    })

    let W = 0, H = 0
    const resize = () => {
      W = innerWidth; H = innerHeight
      renderer.setSize(W, H, false)
      camera.left = 0; camera.right = W; camera.top = H; camera.bottom = 0
      camera.updateProjectionMatrix()
    }
    resize()
    addEventListener('resize', resize)

    let mx = 0.5, my = 0.5
    const move = (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight }
    addEventListener('mousemove', move)

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const clock = new THREE.Clock()
    let raf
    const loop = () => {
      const t = clock.getElapsedTime()

      const wrapH = H + 240
      for (const b of bgBlocks) {
        const yy = (((b.y * wrapH * 3 - scrollY * b.par) % wrapH) + wrapH) % wrapH - 120
        const xx = b.x * W + (mx - 0.5) * (b.tier + 1) * 18 + Math.sin(t * 0.5 + b.ph) * b.drift
        b.m.visible = W > 500 || b.tier > 0
        b.m.scale.setScalar(b.size)
        b.m.position.set(xx, H - yy + Math.cos(t * 0.6 + b.ph) * b.drift, -400 + b.tier * 50)
        b.m.rotation.set(0.55 + b.rx + t * b.vx, 0.7 + b.ry + t * b.vy, 0.1)
      }
      for (const it of items) {
        const { p, obj, pivot } = it
        if (!it.el || !it.el.isConnected) it.el = document.querySelector(p.anchor)
        const show = it.el && W >= (p.minW || 0)
        pivot.visible = !!show
        if (!show) continue
        const r = it.el.getBoundingClientRect()
        const sy = r.top + p.y + (r.top + p.y - H / 2) * p.para
        if (sy < -350 || sy > H + 350) { pivot.visible = false; continue }
        const sx = p.x * W
        const k = (W < 700 ? 0.6 : 1) * p.size
        pivot.scale.setScalar(k)
        const float = reduce ? 0 : Math.sin(t * 1.6 + it.phase) * 9
        pivot.position.set(sx, H - sy + float, 0)
        // natočenie za myšou + stály 3D uhol
        const lookX = (mx - sx / W) * 1.1, lookY = (my - sy / H) * 0.9
        if (p.type === 'block') {
          pivot.rotation.set(p.tilt + Math.sin(t + it.phase) * 0.15, t * (p.spin || 0.6) + it.phase, 0.1)
          continue
        }
        pivot.rotation.set(0.08 + p.tilt * 0.5, p.rot + Math.max(-1, Math.min(1, lookX)) * 0.55 + Math.sin(t * 0.7 + it.phase) * 0.12, p.tilt)
        const u = obj.userData
        if (u.head) {
          u.head.rotation.y = Math.max(-0.6, Math.min(0.6, lookX * 0.8 - (p.rot * 0.5)))
          u.head.rotation.x = Math.max(-0.35, Math.min(0.35, lookY * 0.5))
        }
        const sw = reduce ? 0 : Math.sin(t * 2.2 + it.phase)
        if (u.armL) {
          u.armL.rotation.x = (u.armLBase ?? 0) + sw * 0.12
          u.armR.rotation.x = (u.armRBase ?? 0) - sw * 0.12 + (u.armRBase ? 0 : 0)
          u.legL.rotation.x = -sw * 0.2; u.legR.rotation.x = sw * 0.2
        }
        if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = (i % 2 ? -1 : 1) * sw * 0.18 })
      }
      renderer.render(scene, camera)
      if (!reduce || true) raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize); removeEventListener('mousemove', move)
      renderer.dispose()
    }
  }, [])
  return <canvas ref={ref} className="scene3d" aria-hidden="true" />
}

export { paintSkin, humans }
