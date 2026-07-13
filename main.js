import { AvengerSkills } from './characters/avenger.js';
import { SlayerSkills } from './characters/slayer.js';
import { GuardianSkills } from './characters/guardian.js';

// 1. 다이내믹 매트릭스 레지스터 맵
const CHARACTER_MODULE_MATRIX = {
    avenger: AvengerSkills,
    slayer: SlayerSkills,
    guardian: GuardianSkills
};

// 2. 캐릭터 선택 변경 혹은 경기장 입장 시 호출하는 동적 생성 함수
function spawnActiveCharacters() {
    // 기존 무대에 생성되어 있던 모델 메쉬 초기화 처리
    if (player1) scene.remove(player1);
    if (player2) scene.remove(player2);

    // [내 캐릭터 생성] 플레이어가 선택한 ID 모듈 추적
    const p1Module = CHARACTER_MODULE_MATRIX[selectedChar];
    const p1BaseColor = CHAR_DB[selectedChar].color;
    
    // 파일 내부에 캡슐화되어 밀봉된 모델 조립 로직을 꺼내서 실행
    player1 = p1Module.createModel(THREE, p1BaseColor);
    player1.position.set(-10, 0, 0);
    scene.add(player1);

    // [상대방 AI 캐릭터 생성] 난이도 혹은 매칭된 상태에 따라 동적 조립
    let enemyTargetId = 'slayer'; // 예시 타겟
    if (aiDifficulty === 'hard') enemyTargetId = 'guardian';

    const p2Module = CHARACTER_MODULE_MATRIX[enemyTargetId];
    const p2BaseColor = aiDifficulty === 'easy' ? 0xffaa00 : (aiDifficulty === 'normal' ? 0xff3366 : 0xaa00ff);
    
    player2 = p2Module.createModel(THREE, p2BaseColor);
    player2.position.set(10, 0, 0);
    scene.add(player2);
}

// 3. 통합 분기형 스킬 시전 처리기
function useSkill(type) {
    if (landingDelayFrames > 0 || isGrabbed) return;

    // 현재 선택된 캐릭터의 전역 모듈 가져오기
    const currentModule = CHARACTER_MODULE_MATRIX[selectedChar];
    const skillData = currentModule?.skills[type];
    
    // 예외 처리: 캐릭터가 가진 파일 내에 해당 단축키 스킬(예: slash) 로직이 비어있다면 차단
    if (!skillData || !skillData.cast) return; 

    const wData = COMMON_WEAPON_POOL[selectedWeaponIdx]; 
    const runtimeMpCost = Math.floor(skillData.mpCost * wData.mpMod);
    const runtimeDamage = Math.floor(skillData.damage * wData.dmgMult);

    if (p1Stats.mp < runtimeMpCost) return;
    p1Stats.mp -= runtimeMpCost; 
    updateUI();

    // 맵 위치 연산
    p1Center.copy(player1.position).y += 1.1;
    p2Center.copy(player2.position).y += 1.1;
    const toEnemy = new THREE.Vector3().subVectors(p2Center, p1Center).normalize();
    const spawnPos = new THREE.Vector3().copy(p1Center).addScaledVector(toEnemy, 1.5);
    const pMat = new THREE.MeshBasicMaterial({ color: wData.color });

    // 각 파일에 작성해 둔 독자적인 메쉬 생성 메커니즘을 구동
    const projectileInstance = skillData.cast(THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1);
    
    // 글로벌 프레임 갱신 큐에 주입하여 투사체 날리기
    projectileInstance.damage = runtimeDamage;
    projectiles.push(projectileInstance);
}

// 전역 브릿지 허브 연동
window.spawnActiveCharacters = spawnActiveCharacters;
window.useSkill = useSkill;
