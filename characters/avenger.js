export const AvengerSkills = {
    id: "avenger", name: "어벤저",
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.4 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.4), mat); torso.position.y = 1.2; group.add(torso);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), mat); head.position.y = 2.0; group.add(head);
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        horn.rotateX(Math.PI / 4); horn.position.set(0, 2.3, 0.2); group.add(horn);
        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: {
        grab: { mpCost: 20, damage: 10, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const grabGeo = new THREE.CylinderGeometry(0.25, 0.25, 6, 16); grabGeo.rotateX(Math.PI / 2);
            const grabMesh = new THREE.Mesh(grabGeo, pMat); grabMesh.position.copy(spawnPos); scene.add(grabMesh);
            return { type: 'grab', mesh: grabMesh, dir: toEnemy, speed: 0.6, life: 60 };
        }},
        dagger: { mpCost: 15, damage: 15, cast: (THREE, scene, spawnPos, toEnemy, pMat) => {
            const daggerGeo = new THREE.ConeGeometry(0.4, 2.2, 16); daggerGeo.rotateX(Math.PI / 2);
            const daggerMesh = new THREE.Mesh(daggerGeo, pMat); daggerMesh.position.copy(spawnPos); scene.add(daggerMesh);
            return { type: 'dagger', mesh: daggerMesh, dir: toEnemy, speed: 0.75, life: 60 };
        }},
        slash: { mpCost: 30, damage: 25, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center) => {
            const slashGeo = new THREE.RingGeometry(1.2, 4.5, 32, 1, 0, Math.PI); slashGeo.rotateX(-Math.PI / 3.5);
            const slashMesh = new THREE.Mesh(slashGeo, new THREE.MeshBasicMaterial({ color: pMat.color, side: THREE.DoubleSide }));
            slashMesh.position.copy(spawnPos); slashMesh.lookAt(p2Center); scene.add(slashMesh);
            return { type: 'slash', mesh: slashMesh, dir: toEnemy, speed: 0.38, life: 60 };
        }},
        shockwave: { mpCost: 25, damage: 20, cast: (THREE, scene, spawnPos, toEnemy, pMat, p2Center, player1) => {
            const waveGeo = new THREE.RingGeometry(0.5, 2.0, 32); waveGeo.rotateX(-Math.PI / 2);
            const waveMesh = new THREE.Mesh(waveGeo, new THREE.MeshBasicMaterial({ color: pMat.color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
            waveMesh.position.copy(player1.position); waveMesh.position.y = 0.05; scene.add(waveMesh);
            return { type: 'shockwave', mesh: waveMesh, radius: 2.0, life: 35 };
        }}
    }
};
