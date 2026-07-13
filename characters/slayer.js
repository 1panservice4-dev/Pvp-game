export const SlayerSkills = {
    id: "slayer", name: "슬레이어",
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.2, metalness: 0.5 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.3), mat); torso.position.y = 1.0; group.add(torso);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mat); head.position.y = 1.7; group.add(head);
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), mat); spike.position.set(0.3, 1.3, 0); group.add(spike);
        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: {
        grab: { mpCost: 25, damage: 15, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const grabGeo = new THREE.ConeGeometry(0.15, 5, 4); grabGeo.rotateX(Math.PI / 2);
            const grabMesh = new THREE.Mesh(grabGeo, pMat); grabMesh.position.copy(spawnPos); scene.add(grabMesh);
            return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.8, life: 45 };
        }},
        dagger: { mpCost: 10, damage: 12, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const daggerGeo = new THREE.BoxGeometry(0.1, 0.1, 2.5);
            const daggerMesh = new THREE.Mesh(daggerGeo, pMat); daggerMesh.position.copy(spawnPos); scene.add(daggerMesh);
            return { type: 'dagger', mesh: daggerMesh, dir: toEnemy, speed: 1.1, life: 50 };
        }},
        slash: { mpCost: 25, damage: 20, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center) => {
            const slashGeo = new THREE.RingGeometry(0.5, 3.5, 32); const slashMesh = new THREE.Mesh(slashGeo, pMat);
            slashMesh.position.copy(spawnPos); slashMesh.lookAt(p2Center); scene.add(slashMesh);
            return { type: 'slash', mesh: slashMesh, dir: toEnemy, speed: 0.5, life: 45 };
        }},
        shockwave: { mpCost: 20, damage: 15, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1) => {
            const waveGeo = new THREE.RingGeometry(0.2, 1.5, 32); const waveMesh = new THREE.Mesh(waveGeo, pMat);
            waveMesh.position.copy(player1.position); waveMesh.position.y = 0.05; scene.add(waveMesh);
            return { type: 'shockwave', mesh: waveMesh, radius: 1.5, life: 25 };
        }}
    }
};
