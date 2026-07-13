export const GuardianSkills = {
    id: "guardian",
    name: "엘타닌",
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 });
        
        // 듬직하고 거대한 상체와 두꺼운 다리
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.9), mat);
        torso.position.y = 1.1; group.add(torso);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat); // 각진 헬멧 모양
        head.position.y = 1.85; group.add(head);

        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat); lArm.position.set(-1.0, 1.1, 0); group.add(lArm);
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), mat); rArm.position.set(1.0, 1.1, 0); group.add(rArm);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.45), mat); lLeg.position.set(-0.45, 0.4, 0); group.add(lLeg);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.45), mat); rLeg.position.set(0.45, 0.4, 0); group.add(rLeg);

        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: {
        grab: {
            mpCost: 30, damage: 8,
            cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
                // 거대하고 느린 쇠사슬 앵커 컨셉 박스
                const grabGeo = new THREE.BoxGeometry(0.8, 0.8, 3.0);
                const grabMesh = new THREE.Mesh(grabGeo, pMat); grabMesh.position.copy(spawnPos); scene.add(grabMesh);
                return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.4, life: 75 };
            }
        },
        shockwave: {
            mpCost: 40, damage: 30,
            cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1) => {
                // 대지진 컨셉의 거대한 슬로 Shockwave 충격파
                const waveGeo = new THREE.RingGeometry(0.5, 4.0, 32); waveGeo.rotateX(-Math.PI / 2);
                const waveMesh = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
                waveMesh.position.copy(player1.position); waveMesh.position.y = 0.05; scene.add(waveMesh);
                return { type: 'shockwave', mesh: waveMesh, radius: 4.0, life: 50 };
            }
        },
        dagger: { /* ... */ },
        slash: { /* ... */ }
    }
};
