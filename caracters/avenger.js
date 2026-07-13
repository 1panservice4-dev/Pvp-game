export const AvengerSkills = {
    id: "avenger",
    name: "네리아",
    // 1. 어벤저만의 날렵한 고유 외형 조립
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.4 });
        
        // 날씬한 상체와 긴 팔다리
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.4), mat);
        torso.position.y = 1.2; 
        group.add(torso);
        
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), mat);
        head.position.y = 2.0; 
        group.add(head);

        // 고유 장식: 머리 위의 노란 뿔
        const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
        hornGeo.rotateX(Math.PI / 4);
        const horn = new THREE.Mesh(hornGeo, new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        horn.position.set(0, 2.3, 0.2);
        group.add(horn);
        
        // 기본 팔다리 생성
        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), mat); lArm.position.set(-0.55, 1.2, 0); group.add(lArm);
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), mat); rArm.position.set(0.55, 1.2, 0); group.add(rArm);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.22), mat); lLeg.position.set(-0.2, 0.5, 0); group.add(lLeg);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.22), mat); rLeg.position.set(0.2, 0.5, 0); group.add(rLeg);

        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    // 2. 어벤저 전용 스킬 시전 함수 맵
    skills: {
        grab: {
            mpCost: 20, damage: 10,
            cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
                const grabGeo = new THREE.CylinderGeometry(0.25, 0.25, 6, 16); grabGeo.rotateX(Math.PI / 2);
                const grabMesh = new THREE.Mesh(grabGeo, pMat); grabMesh.position.copy(spawnPos); scene.add(grabMesh);
                return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.6, life: 60 };
            }
        },
        dagger: {
            mpCost: 15, damage: 15,
            cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
                const daggerGeo = new THREE.ConeGeometry(0.4, 2.2, 16); daggerGeo.rotateX(Math.PI / 2);
                const daggerMesh = new THREE.Mesh(daggerGeo, pMat); daggerMesh.position.copy(spawnPos); scene.add(daggerMesh);
                return { type: 'dagger', mesh: daggerMesh, dir: toEnemy, speed: 0.75, life: 60 };
            }
        },
        slash: {
            mpCost: 30, damage: 25,
            cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center) => {
                const slashGeo = new THREE.RingGeometry(1.2, 4.5, 32, 1, 0, Math.PI); slashGeo.rotateX(-Math.PI / 3.5);
                const slashMesh = new THREE.Mesh(slashGeo, new THREE.MeshBasicMaterial({ color: pMat.color, side: THREE.DoubleSide }));
                slashMesh.position.copy(spawnPos); slashMesh.lookAt(p2Center); scene.add(slashMesh);
                return { type: 'slash', mesh: slashMesh, dir: toEnemy, speed: 0.38, life: 60 };
            }
        },
        shockwave: {
            mpCost: 25, damage: 20,
            cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1) => {
                const waveGeo = new THREE.RingGeometry(0.5, 2.0, 32); waveGeo.rotateX(-Math.PI / 2);
                const waveMesh = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({ color: pMat.color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
                waveMesh.position.copy(player1.position); waveMesh.position.y = 0.05; scene.add(waveMesh);
                return { type: 'shockwave', mesh: waveMesh, radius: 2.0, life: 35 };
            }
        }
    }
};
