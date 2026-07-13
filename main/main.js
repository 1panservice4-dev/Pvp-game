// =========================================================================
// 1. 캐릭터 및 무기 모듈 로드 (ES Modules)
// =========================================================================
import { AvengerSkills } from './characters/avenger.js';
import { SlayerSkills } from './characters/slayer.js';
import { GuardianSkills } from './characters/guardian.js';

// 캐릭터 스킬/외형 매트릭스 레지스터 맵
const CHARACTER_MODULE_MATRIX = {
    avenger: AvengerSkills,
    slayer: SlayerSkills,
    guardian: GuardianSkills
};

// 기본 에이전트 스탯 데이터베이스
const CHAR_DB = {
    avenger:  { name: "어벤저", hp: 100, mp: 100, spd: 0.22, color: 0x00ff88, regenInterval: 200, regenAmount: 2 },
    slayer:   { name: "슬레이어", hp: 85,  mp: 120, spd: 0.28, color: 0x00d2ff, regenInterval: 150, regenAmount: 3 },
    guardian: { name: "가디언", hp: 140, mp: 80,  spd: 0.16, color: 0xffaa00, regenInterval: 300, regenAmount: 1 }
};

// 공통 무기 풀
const COMMON_WEAPON_POOL = [
    { id: "w_bare",   name: "맨손 (Unarmed)",    dmgMult: 1.0, mpMod: 1.0,  desc: "기본 능력치 유지", color: 0xaaaaaa },
    { id: "w_sword",  name: "검 (Sword)",       dmgMult: 1.4, mpMod: 1.0,  desc: "근접 스킬 데미지 증가 (x1.4)", color: 0xff3344 },
    { id: "w_stick",  name: "스틱 (Stick)",     dmgMult: 1.0, mpMod: 0.75, desc: "MP 소모량 감소 (25% 세이브)", color: 0x33ff66 },
    { id: "w_wand",   name: "완드 (Wand)",      dmgMult: 0.8, mpMod: 0.45, desc: "MP 소모량 대폭 감소 (55% 세이브)", color: 0x3399ff }
];

const SKILL_DATA = { 
    grab: { mpCost: 20, damage: 10 }, 
    dagger: { mpCost: 15, damage: 15 }, 
    slash: { mpCost: 30, damage: 25 }, 
    shockwave: { mpCost: 25, damage: 20 } 
};

// =========================================================================
// 2. 게임 엔진 전역 상태 변수 정의
// =========================================================================
let selectedChar = 'avenger'; 
let selectedWeaponIdx = 0; 
let aiDifficulty = 'easy'; 
let lastRegenTime = 0;
let matchInterval = null; 
let matchTimeSeconds = 0;

const p1Stats = { hp: 100, maxHp: 100, mp: 100, maxMp: 100 };
const p2Stats = { hp: 100, maxHp: 100, mp: 100, maxMp: 100 };

let player1 = null; 
let player2 = null;
const p1Center = new THREE.Vector3(); 
const p2Center = new THREE.Vector3();

const keys = {}; 
const projectiles = []; 
let isGrabbed = false;

let defaultSpeed = 0.22; 
let p1VelocityY = 0; 
const gravity = -0.015; 
const jumpForce = 0.35; 
let isGrounded = true;

let isRolling = false; 
let rollFrames = 0; 
const rollDuration = 22; 
const rollSpeed = 0.52; 
let rollDirection = new THREE.Vector3(); 
let rollType = 'forward'; 

let comboRollCount = 0;          
let hasComboJumpAvailable = false; 
let rollQueued = false; 

// 2회 연속 구르기 패널티 경직 카운터 (35프레임 = 약 0.6초)
let landingDelayFrames = 0;
const MAX_LANDING_DELAY = 35; 

// =========================================================================
// 3. Three.js 기본 렌더러 및 카메라 구성
// =========================================================================
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x050515);

const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const subCamera = new THREE.PerspectiveCamera(60, 180 / 130, 0.1, 1000);
subCamera.position.set(0, 35, 0); 
subCamera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const subRenderer = new THREE.WebGLRenderer({ antialias: true });
subRenderer.setSize(180, 130); 
document.getElementById('sub-view').appendChild(subRenderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); 
dirLight.position.set(10, 30, 10); 
scene.add(dirLight);

const grid = new THREE.GridHelper(60, 60, 0x00ffcc, 0x222222); 
scene.add(grid);

const guideLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), 
    new THREE.LineBasicMaterial({ color: 0x334155 })
);
scene.add(guideLine);

// =========================================================================
// 4. 캐릭터 실시간 동적 스폰 처리
// =========================================================================
function spawnActiveCharacters() {
    if (player1) scene.remove(player1);
    if (player2) scene.remove(player2);

    // 플레이어 캐릭터 생성
    const p1Module = CHARACTER_MODULE_MATRIX[selectedChar];
    const p1BaseColor = CHAR_DB[selectedChar].color;
    player1 = p1Module.createModel(THREE, p1BaseColor);
    player1.position.set(-10, 0, 0);
    scene.add(player1);

    // AI 캐릭터 생성 (난이도별 매칭)
    let enemyTargetId = 'slayer';
    if (aiDifficulty === 'hard') enemyTargetId = 'guardian';

    const p2Module = CHARACTER_MODULE_MATRIX[enemyTargetId];
    const p2BaseColor = aiDifficulty === 'easy' ? 0xffaa00 : (aiDifficulty === 'normal' ? 0xff3366 : 0xaa00ff);
    player2 = p2Module.createModel(THREE, p2BaseColor);
    player2.position.set(10, 0, 0);
    scene.add(player2);
}

// =========================================================================
// 5. 무대 전환 및 UI 매핑 컨트롤러
// =========================================================================
function changeScene(sceneName) {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('lobby-screen').classList.add('hidden');
    document.getElementById('char-select-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');

    if (sceneName === 'start') document.getElementById('start-screen').classList.remove('hidden');
    else if (sceneName === 'lobby') document.getElementById('lobby-screen').classList.remove('hidden');
    else if (sceneName === 'char-select') { 
        document.getElementById('char-select-screen').classList.remove('hidden'); 
        renderCommonWeapons(); 
    }
    else if (sceneName === 'game') {
        document.getElementById('game-hud').classList.remove('hidden');
        const cData = CHAR_DB[selectedChar]; 
        const wData = COMMON_WEAPON_POOL[selectedWeaponIdx];
        
        p1Stats.maxHp = cData.hp; p1Stats.hp = cData.hp; 
        p1Stats.maxMp = cData.mp; p1Stats.mp = cData.mp; 
        defaultSpeed = cData.spd;
        
        document.getElementById('hud-weapon-desc').innerText = `특성: ${wData.desc}`;
        const lbl = document.getElementById('hud-p2-label');
        if(aiDifficulty === 'easy') lbl.innerText = "AI BOT (쉬움)";
        else if(aiDifficulty === 'normal') lbl.innerText = "AI BOT (보통)";
        else lbl.innerText = "AI BOT (시련)";
        
        document.getElementById('hud-p1-label').innerText = `PLAYER (${selectedChar.toUpperCase()})`;
        
        // 고유 외형 동적 생성기 가동
        spawnActiveCharacters();
        
        mainCamera.rotation.set(0, 0, 0);
        mainCamera.quaternion.set(0, 0, 0, 1);
        mainCamera.updateMatrixWorld(true);
        
        p2Stats.hp = 100; p2Stats.mp = 100;
        isGrabbed = false; isRolling = false; 
        comboRollCount = 0;
        hasComboJumpAvailable = false;
        rollQueued = false;
        landingDelayFrames = 0; 
        
        lastRegenTime = performance.now(); 
        updateUI();
    }
}

// UI 데이터 동기화
function updateUI() {
    document.getElementById('p1-hp').style.width = `${(p1Stats.hp / p1Stats.maxHp) * 100}%`;
    document.getElementById('p1-mp').style.width = `${(p1Stats.mp / p1Stats.maxMp) * 100}%`;
    document.getElementById('p2-hp').style.width = `${p2Stats.hp}%`;
    document.getElementById('p2-mp').style.width = `${p2Stats.mp}%`;
    document.getElementById('hud-roll-counter').innerText = comboRollCount;
}

// 로비 무기 슬롯 렌더링
function renderCommonWeapons() {
    const container = document.getElementById('select-screen-weapon-container');
    if(!container) return;
    container.innerHTML = "";
    COMMON_WEAPON_POOL.forEach((w, idx) => {
        const slot = document.createElement('div');
        slot.className = `weapon-slot ${idx === selectedWeaponIdx ? 'active' : ''}`;
        slot.onclick = () => { selectedWeaponIdx = idx; renderCommonWeapons(); };
        slot.innerHTML = `<span><b>${w.name}</b></span><span class="w-desc">${w.desc}</span>`;
        container.appendChild(slot);
    });
}

function processSelectChar(id) {
    selectedChar = id;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`sel-${id}`).classList.add('active');
}

function confirmSelection() {
    document.getElementById('lobby-current-summary').innerText = `${CHAR_DB[selectedChar].name} + [${COMMON_WEAPON_POOL[selectedWeaponIdx].name}]`;
    changeScene('lobby');
}

function toggleBattleMenu() { document.getElementById('battle-pop-menu').classList.toggle('hidden'); }

function selectDifficultyTab(diff) {
    aiDifficulty = diff;
    document.querySelectorAll('.diff-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`diff-${diff}`).classList.add('active');
}

function startMatchmaking(modeType) {
    document.getElementById('battle-pop-menu').classList.add('hidden');
    matchTimeSeconds = 0;
    const poolUi = document.getElementById('match-pool-ui');

    if (modeType === 'PVP' || modeType === 'FRIEND') {
        document.getElementById('match-overlay').classList.remove('hidden');
        document.getElementById('match-mode-title').innerText = modeType === 'PVP' ? "라이브 배틀 매치 서칭" : "온라인 친선 배틀 연동 룸";
        matchInterval = setInterval(() => {
            matchTimeSeconds++;
            document.getElementById('match-timer').innerText = `대기 시간: ${matchTimeSeconds}초`;
        }, 1000);
    } else if (modeType === 'AI_PRACTICE') {
        changeScene('game');
    }
}

function cancelMatchmaking() {
    clearInterval(matchInterval);
    document.getElementById('match-overlay').classList.add('hidden');
}

// =========================================================================
// 6. 스킬 및 투사체 연산 메커니즘
// =========================================================================
function useSkill(type) {
    if (landingDelayFrames > 0 || isGrabbed) return;

    const currentModule = CHARACTER_MODULE_MATRIX[selectedChar];
    const skillData = currentModule?.skills[type];
    if (!skillData || !skillData.cast) return; 

    const wData = COMMON_WEAPON_POOL[selectedWeaponIdx]; 
    const runtimeMpCost = Math.floor(skillData.mpCost * wData.mpMod);
    const runtimeDamage = Math.floor(skillData.damage * wData.dmgMult);

    if (p1Stats.mp < runtimeMpCost) return;
    p1Stats.mp -= runtimeMpCost; 
    updateUI();

    p1Center.copy(player1.position).y += 1.1;
    p2Center.copy(player2.position).y += 1.1;
    const toEnemy = new THREE.Vector3().subVectors(p2Center, p1Center).normalize();
    const spawnPos = new THREE.Vector3().copy(p1Center).addScaledVector(toEnemy, 1.5);
    const pMat = new THREE.MeshBasicMaterial({ color: wData.color });

    // 캐릭터 개별 모듈 파일에 들어있는 시전 코드 호출
    const projectileInstance = skillData.cast(THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1);
    
    projectileInstance.damage = runtimeDamage;
    projectiles.push(projectileInstance);
}

function hitEnemy(amount) {
    p2Stats.hp -= amount; if (p2Stats.hp < 0) p2Stats.hp = 0; updateUI();
    player2.scale.set(1.4, 1.4, 1.4);
    setTimeout(() => { 
        player2.scale.set(1.0, 1.0, 1.0); 
    }, 150);
}

// =========================================================================
// 7. 실시간 물리 및 메인 게임 애니메이션 루프
// =========================================================================
function animate(timestamp) {
    requestAnimationFrame(animate);
    const isGameActive = !document.getElementById('game-hud').classList.contains('hidden');

    if (isGameActive && player1 && player2) {
        const currentCharData = CHAR_DB[selectedChar];
        if (timestamp - lastRegenTime > currentCharData.regenInterval) {
            if (p1Stats.mp < p1Stats.maxMp) p1Stats.mp = Math.min(p1Stats.maxMp, p1Stats.mp + currentCharData.regenAmount);
            if (p2Stats.mp < p2Stats.maxMp) p2Stats.mp = Math.min(p2Stats.maxMp, p2Stats.mp + 2);
            updateUI(); lastRegenTime = timestamp;
        }

        p1Center.copy(player1.position).y += 1.9; p2Center.copy(player2.position).y += 1.1;
        const moveForward = new THREE.Vector3().subVectors(player2.position, player1.position); moveForward.y = 0;
        const distanceToEnemy = moveForward.length(); moveForward.normalize();
        const moveRight = new THREE.Vector3().crossVectors(moveForward, new THREE.Vector3(0, 1, 0)).normalize();

        // 후딜레이 경직 처리 프레임 계산
        if (landingDelayFrames > 0) {
            landingDelayFrames--;
            if (player1.userData?.materials) player1.userData.materials.forEach(m => m.color.setHex(0x552222));
            if (landingDelayFrames <= 0) {
                if (player1.userData?.materials) player1.userData.materials.forEach(m => m.color.setHex(CHAR_DB[selectedChar].color));
            }
        }

        // 이동 제어
        if (!isRolling && !isGrabbed && landingDelayFrames <= 0) {
            if (keys['ArrowUp'] && distanceToEnemy > 2.2) player1.position.addScaledVector(moveForward, defaultSpeed);
            if (keys['ArrowDown']) player1.position.addScaledVector(moveForward, -defaultSpeed);
            if (keys['ArrowLeft']) player1.position.addScaledVector(moveRight, -defaultSpeed);
            if (keys['ArrowRight']) player1.position.addScaledVector(moveRight, defaultSpeed);
            
            if (comboRollCount > 0 && !keys['ShiftLeft'] && !keys['ShiftRight'] && isGrounded) {
                comboRollCount = 0;
                updateUI();
            }
        } else if (isRolling) {
            rollFrames++; 
            player1.position.addScaledVector(rollDirection, rollSpeed);
            if(!isGrounded) p1VelocityY = 0; 
            
            if (rollFrames >= rollDuration) {
                isRolling = false;
                if (rollQueued && comboRollCount < 2) {
                    rollQueued = false;
                    startRoll();
                } else {
                    if (comboRollCount >= 2 && isGrounded) {
                        landingDelayFrames = MAX_LANDING_DELAY;
                    } else {
                        hasComboJumpAvailable = true; 
                    }
                }
            }
        }

        // 점프 및 착지 판정
        if (!isGrounded) {
            p1VelocityY += gravity; 
            player1.position.y += p1VelocityY;
            if (player1.position.y <= 0) { 
                player1.position.y = 0; p1VelocityY = 0; isGrounded = true; 
                if (comboRollCount >= 2) {
                    landingDelayFrames = MAX_LANDING_DELAY;
                    for (let key in keys) keys[key] = false;
                }
                comboRollCount = 0; rollQueued = false; hasComboJumpAvailable = false;
                updateUI();
            }
        }

        if (isGrabbed) {
            const targetPos = new THREE.Vector3().copy(player1.position).addScaledVector(moveForward, 1.8); targetPos.y = 0;
            player2.position.lerp(targetPos, 0.25); if (player2.position.distanceTo(targetPos) < 0.2) isGrabbed = false;
        }

        player1.lookAt(player2.position.x, player1.position.y, player2.position.z);
        player2.lookAt(player1.position.x, player2.position.y, player1.position.z);

        const positions = guideLine.geometry.attributes.position.array;
        positions[0] = p1Center.x; positions[1] = p1Center.y; positions[2] = p1Center.z;
        positions[3] = p2Center.x; positions[4] = p2Center.y; positions[5] = p2Center.z;
        guideLine.geometry.attributes.position.needsUpdate = true;

        mainCamera.position.copy(p1Center);
        if (isRolling) {
            const progress = rollFrames / rollDuration;
            const angle = progress * Math.PI * 2;
            mainCamera.lookAt(p2Center);
            if (rollType === 'forward') mainCamera.rotateX(angle);
            else if (rollType === 'backward') mainCamera.rotateX(-angle);
            else mainCamera.rotation.z = angle;
        } else {
            mainCamera.lookAt(p2Center);
        }

        // 투사체 업데이트 루프
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i]; p.life--;
            if (p.type === 'shockwave') {
                p.radius += 0.45; p.mesh.geometry.dispose(); p.mesh.geometry = new THREE.RingGeometry(p.radius - 0.6, p.radius, 32); p.mesh.geometry.rotateX(-Math.PI / 2);
                const dist = player1.position.distanceTo(player2.position);
                if (dist <= p.radius && dist >= p.radius - 2.5) hitEnemy(p.damage);
            } else {
                const currentDir = new THREE.Vector3().subVectors(p2Center, p.mesh.position).normalize();
                p.mesh.position.addScaledVector(currentDir, p.speed);
                if (p.mesh.position.distanceTo(p2Center) < 1.8) {
                    hitEnemy(p.damage); if (p.type === 'grab') isGrabbed = true;
                    scene.remove(p.mesh); projectiles.splice(i, 1); continue;
                }
            }
            if (p.life <= 0) { scene.remove(p.mesh); projectiles.splice(i, 1); }
        }
    } else {
        mainCamera.rotation.set(0, 0, 0);
        const time = timestamp * 0.0002;
        mainCamera.position.set(Math.sin(time) * 18, 12, Math.cos(time) * 18); mainCamera.lookAt(0, 1.0, 0);
    }

    renderer.render(scene, mainCamera); 
    subRenderer.render(scene, subCamera);
}

function startRoll() {
    if (!player1 || !player2) return;
    const moveForward = new THREE.Vector3().subVectors(player2.position, player1.position); moveForward.y = 0; moveForward.normalize();
    const moveRight = new THREE.Vector3().crossVectors(moveForward, new THREE.Vector3(0, 1, 0)).normalize();
    let targetDir = new THREE.Vector3();

    rollType = 'forward';
    if (keys['ArrowUp']) { targetDir.add(moveForward); rollType = 'forward'; }
    else if (keys['ArrowDown']) { targetDir.addScaledVector(moveForward, -1); rollType = 'backward'; }
    if (keys['ArrowLeft']) { targetDir.addScaledVector(moveRight, -1); if(!keys['ArrowUp'] && !keys['ArrowDown']) rollType = 'side'; }
    if (keys['ArrowRight']) { targetDir.add(moveRight); if(!keys['ArrowUp'] && !keys['ArrowDown']) rollType = 'side'; }

    if (targetDir.lengthSq() === 0) { targetDir.copy(moveForward); rollType = 'forward'; } 
    else targetDir.normalize();

    rollDirection.copy(targetDir); isRolling = true; rollFrames = 0;
    comboRollCount++; updateUI();
}

// =========================================================================
// 8. 윈도우 키보드 및 마우스 조작 입력 시스템
// =========================================================================
window.addEventListener('keydown', (e) => {
    if (document.getElementById('game-hud').classList.contains('hidden')) return;
    if (landingDelayFrames > 0) return;

    const codeStr = e.code.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','space'].includes(codeStr)) e.preventDefault();
    keys[e.key] = true; keys[e.code] = true;
    
    if (e.code === 'Space') { 
        if (isGrounded && !isRolling) { p1VelocityY = jumpForce; isGrounded = false; }
        else if (hasComboJumpAvailable && !isRolling && comboRollCount < 2) { p1VelocityY = jumpForce * 0.95; hasComboJumpAvailable = false; }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (comboRollCount < 2) {
            if (!isRolling) startRoll();
            else if (comboRollCount === 1) rollQueued = true;
        }
    }
    if (e.code === 'KeyW') useSkill('grab'); 
    if (e.code === 'KeyA') useSkill('dagger');
    if (e.code === 'KeyS') useSkill('slash'); 
    if (e.code === 'KeyD') useSkill('shockwave');
});

window.addEventListener('keyup', (e) => { keys[e.key] = false; keys[e.code] = false; });
window.addEventListener('resize', () => {
    mainCamera.aspect = window.innerWidth / window.innerHeight; mainCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================================================================
// 9. HTML 전역 브릿지 바인딩 및 부트스트랩
// =========================================================================
window.changeScene = changeScene;
window.processSelectChar = processSelectChar;
window.confirmSelection = confirmSelection;
window.toggleBattleMenu = toggleBattleMenu;
window.selectDifficultyTab = selectDifficultyTab;
window.startMatchmaking = startMatchmaking;
window.cancelMatchmaking = cancelMatchmaking;
window.spawnActiveCharacters = spawnActiveCharacters;

// 최초 실행 초기화
processSelectChar('avenger'); 
confirmSelection(); 
changeScene('start'); 
animate(0);
// 기존의 전역 바인딩 코드들 바로 아래에 붙여넣기
window.addEventListener('DOMContentLoaded', () => {
    // DOM 로드 완료 후 Three.js와 메인 루프를 안전하게 동기화
    if (typeof THREE !== 'undefined') {
        processSelectChar('avenger'); 
        confirmSelection(); 
        changeScene('start'); 
        animate(0);
    } else {
        // 혹시 스크립트 로드 순서가 꼬였을 경우를 대비해 Three.js 대기 후 실행
        const checkThree = setInterval(() => {
            if (typeof THREE !== 'undefined') {
                clearInterval(checkThree);
                processSelectChar('avenger'); 
                confirmSelection(); 
                changeScene('start'); 
                animate(0);
            }
        }, 50);
    }
});
