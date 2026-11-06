import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Icon from './Icon.jsx'
import { SectionHead } from './components.jsx'
import { servers, DISCORD } from './data.js'

/* =====================================================================
   3D dioramy minihier (Three.js, bloky s pixelovými textúrami)
   ===================================================================== */
const hash = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n) }
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const px = (c, x, y, col, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h) }
const specks = (c, col, n, seed, s = 1) => { for (let i = 0; i < n; i++) px(c, Math.floor(hash(i, seed, 1) * 16), Math.floor(hash(seed, i, 2) * 16), col, s, s) }

function mkTex(base, seed, draw, amt = 12) {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16
  const c = cv.getContext('2d')
  const [r, g, b] = rgb(base)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = Math.round((hash(x, y, seed) - 0.5) * amt * 2)
    c.fillStyle = `rgb(${Math.max(0, Math.min(255, r + v))},${Math.max(0, Math.min(255, g + v))},${Math.max(0, Math.min(255, b + v))})`
    c.fillRect(x, y, 1, 1)
  }
  if (draw) draw(c)
  const t = new THREE.CanvasTexture(cv)
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace
  return t
}
const lam = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra })
const flat = (base, seed, draw, amt, extra) => lam(mkTex(base, seed, draw, amt), extra)

const cache = {}
function getMat(type) {
  if (cache[type]) return cache[type]
  const ore = (col, seed) => flat('#808080', seed, (c) => { for (let i = 0; i < 6; i++) { const x = 1 + Math.floor(hash(i, seed, 3) * 12), y = 1 + Math.floor(hash(seed, i, 9) * 12); px(c, x, y, col, 2, 2) } specks(c, '#6a6a6a', 14, seed) }, 10)
  const wool = (col, seed) => flat(col, seed, null, 6)
  const defs = {
    grass: () => { const side = lam(mkTex('#7b5232', 2, (c) => { px(c, 0, 0, '#5fb347', 16, 3); for (let x = 0; x < 16; x++) px(c, x, 3, '#5fb347', 1, hash(x, 4, 4) > 0.5 ? 1 : 0) }, 14)); const top = flat('#5fb347', 3, null, 16); const bot = flat('#7b5232', 4, null, 14); return [side, side, top, bot, side, side] },
    dirt: () => flat('#7b5232', 5, (c) => specks(c, '#5e3d22', 16, 5), 14),
    stone: () => flat('#808080', 6, (c) => specks(c, '#6a6a6a', 18, 6), 10),
    cobble: () => flat('#7a7a7a', 7, (c) => { for (const y of [0, 5, 10]) px(c, 0, y, '#4e4e4e', 16, 1); for (const [x, y] of [[4, 1], [10, 1], [2, 6], [8, 6], [5, 11], [12, 11]]) px(c, x, y, '#4e4e4e', 1, 4) }, 10),
    brick: () => flat('#8c8c8c', 8, (c) => { px(c, 0, 0, '#5c5c5c', 16, 1); px(c, 0, 8, '#5c5c5c', 16, 1); px(c, 0, 0, '#5c5c5c', 1, 8); px(c, 8, 8, '#5c5c5c', 1, 8) }, 6),
    log: () => { const side = lam(mkTex('#6b4a2a', 9, (c) => { for (const x of [2, 5, 9, 12]) px(c, x, 0, '#573a1e', 1, 16) }, 8)); const top = lam(mkTex('#a67c45', 10, (c) => { px(c, 2, 2, '#7a5a2e', 12, 1); px(c, 2, 13, '#7a5a2e', 12, 1); px(c, 2, 2, '#7a5a2e', 1, 12); px(c, 13, 2, '#7a5a2e', 1, 12); px(c, 5, 5, '#7a5a2e', 6, 1); px(c, 5, 10, '#7a5a2e', 6, 1) }, 6)); return [side, side, top, top, side, side] },
    planks: () => flat('#a67c45', 11, (c) => { for (const y of [3, 7, 11, 15]) px(c, 0, y, '#7a5a2e', 16, 1); px(c, 5, 0, '#7a5a2e', 1, 4); px(c, 11, 4, '#7a5a2e', 1, 4); px(c, 4, 8, '#7a5a2e', 1, 4); px(c, 12, 12, '#7a5a2e', 1, 4) }, 6),
    leaves: () => flat('#3f9a2e', 12, (c) => { specks(c, '#2d6e20', 40, 12, 2); for (let i = 0; i < 24; i++) c.clearRect(Math.floor(hash(i, 12, 5) * 16), Math.floor(hash(12, i, 6) * 16), 1, 1) }, 14, { alphaTest: 0.5, side: THREE.DoubleSide }),
    water: () => flat('#2f6fd0', 13, (c) => specks(c, '#5a96ee', 10, 13), 8, { transparent: true, opacity: 0.72 }),
    quartz: () => flat('#ece6dc', 14, (c) => { px(c, 0, 15, '#d3ccc0', 16, 1); px(c, 15, 0, '#d3ccc0', 1, 16) }, 4),
    gold: () => flat('#f6d33f', 15, (c) => { px(c, 0, 0, '#fff0a0', 16, 1); px(c, 0, 15, '#c9a21a', 16, 1); px(c, 0, 0, '#fff0a0', 1, 16); px(c, 15, 0, '#c9a21a', 1, 16) }, 8),
    coal: () => ore('#222222', 16), iron: () => ore('#d8a47f', 17), goldore: () => ore('#f5c542', 18), diamond: () => ore('#4eecd8', 19),
    lime: () => wool('#80c71f', 20), blue: () => wool('#3c44aa', 21), orange: () => wool('#f9801d', 22), red: () => wool('#b02e26', 23), white: () => wool('#e9ecec', 24), pink: () => wool('#f0a0a8', 25),
    chest: () => flat('#8a5a24', 26, (c) => { px(c, 0, 0, '#5a3a14', 16, 1); px(c, 0, 15, '#5a3a14', 16, 1); px(c, 0, 0, '#5a3a14', 1, 16); px(c, 15, 0, '#5a3a14', 1, 16); px(c, 7, 6, '#e8b02e', 2, 3) }, 6),
    metal: () => new THREE.MeshLambertMaterial({ color: 0xc9ced4 }),
    cloud: () => new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
    skin: () => new THREE.MeshLambertMaterial({ color: 0xb98a6a }),
    teal: () => new THREE.MeshLambertMaterial({ color: 0x27a1a8 }),
    pants: () => new THREE.MeshLambertMaterial({ color: 0x3b3a9c }),
    wood: () => new THREE.MeshLambertMaterial({ color: 0x7a4a1e }),
    goldm: () => new THREE.MeshLambertMaterial({ color: 0xf2b92e, emissive: 0x4a3200 }),
    flame: () => new THREE.MeshBasicMaterial({ color: 0xffb030 }),
    door: () => new THREE.MeshLambertMaterial({ color: 0x4a2f14 }),
    snout: () => new THREE.MeshLambertMaterial({ color: 0xd9808a }),
    dark: () => new THREE.MeshLambertMaterial({ color: 0x222222 }),
  }
  cache[type] = defs[type]()
  return cache[type]
}

const UNIT = new THREE.BoxGeometry(1, 1, 1)
function put(g, type, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(UNIT, getMat(type))
  m.position.set(x, y, z); m.scale.set(sx, sy, sz)
  g.add(m); return m
}

/* ---------- SkyBlock ---------- */
function buildSky() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.position.y = -0.5
  const rs = [4.4, 3.9, 3.2, 2.5, 1.7, 0.9]
  rs.forEach((r, k) => {
    for (let x = -5; x <= 5; x++) for (let z = -5; z <= 5; z++) {
      const d = Math.hypot(x, z) + (hash(x, z, k) - 0.5) * 1.0
      if (d <= r) put(inner, k === 0 ? 'grass' : k < 3 ? 'dirt' : 'stone', x, -k, z)
    }
  })
  for (let i = 1; i <= 4; i++) put(inner, 'log', -1, i, -1)
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (const dy of [4, 5]) {
    if (Math.abs(dx) + Math.abs(dz) < 4 && !(dx === 0 && dz === 0 && dy === 4)) put(inner, 'leaves', -1 + dx, dy, -1 + dz)
  }
  put(inner, 'leaves', -1, 6, -1); put(inner, 'leaves', 0, 6, -1); put(inner, 'leaves', -2, 6, -1); put(inner, 'leaves', -1, 6, 0); put(inner, 'leaves', -1, 6, -2)
  put(inner, 'chest', 2, 1, 1)
  ;[[1, 1, -2, 'red'], [3, 1, -1, 'orange'], [-3, 1, 1, 'white'], [0, 1, 3, 'red']].forEach(([x, y, z, c]) => put(inner, c, x, y - 0.35, z, 0.28, 0.3, 0.28))
  const clouds = []
  for (let i = 0; i < 4; i++) {
    const cg = new THREE.Group(); const a = i * 1.7 + 0.5
    for (let k = 0; k < 5; k++) put(cg, 'cloud', k * 0.9 - 1.8, (k % 2) * 0.3, (k % 3) * 0.5, 1.2, 0.6, 1)
    cg.position.set(Math.cos(a) * 6.5, -2 + i * 1.6, Math.sin(a) * 6.5)
    cg.userData = { a, r: 6.5, y: cg.position.y }
    inner.add(cg); clouds.push(cg)
  }
  return {
    group: g, accent: 0x4fd1a5, lightPos: [0, 7, 4],
    update: (t) => { clouds.forEach((c, i) => { const a = c.userData.a + t * 0.12; c.position.set(Math.cos(a) * c.userData.r, c.userData.y + Math.sin(t + i) * 0.2, Math.sin(a) * c.userData.r) }); inner.position.y = -0.5 + Math.sin(t * 1.2) * 0.25 },
  }
}

/* ---------- Parkour ---------- */
function buildParkour() {
  const g = new THREE.Group()
  const types = ['quartz', 'lime', 'gold', 'brick', 'blue', 'quartz', 'orange', 'brick', 'red', 'quartz', 'lime', 'gold']
  const pts = [], plats = []
  types.forEach((ty, i) => {
    const a = i * 0.62 + 0.3, r = 3.6 - i * 0.05, y = i * 0.62 - 3.4
    const p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    const m = put(g, ty, p.x, p.y, p.z, 2, 0.55, 2)
    m.userData = { y: y, ph: i * 0.8 }
    pts.push(p); plats.push(m)
  })
  const last = pts[pts.length - 1]
  put(g, 'gold', last.x, last.y + 0.55, last.z, 0.8, 0.8, 0.8)
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 11, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
  beam.position.set(last.x, last.y + 6.4, last.z); g.add(beam)
  ;[4, 8].forEach((i) => put(g, 'goldm', pts[i].x, pts[i].y + 0.33, pts[i].z, 0.7, 0.08, 0.7))
  // bežec
  const run = new THREE.Group()
  const mk = (t, w, h, d, x, y, z) => { const m = new THREE.Mesh(UNIT, getMat(t)); m.scale.set(w, h, d); m.position.set(x, y, z); run.add(m); return m }
  mk('teal', 0.5, 0.7, 0.28, 0, 0.7, 0); mk('skin', 0.42, 0.42, 0.42, 0, 1.28, 0); mk('pants', 0.22, 0.6, 0.24, -0.12, 0.3, 0); mk('pants', 0.22, 0.6, 0.24, 0.12, 0.3, 0)
  g.add(run)
  const N = pts.length
  return {
    group: g, accent: 0x38bdf8, lightPos: [0, 6, 6],
    update: (t) => {
      plats.forEach((m) => { m.position.y = m.userData.y + Math.sin(t * 1.4 + m.userData.ph) * 0.12 })
      beam.material.opacity = 0.3 + Math.sin(t * 3) * 0.08
      const s = (t * 1.1) % (N - 1), i = Math.floor(s), f = s - i
      const a = pts[i], b = pts[i + 1]
      run.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f + 0.28 + Math.sin(f * Math.PI) * 1.1, a.z + (b.z - a.z) * f)
      run.rotation.y = Math.atan2(b.x - a.x, b.z - a.z)
    },
  }
}

/* ---------- Prison ---------- */
function buildPrison() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.position.y = -1.2
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) put(inner, 'brick', x, -1, z)
  for (let x = -3; x <= 3; x++) for (let y = 0; y <= 3; y++) put(inner, (x + y) % 2 ? 'cobble' : 'stone', x, y, -3)
  for (let z = -2; z <= 3; z++) for (let y = 0; y <= 3; y++) put(inner, (z + y) % 2 ? 'stone' : 'cobble', -3, y, z)
  for (let x = -3; x <= 3; x++) put(inner, 'cobble', x, 4, -3)
  // mreže
  const bar = (x, y, z, w, h, d) => put(inner, 'metal', x, y, z, w, h, d)
  for (let i = -3; i <= 3.01; i += 0.6) { bar(i, 1.5, 3.2, 0.12, 5, 0.12); bar(3.2, 1.5, i * 0.95 + 0.1, 0.12, 5, 0.12) }
  bar(0, 4, 3.2, 6.8, 0.16, 0.16); bar(0, -0.6, 3.2, 6.8, 0.16, 0.16); bar(3.2, 4, 0, 0.16, 0.16, 6.8); bar(3.2, -0.6, 0, 0.16, 0.16, 6.8)
  // rudy
  ;[[-1.5, 0, -2, 'coal'], [-0.5, 0, -2, 'iron'], [0.5, 0, -2, 'goldore'], [1.5, 0, -2, 'diamond'], [-1, 1, -2, 'diamond'], [0, 1, -2, 'coal'], [1, 1, -2, 'iron'], [-2, 0, -1, 'goldore'], [2, 0, -1, 'coal'], [0, 2, -2, 'goldore']].forEach(([x, y, z, t]) => put(inner, t, x, y, z))
  // krumpáč
  const pick = new THREE.Group()
  const hd = new THREE.Mesh(UNIT, getMat('wood')); hd.scale.set(0.14, 2.4, 0.14); pick.add(hd)
  const hh = new THREE.Mesh(UNIT, getMat('metal')); hh.scale.set(1.4, 0.22, 0.22); hh.position.y = 1.15; pick.add(hh)
  ;[-0.7, 0.7].forEach((x) => { const e = new THREE.Mesh(UNIT, getMat('metal')); e.scale.set(0.22, 0.45, 0.22); e.position.set(x, 0.95, 0); pick.add(e) })
  pick.position.set(1.8, 1.7, 0.4); pick.rotation.z = -0.35; pick.rotation.y = 0.5
  inner.add(pick)
  // fakľa
  const torch = new THREE.Group()
  const st = new THREE.Mesh(UNIT, getMat('wood')); st.scale.set(0.16, 0.8, 0.16); torch.add(st)
  const fl = new THREE.Mesh(UNIT, getMat('flame')); fl.scale.set(0.24, 0.28, 0.24); fl.position.y = 0.52; torch.add(fl)
  torch.position.set(-2.8, 2.4, -1.5); inner.add(torch)
  const tl = new THREE.PointLight(0xff9a30, 6, 9); tl.position.set(-2.4, 2.6, -1.5); inner.add(tl)
  // zámok
  const lock = new THREE.Group()
  const lb = new THREE.Mesh(UNIT, getMat('goldm')); lb.scale.set(0.95, 0.8, 0.4); lock.add(lb)
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.09, 8, 16, Math.PI), getMat('goldm')); sh.position.y = 0.4; lock.add(sh)
  lock.position.set(0, 1.8, 3.45); inner.add(lock)
  return {
    group: g, accent: 0xf59e0b, lightPos: [0, 6, 6],
    update: (t) => { tl.intensity = 5.5 + Math.sin(t * 9) * 0.8 + Math.sin(t * 17) * 0.6; fl.scale.y = 0.28 + Math.sin(t * 12) * 0.06; lock.rotation.z = Math.sin(t * 2) * 0.08; lock.position.y = 1.8 + Math.sin(t * 1.6) * 0.06; pick.rotation.z = -0.35 + Math.sin(t * 1.3) * 0.04 },
  }
}

/* ---------- Klasik ---------- */
function buildClassic() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); inner.position.y = -1.6
  const H = {}
  const ht = (x, z) => {
    if (Math.abs(x) + Math.abs(z) > 7) return -1
    const hh = Math.round(1.3 + Math.sin(x * 0.55) * Math.cos(z * 0.5) * 1.3 + (hash(x, z, 4) - 0.5) * 0.6)
    return Math.max(0, Math.min(3, hh))
  }
  for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) {
    let h = ht(x, z)
    if (h < 0) continue
    if (x >= -1 && x <= 1 && z >= -3 && z <= -1) h = 1
    if ((x === 2 || x === 3) && (z === 1 || z === 2)) h = 0
    H[x + ',' + z] = h
    for (let y = -2; y <= h; y++) put(inner, y === h ? 'grass' : y >= h - 2 ? 'dirt' : 'stone', x, y, z)
    if ((x === 2 || x === 3) && (z === 1 || z === 2)) put(inner, 'water', x, 0, z, 1, 0.82, 1)
  }
  const gh = (x, z) => H[x + ',' + z] ?? 0
  const tree = (x, z, hgt) => {
    const b = gh(x, z)
    for (let i = 1; i <= hgt; i++) put(inner, 'log', x, b + i, z)
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (const dy of [hgt - 1, hgt]) if (Math.abs(dx) + Math.abs(dz) < 4 && !(dx === 0 && dz === 0 && dy < hgt + 1)) put(inner, 'leaves', x + dx, b + dy + 1, z + dz)
    put(inner, 'leaves', x, b + hgt + 2, z); put(inner, 'leaves', x + 1, b + hgt + 2, z); put(inner, 'leaves', x - 1, b + hgt + 2, z)
  }
  tree(-3, 1, 3); tree(3, -3, 4)
  // domček
  for (let x = -1; x <= 1; x++) for (let z = -3; z <= -1; z++) for (const y of [2, 3]) {
    const edge = x === -1 || x === 1 || z === -3 || z === -1
    if (!edge) continue
    const corner = Math.abs(x) === 1 && (z === -3 || z === -1)
    if (x === 0 && z === -1 && y === 2) { put(inner, 'door', x, y, z, 0.8, 1, 0.3).position.z = z + 0.3; continue }
    if (x === 0 && z === -3 && y === 3) { put(inner, 'diamond', x, y, z); continue }
    put(inner, corner ? 'log' : 'planks', x, y, z)
  }
  for (let x = -2; x <= 2; x++) for (let z = -4; z <= 0; z++) if (Math.abs(x) < 2 || (z > -4 && z < 0)) put(inner, 'cobble', x, 4, z, 1, 0.5, 1).position.y = 4.25
  for (let x = -1; x <= 1; x++) for (let z = -3; z <= -1; z++) put(inner, 'cobble', x, 4.75, z, 1, 0.5, 1)
  put(inner, 'cobble', 0, 5.25, -2, 1, 0.5, 1)
  put(inner, 'chest', 2, gh(2, -1) + 1, -1)
  // prasa
  const pig = new THREE.Group()
  const pm = (t, w, h, d, x, y, z) => { const m = new THREE.Mesh(UNIT, getMat(t)); m.scale.set(w, h, d); m.position.set(x, y, z); pig.add(m) }
  pm('pink', 0.95, 0.55, 0.5, 0, 0.5, 0); pm('pink', 0.42, 0.42, 0.42, 0.62, 0.62, 0); pm('snout', 0.14, 0.2, 0.26, 0.86, 0.58, 0)
  ;[[-0.3, -0.15], [-0.3, 0.15], [0.3, -0.15], [0.3, 0.15]].forEach(([x, z]) => pm('pink', 0.16, 0.28, 0.16, x, 0.14, z))
  inner.add(pig)
  return {
    group: g, accent: 0xa78bfa, lightPos: [2, 7, 5],
    update: (t) => { const x = Math.sin(t * 0.5) * 2.4; pig.position.set(x, gh(0, 3) + 0.6 + 0.3, 3.2); pig.rotation.y = Math.cos(t * 0.5) > 0 ? 0 : Math.PI; pig.position.y += Math.abs(Math.sin(t * 6)) * 0.06; inner.position.y = -1.6 + Math.sin(t * 1.1) * 0.12 },
  }
}

const builders = { skyblock: buildSky, parkour: buildParkour, prison: buildPrison, klasik: buildClassic }

/* =====================================================================
   komponent
   ===================================================================== */
export default function MiniGames() {
  const [idx, setIdx] = useState(0)
  const [hold, setHold] = useState(false)
  const activeRef = useRef(0)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const game = servers[idx]

  useEffect(() => { activeRef.current = idx }, [idx])
  useEffect(() => {
    if (hold) return
    const t = setTimeout(() => setIdx((i) => (i + 1) % servers.length), 7500)
    return () => clearTimeout(t)
  }, [idx, hold])

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 4.2, 17.5); camera.lookAt(0, -0.7, 0)
    scene.add(new THREE.AmbientLight(0xfff0d8, 1.25))
    const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(-6, 12, 9); scene.add(sun)
    const rim = new THREE.PointLight(0xffffff, 40, 40); rim.position.set(6, 3, -6); scene.add(rim)

    const dios = servers.map((s) => {
      const d = builders[s.id](); d.s = 0
      d.group.scale.setScalar(0); d.group.visible = false
      scene.add(d.group)
      // jemné čiastočky v akcentovej farbe
      const n = 70, pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) { const a = hash(i, 1, 2) * 6.28, r = 5 + hash(i, 3, 4) * 4; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (hash(i, 5, 6) - 0.5) * 12; pos[i * 3 + 2] = Math.sin(a) * r * 0.7 }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      d.pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: d.accent, size: 0.16, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
      d.group.add(d.pts)
      return d
    })

    const size = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      renderer.setSize(w, h, false); camera.aspect = w / h
      camera.position.z = w / h < 0.9 ? 22 : 17.5
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size); ro.observe(wrap)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.05 })
    io.observe(wrap)

    // myš: náklon + ťahanie
    let tx = 0, ty = 0, yaw = 0, vel = 0, drag = false, lx = 0
    const move = (e) => {
      const r = canvas.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2
      if (drag) { vel = (e.clientX - lx) * 0.012; yaw += vel; lx = e.clientX }
    }
    const down = (e) => { drag = true; lx = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing' }
    const up = () => { drag = false; canvas.style.cursor = 'grab' }
    const leave = () => { if (!drag) { tx = 0; ty = 0 } }
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('pointerleave', leave)

    const clock = new THREE.Clock()
    let raf, ax = 0, ay = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      ax += (ty * 0.18 - ax) * 0.06; ay += (tx * 0.5 - ay) * 0.06
      if (!drag) { yaw += vel; vel *= 0.94 }
      dios.forEach((d, i) => {
        const target = i === activeRef.current ? 1 : 0
        d.s += (target - d.s) * 0.1
        d.group.visible = d.s > 0.015
        if (!d.group.visible) return
        const e = d.s * d.s * (3 - 2 * d.s)
        d.group.scale.setScalar(0.7 * e)
        d.group.rotation.y = t * 0.22 + yaw + ay + (1 - e) * 2.4
        d.group.rotation.x = ax
        d.group.position.y = (1 - e) * -2
        d.update(t)
        d.pts.rotation.y = -t * 0.08
        d.pts.material.opacity = 0.8 * e
      })
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('pointerleave', leave)
      renderer.dispose()
    }
  }, [])

  const live = game.status === 'live'
  return (
    <section id="minihry" className="section alt mg-sec" style={{ '--c': game.color }}>
      <div className="wrap">
        <SectionHead k="MINIHRY" t="Do čeho *skočit*" d="SkyBlock a Parkour jsou první na řadě. Prison a Klasik přijdou hned za nimi." />
        <div className="mg" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
          <div className="mg-list" role="tablist">
            {servers.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={i === idx} className={'mg-item ' + (i === idx ? 'on' : '')} style={{ '--c': s.color }} onClick={() => setIdx(i)}>
                <span className="mg-num">0{i + 1}</span>
                <span className="mg-ico"><Icon name={s.icon} size={24} /></span>
                <span className="mg-txt"><b>{s.name}</b><small>{s.status === 'live' ? 'první na řadě' : 'chystáme'}</small></span>
                {i === idx && !hold && <span key={'p' + idx} className="mg-prog" />}
              </button>
            ))}
          </div>
          <div className="mg-stage" ref={wrapRef}>
            <div className="mg-glow" />
            <canvas ref={canvasRef} className="mg-canvas" />
            <div className="mg-hint"><Icon name="gamepad" size={14} /> ťahaj myšou a otáčaj</div>
            <div className="mg-info" key={game.id}>
              <span className={'badge ' + (live ? 'live' : 'soon')}><i />{live ? 'PRVNÍ NA ŘADĚ' : 'CHYSTÁME'}</span>
              <h3 className="mg-name" aria-label={game.name}>
                {[...game.name].map((ch, i) => <span key={i} className="ltr gold" style={{ '--i': i }}>{ch}</span>)}
              </h3>
              <p>{game.desc}</p>
              <div className="tags">{game.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <a className="btn btn-primary" href={DISCORD} target="_blank" rel="noreferrer">{live ? 'Hrát' : 'Hlídat na Discordu'} <Icon name="arrow" size={18} className="arr" /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
