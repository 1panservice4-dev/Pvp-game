export const SlayerSkills = {
    id: "slayer",
    name: "노라",
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.2, metalness: 0.5 });
        
        // 매우 왜소하고 날카로운 신체
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.3), mat);
        torso.position.y = 1.0; group.add(torso);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mat);
        head.position.y = 1.7; group.add(head);

        // 고유 장식: 양 어깨의 날카로운 스파이크(가시)
        const spikeGeo = new THREE.ConeGeometry(0.08, 0.3, 4); spikeGeo.rotateX(-Math.PI/2);
        const lSpike = new THREE.Mesh(spikeGeo, mat); lSpike.position.set(-0.4, 1.4, 0); group.add(lSpike);
        const rSpike = new THREE.Mesh(spikeGeo, mat); rSpike.position.set(0.4, 1.4, 0); group.add(rSpike);

        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), mat); lArm.position.set(-0.4, 1.0, 0); group.add(lArm);
        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.18), mat); rArm.position.set(0.4, 1.0, 0); group.add(rArm);
        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mat); lLeg.position.set(-0.18, 0.4, 0); group.add(lLeg);
        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), mat); rLeg.position.set(0.18, 0.4, 0); group.add(rLeg);

        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: {
        grab: {
            mpCost: 25, damage: 15,
            cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
                // 슬레이어만의 뾰족한 송곳 모양 포획선
                const grabGeo = new THREE.ConeGeometry(0.2, 5, 4); grabGeo.rotateX(Math.PI / 2);
                const grabMesh = new THREE.Mesh(grabGeo, pMat); grabMesh.position.copy(spawnPos); scene.add(grabMesh);
                return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.8, life: 45 };
            }
        },
        dagger: {
            mpCost: 10, damage: 12,
            cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
                // 초고속 단도 투척
                const daggerGeo = new THREE.BoxGeometry(0.1, 0.1, 2.0);
                const daggerMesh = new THREE.Mesh(daggerGeo, pMat); daggerMesh.position.copy(spawnPos); daggerMesh.lookAt(p2Center); scene.add(daggerMesh);
                return { type: 'dagger', mesh: daggerMesh, dir: toEnemy, speed: 1.1, life: 50 };
            }
        },
        slash: { /* 슬레이어 고유 연출 구성 가능 */ },
        shockwave: { /* ... */ }
    }
};
