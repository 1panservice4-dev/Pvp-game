export const GuardianSkills = {
    id: "guardian", name: "가디언",
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.9), mat); torso.position.y = 1.1; group.add(torso);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat); head.position.y = 1.85; group.add(head);
        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: {
        grab: { mpCost: 30, damage: 8, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const grabGeo = new THREE.BoxGeometry(0.8, 0.8, 3.0); const grabMesh = new THREE.Mesh(grabGeo, pMat);
            grabMesh.position.copy(spawnPos); scene.add(grabMesh);
            return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.4, life: 80 };
        }},
        dagger: { mpCost: 20, damage: 25, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const daggerGeo = new THREE.SphereGeometry(0.6, 8, 8); const daggerMesh = new THREE.Mesh(daggerGeo, pMat);
            daggerMesh.position.copy(spawnPos); scene.add(daggerMesh);
            return { type: 'dagger', mesh: daggerMesh, dir: toEnemy, speed: 0.55, life: 70 };
        }},
        slash: { mpCost: 40, damage: 35, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center) => {
            const slashGeo = new THREE.BoxGeometry(3, 0.4, 3); const slashMesh = new THREE.Mesh(slashGeo, pMat);
            slashMesh.position.copy(spawnPos); slashMesh.lookAt(p2Center); scene.add(slashMesh);
            return { type: 'slash', mesh: slashMesh, dir: toEnemy, speed: 0.35, life: 60 };
        }},
        shockwave: { mpCost: 40, damage: 30, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1) => {
            const waveGeo = new THREE.RingGeometry(0.5, 4.0, 32); waveGeo.rotateX(-Math.PI / 2);
            const waveMesh = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
            waveMesh.position.copy(player1.position); waveMesh.position.y = 0.05; scene.add(waveMesh);
            return { type: 'shockwave', mesh: waveMesh, radius: 4.0, life: 50 };
        }}
    }
};
