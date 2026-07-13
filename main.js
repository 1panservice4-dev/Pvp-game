import { AvengerSkills } from './characters/avenger.js';
import { SlayerSkills } from './characters/slayer.js';
import { GuardianSkills } from './characters/guardian.js';

const CHARACTER_MODULE_MATRIX = {
    avenger: AvengerSkills,
    slayer: SlayerSkills,
    guardian: GuardianSkills
};

const CHAR_DB = {
    avenger:  { hp: 100, mp: 100, spd: 0.22, color: 0x00ff88, regenInterval: 200, regenAmount: 2 },
    slayer:   { hp: 85,  mp: 120, spd: 0.28, color: 0x00d2ff, regenInterval: 150, regenAmount: 3 },
    guardian: { hp: 140, mp: 80,  spd: 0.16, color: 0xffaa00, regenInterval: 300, regenAmount: 1 }
};

const COMMON_WEAPON_POOL = [
    { id: "w_bare", name: "맨손", dmgMult: 1.0, mpMod: 1.0, desc: "기본 능력치 유지", color: 0xaaaaaa },
    { id: "w_sword", name: "장검", dmgMult: 1.4, mpMod: 1.0, desc: "데미지 1.4배 증가", color: 0xff3344 },
    { id: "w_stick", name: "스틱", dmgMult: 1.0, mpMod: 0.75, desc: "MP 소모 25% 절감", color: 0x33ff66 },
    { id: "w_wand", name: "지팡이", dmgMult: 0.8, mpMod: 0.45, desc: "MP 소모 55% 절감", color: 0x3399ff }
];

let selectedChar = 'avenger'; let selectedWeaponIdx = 0; let aiDifficulty = 'easy'; let lastRegenTime = 0;
const p1Stats = { hp: 100, maxHp: 100, mp: 100, maxMp: 100 }; const p2Stats = { hp: 100, maxHp: 100, mp: 100, maxMp: 100 };
let player1, player2; const p1Center = new THREE.Vector3(), p2Center = new THREE.Vector3();
const keys = {}, projectiles = []; let isGrabbed = false;
let defaultSpeed = 0.22, p1VelocityY = 0, gravity = -0.015, jumpForce = 0.35, isGrounded = true;
let isRolling = false, rollFrames = 0, rollDuration = 22, rollSpeed = 0.52, rollDirection = new THREE.Vector3(), rollType = 'forward';
let comboRollCount = 0, hasComboJumpAvailable = false, rollQueued = false;
let landingDelayFrames = 0; const MAX_LANDING_DELAY = 35; // 0.6초 후딜레이

const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050515);
const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(window.innerWidth, window.innerHeight); document.body.appendChild(renderer.domElement);
const subRenderer = new THREE.WebGLRenderer({ antialias: true }); subRenderer.setSize(180, 130); document.getElementById('sub-view').appendChild(subRenderer.domElement);
const subCamera = new THREE.PerspectiveCamera(60, 180 / 130, 0.1, 1000); subCamera.position.set(0, 35, 0); subCamera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); dirLight.position.set(10, 30, 10); scene.add(dirLight);
const grid = new THREE.GridHelper(60, 60, 0x00ffcc, 0x222222); scene.add(grid);
const guideLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x334155 })); scene.add(guideLine);

function spawnActiveCharacters() {
    if (player1) scene.remove(player1); if (player2) scene.remove(player2);
    player1 = CHARACTER_MODULE_MATRIX[selectedChar].createModel(THREE, CHAR_DB[selectedChar].color);
    player1.position.set(-10, 0, 0); scene.add(player1);
    let enemyId = aiDifficulty === 'hard' ? 'guardian' : 'slayer';
    player2 = CHARACTER_MODULE_MATRIX[enemyId].createModel(THREE, aiDifficulty === 'easy' ? 0xffaa00 : 0xff3366);
    player2.position.set(10, 0, 0); scene.add(player2);
}

function changeScene(sceneName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(sceneName + '-screen')?.classList.remove('hidden');
    if (sceneName === 'game') {
        document.getElementById('game-hud').classList.remove('hidden');
        const cData = CHAR_DB[selectedChar]; const wData = COMMON_WEAPON_POOL[selectedWeaponIdx];
        p1Stats.maxHp = cData.hp; p1Stats.hp = cData.hp; p1Stats.maxMp = cData.mp; p1Stats.mp = cData.mp; defaultSpeed = cData.spd;
        document.getElementById('hud-weapon-desc').innerText = `특성: ${wData.desc}`;
        spawnActiveCharacters();
        landingDelayFrames = 0; comboRollCount = 0; isRolling = false; isGrounded = true;
        lastRegenTime = performance.now(); updateUI();
    }
}

function updateUI() {
    document.getElementById('p1-hp').style.width = `${(p1Stats.hp / p1Stats.maxHp) * 100}%`;
    document.getElementById('p1-mp').style.width = `${(p1Stats.mp / p1Stats.maxMp) * 100}%`;
    document.getElementById('p2-hp').style.width = `${p2Stats.hp}%`;
    document.getElementById('hud-roll-counter').innerText = comboRollCount;
}

function useSkill(type) {
    if (landingDelayFrames > 0 || isGrabbed) return;
    const skillData = CHARACTER_MODULE_MATRIX[selectedChar].skills[type]; if (!skillData) return;
    const wData = COMMON_WEAPON_POOL[selectedWeaponIdx];
    const cost = Math.floor(skillData.mpCost * wData.mpMod);
    if (p1Stats.mp < cost) return; p1Stats.mp -= cost; updateUI();
    p1Center.copy(player1.position).y += 1.1; p2Center.copy(player2.position).y += 1.1;
    const toEnemy = new THREE.Vector3().subVectors(p2Center, p1Center).normalize();
    const spawnPos = new THREE.Vector3().copy(p1Center).addScaledVector(toEnemy, 1.5);
    const proj = skillData.cast(THREE, scene, spawnPos, toEnemy, new THREE.MeshBasicMaterial({ color: wData.color }), p2Center, player1);
    proj.damage = Math.floor(skillData.damage * wData.dmgMult); projectiles.push(proj);
}

function startRoll() {
    const moveF = new THREE.Vector3().subVectors(player2.position, player1.position).setComponent(1, 0).normalize();
    const moveR = new THREE.Vector3().crossVectors(moveF, new THREE.Vector3(0, 1, 0)).normalize();
    let targetD = new THREE.Vector3(); rollType = 'forward';
    if (keys['ArrowUp']) targetD.add(moveF); else if (keys['ArrowDown']) { targetD.addScaledVector(moveF, -1); rollType = 'backward'; }
    if (keys['ArrowLeft']) targetD.addScaledVector(moveR, -1); if (keys['ArrowRight']) targetD.add(moveR);
    if (targetD.lengthSq() === 0) targetD.copy(moveF); else targetD.normalize();
    rollDirection.copy(targetD); isRolling = true; rollFrames = 0; comboRollCount++; updateUI();
}

function animate(timestamp) {
    requestAnimationFrame(animate);
    if (!document.getElementById('game-hud').classList.contains('hidden') && player1 && player2) {
        const cData = CHAR_DB[selectedChar];
        if (timestamp - lastRegenTime > cData.regenInterval) {
            p1Stats.mp = Math.min(p1Stats.maxMp, p1Stats.mp + cData.regenAmount);
            updateUI(); lastRegenTime = timestamp;
        }
        if (landingDelayFrames > 0) {
            landingDelayFrames--;
            if (player1.userData?.materials) player1.userData.materials.forEach(m => m.color.setHex(0x552222));
            if (landingDelayFrames <= 0) player1.userData.materials.forEach(m => m.color.setHex(CHAR_DB[selectedChar].color));
        }
        p1Center.copy(player1.position).y += 1.1; p2Center.copy(player2.position).y += 1.1;
        const dist = player1.position.distanceTo(player2.position);
        if (!isRolling && !isGrabbed && landingDelayFrames <= 0) {
            const moveF = new THREE.Vector3().subVectors(player2.position, player1.position).setComponent(1, 0).normalize();
            const moveR = new THREE.Vector3().crossVectors(moveF, new THREE.Vector3(0, 1, 0)).normalize();
            if (keys['ArrowUp'] && dist > 2.0) player1.position.addScaledVector(moveF, defaultSpeed);
            if (keys['ArrowDown']) player1.position.addScaledVector(moveF, -defaultSpeed);
            if (keys['ArrowLeft']) player1.position.addScaledVector(moveR, -defaultSpeed);
            if (keys['ArrowRight']) player1.position.addScaledVector(moveR, defaultSpeed);
        } else if (isRolling) {
            rollFrames++; player1.position.addScaledVector(rollDirection, rollSpeed);
            if (rollFrames >= rollDuration) {
                isRolling = false;
                if (rollQueued && comboRollCount < 2) { rollQueued = false; startRoll(); }
                else if (comboRollCount >= 2) { hasComboJumpAvailable = false; if(isGrounded) landingDelayFrames = MAX_LANDING_DELAY; }
                else hasComboJumpAvailable = true;
            }
        }
        if (!isGrounded) {
            p1VelocityY += gravity; player1.position.y += p1VelocityY;
            if (player1.position.y <= 0) { 
                player1.position.y = 0; p1VelocityY = 0; isGrounded = true; 
                if (comboRollCount >= 2) landingDelayFrames = MAX_LANDING_DELAY;
                comboRollCount = 0; hasComboJumpAvailable = false; updateUI();
            }
        }
        if (isGrabbed) {
            const target = new THREE.Vector3().copy(player1.position).addScaledVector(new THREE.Vector3().subVectors(player2.position, player1.position).setComponent(1,0).normalize(), 1.5);
            player2.position.lerp(target, 0.2); if(player2.position.distanceTo(target) < 0.3) isGrabbed = false;
        }
        player1.lookAt(player2.position.x, player1.position.y, player2.position.z);
        player2.lookAt(player1.position.x, player2.position.y, player1.position.z);
        mainCamera.position.copy(p1Center); mainCamera.lookAt(p2Center);
        if(isRolling) {
            const progress = rollFrames / rollDuration; const angle = progress * Math.PI * 2;
            if(rollType==='forward') mainCamera.rotateX(angle); else if(rollType==='backward') mainCamera.rotateX(-angle);
        }
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i]; p.life--;
            if (p.type === 'shockwave') {
                p.radius += 0.4; p.mesh.geometry.dispose(); p.mesh.geometry = new THREE.RingGeometry(p.radius - 0.5, p.radius, 32); p.mesh.geometry.rotateX(-Math.PI/2);
                if(player1.position.distanceTo(player2.position) <= p.radius && player1.position.distanceTo(player2.position) >= p.radius - 2.0) { p2Stats.hp -= (p.damage/20); }
            } else {
                const dir = new THREE.Vector3().subVectors(p2Center, p.mesh.position).normalize();
                p.mesh.position.addScaledVector(dir, p.speed);
                if (p.mesh.position.distanceTo(p2Center) < 1.5) { p2Stats.hp -= p.damage; if(p.type==='grab') isGrabbed=true; scene.remove(p.mesh); projectiles.splice(i,1); updateUI(); continue; }
            }
            if (p.life <= 0) { scene.remove(p.mesh); projectiles.splice(i,1); }
        }
        renderer.render(scene, mainCamera); subRenderer.render(scene, subCamera);
    } else {
        const time = timestamp * 0.0002; mainCamera.position.set(Math.sin(time)*18, 12, Math.cos(time)*18); mainCamera.lookAt(0,1,0);
        renderer.render(scene, mainCamera);
    }
}

window.addEventListener('keydown', (e) => {
    if (document.getElementById('game-hud').classList.contains('hidden') || landingDelayFrames > 0) return;
    keys[e.code] = true;
    if (e.code === 'Space') {
        if (isGrounded && !isRolling) { p1VelocityY = jumpForce; isGrounded = false; }
        else if (hasComboJumpAvailable && !isRolling && comboRollCount < 2) { p1VelocityY = jumpForce*0.9; hasComboJumpAvailable = false; }
    }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && comboRollCount < 2) {
        if (!isRolling) startRoll(); else if (comboRollCount === 1) rollQueued = true;
    }
    if (e.code === 'KeyW') useSkill('grab'); if (e.code === 'KeyA') useSkill('dagger');
    if (e.code === 'KeyS') useSkill('slash'); if (e.code === 'KeyD') useSkill('shockwave');
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.changeScene = changeScene; window.processSelectChar = (id) => { selectedChar = id; document.querySelectorAll('.char-card').forEach(c => c.classList.toggle('active', c.id === 'sel-'+id)); };
window.confirmSelection = () => { document.getElementById('lobby-current-summary').innerText = CHARACTER_MODULE_MATRIX[selectedChar].name; changeScene('lobby'); };
window.startMatchmaking = startMatchmaking; changeScene('start'); animate(0);
