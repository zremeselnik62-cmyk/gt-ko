import { cpSync, rmSync, mkdirSync } from 'node:fs'
const target = 'C:/xampp/htdocs/gameteam'
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
cpSync('dist', target, { recursive: true })
console.log('Nasadene do ' + target + ' -> http://localhost/gameteam/')
