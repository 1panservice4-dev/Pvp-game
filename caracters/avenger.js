export const AvengerSkills = {
    id: "avenger",
    // 1. 어벤저만의 독자적인 외형을 생성하는 함수
    createModel: (THREE, baseColor) => {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.4 });
        
        // [어벤저 외형 특징: 날렵함 -> 날씬한 토르소, 긴 팔다리]
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.4), mat); // 날씬하게
        torso.position.y = 1.2; 
        group.add(torso);
        
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), mat);
        head.position.y = 2.0; 
        group.add(head);

        // 뿔이나 어깨 장식 같은 고유 메쉬도 추가 가능
        const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
        hornGeo.rotateX(Math.PI / 4);
        const horn = new THREE.Mesh(hornGeo, new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
        horn.position.set(0, 2.3, 0.2);
        group.add(horn);
        
        // 애니메이션 처리를 위해 메트릭스 바인딩 데이터 반환
        group.userData = { torso, head, materials: [mat] };
        return group;
    },
    skills: { /* 기존 스킬 로직 */ }
};
