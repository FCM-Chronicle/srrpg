// 게임 데이터 정의

// 지역 데이터
const AREAS = {
    shelter: {
        name: "고요한 쉼터",
        description: "마지막 남은 안전한 정착지입니다. 상인과 대화하거나 다른 지역으로 이동할 수 있습니다.",
        actions: [
            { id: "shop", text: "상인과 거래하기", type: "shop" },
            { id: "rest", text: "휴식하기 (HP 회복)", type: "rest" },
            { id: "forest", text: "버려진 숲으로 가기", type: "travel", target: "forest" },
            { id: "ruins", text: "고대의 유적으로 가기", type: "travel", target: "ruins", requirement: { type: "level", value: 3 } }
        ]
    },
    forest: {
        name: "버려진 숲",
        description: "한때 아름다웠지만 이제는 위험한 몬스터들이 돌아다니는 숲입니다. 경험치와 아이템을 얻을 수 있습니다.",
        actions: [
            { id: "explore", text: "숲을 탐험하기", type: "explore" },
            { id: "hunt", text: "몬스터 사냥하기", type: "combat", enemies: ["slime", "wolf", "spider"] },
            { id: "boss", text: "숲의 수호자 도전", type: "combat", enemies: ["forestGuardian"], requirement: { type: "level", value: 5 } },
            { id: "return", text: "고요한 쉼터로 돌아가기", type: "travel", target: "shelter" }
        ]
    },
    ruins: {
        name: "고대의 유적",
        description: "잊혀진 문명의 흔적이 남아있는 신비로운 유적지입니다. 강력한 몬스터와 귀중한 보물이 기다리고 있습니다.",
        actions: [
            { id: "explore", text: "유적을 조사하기", type: "explore" },
            { id: "hunt", text: "유적 몬스터와 전투", type: "combat", enemies: ["skeleton", "ghost", "golem"] },
            { id: "boss", text: "유적의 수호자 도전", type: "combat", enemies: ["ruinsGuardian"], requirement: { type: "level", value: 8 } },
            { id: "artifact", text: "마법 유물 탐색", type: "quest", requirement: { type: "level", value: 10 } },
            { id: "return", text: "고요한 쉼터로 돌아가기", type: "travel", target: "shelter" }
        ]
    }
};

// 몬스터 데이터
const MONSTERS = {
    slime: {
        name: "슬라임",
        hp: 50,
        maxHP: 50,
        attack: 8,
        exp: 15,
        gold: 10,
        dropRate: 0.3,
        drops: ["healingPotion"]
    },
    wolf: {
        name: "늑대",
        hp: 80,
        maxHP: 80,
        attack: 12,
        exp: 25,
        gold: 15,
        dropRate: 0.4,
        drops: ["ironSword", "leatherArmor"]
    },
    spider: {
        name: "독거미",
        hp: 60,
        maxHP: 60,
        attack: 15,
        exp: 30,
        gold: 20,
        dropRate: 0.3,
        drops: ["poisonAntidote", "healingPotion"]
    },
    skeleton: {
        name: "해골병사",
        hp: 120,
        maxHP: 120,
        attack: 20,
        exp: 50,
        gold: 30,
        dropRate: 0.5,
        drops: ["steelSword", "boneShield"]
    },
    ghost: {
        name: "유령",
        hp: 100,
        maxHP: 100,
        attack: 25,
        exp: 60,
        gold: 35,
        dropRate: 0.4,
        drops: ["magicRobe", "manaPotion"]
    },
    golem: {
        name: "석골렘",
        hp: 200,
        maxHP: 200,
        attack: 30,
        exp: 80,
        gold: 50,
        dropRate: 0.6,
        drops: ["steelArmor", "strengthPotion"]
    },
    forestGuardian: {
        name: "숲의 수호자",
        hp: 300,
        maxHP: 300,
        attack: 35,
        exp: 150,
        gold: 100,
        dropRate: 0.8,
        drops: ["guardianSword", "forestCloak"],
        boss: true
    },
    ruinsGuardian: {
        name: "유적의 수호자",
        hp: 500,
        maxHP: 500,
        attack: 50,
        exp: 250,
        gold: 200,
        dropRate: 0.9,
        drops: ["ancientSword", "ruinsArmor", "magicOrb"],
        boss: true
    }
};

// 아이템 데이터
const ITEMS = {
    // 무기
    ironSword: {
        name: "철 검",
        type: "weapon",
        attack: 10,
        price: 50,
        description: "기본적인 철제 검입니다."
    },
    steelSword: {
        name: "강철 검",
        type: "weapon",
        attack: 20,
        price: 100,
        description: "단단한 강철로 만든 검입니다."
    },
    guardianSword: {
        name: "수호자의 검",
        type: "weapon",
        attack: 35,
        price: 200,
        description: "숲의 수호자가 사용하던 신성한 검입니다."
    },
    ancientSword: {
        name: "고대의 검",
        type: "weapon",
        attack: 50,
        price: 500,
        description: "고대 문명의 기술로 만들어진 전설의 검입니다."
    },

    // 방어구
    leatherArmor: {
        name: "가죽 갑옷",
        type: "armor",
        defense: 8,
        price: 40,
        description: "가볍고 유연한 가죽 갑옷입니다."
    },
    steelArmor: {
        name: "강철 갑옷",
        type: "armor",
        defense: 15,
        price: 80,
        description: "견고한 강철로 만든 갑옷입니다."
    },
    forestCloak: {
        name: "숲의 망토",
        type: "armor",
        defense: 20,
        price: 150,
        description: "자연의 힘이 깃든 신비로운 망토입니다."
    },
    ruinsArmor: {
        name: "유적의 갑옷",
        type: "armor",
        defense: 30,
        price: 300,
        description: "고대 유적에서 발견된 마법의 갑옷입니다."
    },
    magicRobe: {
        name: "마법 로브",
        type: "armor",
        defense: 12,
        price: 90,
        description: "마법사가 입던 신비로운 로브입니다."
    },

    // 방패
    boneShield: {
        name: "뼈 방패",
        type: "shield",
        defense: 10,
        price: 60,
        description: "단단한 뼈로 만든 방패입니다."
    },

    //
