// ========================================
// 게임 데이터 및 상수
// ========================================

let gameData = {
    level: 1,
    exp: 0,
    expMax: 100,
    gold: 50,
    str: 10,
    agi: 10,
    maxHp: 100,
    currentHp: 100,
    weapon: null,
    armor: null,
    inventory: [],
    skillCooldown: 0,
    potions: 3,
    canLevelUp: false
};

// 몬스터 데이터
const monsters = [
    { id: 'goblin', name: '고블린', hp: 50, attack: 8, exp: 25, gold: 10, level: 1 },
    { id: 'orc', name: '오크', hp: 80, attack: 12, exp: 40, gold: 18, level: 2 },
    { id: 'skeleton', name: '해골 전사', hp: 120, attack: 15, exp: 60, gold: 25, level: 3 },
    { id: 'dark_knight', name: '다크 나이트', hp: 200, attack: 25, exp: 100, gold: 50, level: 5 },
    { id: 'shadow_champion', name: '어둠의 챔피언', hp: 500, attack: 40, exp: 300, gold: 200, level: 10 }
];

// 장비 데이터
const equipment = {
    weapons: [
        { id: 'rusty_sword', name: '녹슨 검', attack: 3, price: 50 },
        { id: 'iron_sword', name: '철검', attack: 7, price: 150 },
        { id: 'silver_sword', name: '은검', attack: 12, price: 300 },
        { id: 'magic_sword', name: '마법검', attack: 18, price: 500 }
    ],
    armor: [
        { id: 'leather_armor', name: '가죽 갑옷', defense: 2, price: 40 },
        { id: 'chain_armor', name: '사슬 갑옷', defense: 5, price: 120 },
        { id: 'plate_armor', name: '판금 갑옷', defense: 10, price: 250 },
        { id: 'magic_armor', name: '마법 갑옷', defense: 15, price: 400 }
    ]
};

// 전투 관련 변수
let currentMonster = null;
let playerActionGauge = 0;
let monsterActionGauge = 0;
let isDefending = false;
let combatInterval = null;

// ========================================
// 초기화 및 저장/로드
// ========================================

window.onload = function() {
    loadGame();
    updateContinueButton();
    initializeCanvas();
};

function initializeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 배경 그라디언트
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // 투기장 배경 그리기
    drawArenaBackground(ctx);
}

function drawArenaBackground(ctx) {
    // 모래 바닥
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(0, 500, 800, 100);
    
    // 관중석
    ctx.fillStyle = '#2c3e50';
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(i * 100, 50, 80, 200);
    }
    
    // 횃불
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(100, 300, 10, 30);
    ctx.fillRect(300, 300, 10, 30);
    ctx.fillRect(500, 300, 10, 30);
    ctx.fillRect(700, 300, 10, 30);
    
    // 타이틀
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 24px "Noto Sans KR"';
    ctx.textAlign = 'center';
    ctx.fillText('아르카니아 투기장', 400, 400);
}

function saveGame() {
    try {
        localStorage.setItem('arenaGameData', JSON.stringify(gameData));
    } catch (error) {
        console.log('게임 저장 실패:', error);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('arenaGameData');
        if (saved) {
            const loadedData = JSON.parse(saved);
            gameData = { ...gameData, ...loadedData };
        }
    } catch (error) {
        console.log('게임 로드 실패:', error);
    }
}

function updateContinueButton() {
    const saved = localStorage.getItem('arenaGameData');
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.style.display = saved ? 'inline-block' : 'none';
}

// ========================================
// 화면 전환 및 게임 시작
// ========================================

function startNewGame() {
    gameData = {
        level: 1,
        exp: 0,
        expMax: 100,
        gold: 50,
        str: 10,
        agi: 10,
        maxHp: 100,
        currentHp: 100,
        weapon: null,
        armor: null,
        inventory: [],
        skillCooldown: 0,
        potions: 3,
        canLevelUp: false
    };
    saveGame();
    showLobby();
}

function continueGame() {
    loadGame();
    showLobby();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showLobby() {
    updateUI();
    showScreen('lobby');
}

function showMonsterSelect() {
    const monsterList = document.getElementById('monsterList');
    monsterList.innerHTML = '';
    
    monsters.forEach(monster => {
        if (monster.level <= gameData.level + 2) {
            const div = document.createElement('div');
            div.className = 'monster-item';
            
            // 권장 레벨 표시
            const difficulty = monster.level <= gameData.level ? '쉬움' : 
                             monster.level === gameData.level + 1 ? '보통' : '어려움';
            const difficultyColor = monster.level <= gameData.level ? '#27ae60' : 
                                   monster.level === gameData.level + 1 ? '#f39c12' : '#e74c3c';
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${monster.name}</strong> (레벨 ${monster.level}) 
                        <span style="color: ${difficultyColor}; font-weight: bold;">[${difficulty}]</span><br>
                        HP: ${monster.hp} | 공격력: ${monster.attack}<br>
                        보상: 경험치 ${monster.exp}, 골드 ${monster.gold}
                    </div>
                </div>
            `;
            div.onclick = () => startCombat(monster);
            monsterList.appendChild(div);
        }
    });
    
    showScreen('monsterSelect');
}

function showEquipment() {
    updateEquipmentUI();
    showScreen('equipment');
}

function showShop() {
    updateShopUI();
    showScreen('shop');
}

function showLevelUp() {
    showScreen('levelUp');
}

// ========================================
// UI 업데이트 함수들
// ========================================

function updateUI() {
    document.getElementById('playerLevel').textContent = gameData.level;
    document.getElementById('playerExp').textContent = gameData.exp;
    document.getElementById('playerExpMax').textContent = gameData.expMax;
    document.getElementById('playerGold').textContent = gameData.gold;
    document.getElementById('playerMaxHp').textContent = gameData.maxHp;
    document.getElementById('playerStr').textContent = gameData.str;
    document.getElementById('playerAgi').textContent = gameData.agi;
    
    document.getElementById('levelUpBtn').style.display = gameData.canLevelUp ? 'inline-block' : 'none';
}

function updateEquipmentUI() {
    const weaponInfo = gameData.weapon ? 
        `${gameData.weapon.name} (+${gameData.weapon.attack} 공격력)` : '없음';
    const armorInfo = gameData.armor ? 
        `${gameData.armor.name} (+${gameData.armor.defense} 방어력)` : '없음';
    
    document.getElementById('weaponInfo').textContent = weaponInfo;
    document.getElementById('armorInfo').textContent = armorInfo;
    
    const weaponSlot = document.getElementById('weaponSlot');
    const armorSlot = document.getElementById('armorSlot');
    
    weaponSlot.className = gameData.weapon ? 'equipment-slot equipped' : 'equipment-slot';
    armorSlot.className = gameData.armor ? 'equipment-slot equipped' : 'equipment-slot';
    
    // 장착 해제 기능
    weaponSlot.onclick = gameData.weapon ? () => unequipItem('weapon') : null;
    armorSlot.onclick = gameData.armor ? () => unequipItem('armor') : null;
    
    // 인벤토리 업데이트
    const inventory = document.getElementById('inventory');
    inventory.innerHTML = '';
    
    if (gameData.inventory.length === 0) {
        inventory.innerHTML = '<div style="text-align: center; color: #888;">인벤토리가 비어있습니다</div>';
    } else {
        gameData.inventory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            
            const isWeapon = equipment.weapons.find(w => w.id === item.id);
            const stat = isWeapon ? `+${item.attack} 공격력` : `+${item.defense} 방어력`;
            
            div.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${stat}</small>
                </div>
                <button class="btn" style="margin: 0; padding: 5px 10px; font-size: 12px;" 
                        onclick="equipItem(gameData.inventory[${index}], ${index})">장착</button>
            `;
            inventory.appendChild(div);
        });
    }
}

function updateShopUI() {
    document.getElementById('shopGold').textContent = gameData.gold;
    
    const shopItems = document.getElementById('shopItems');
    shopItems.innerHTML = '';
    
    // 무기 판매
    equipment.weapons.forEach(weapon => {
        if (!gameData.weapon || gameData.weapon.id !== weapon.id) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-info">
                    <strong>${weapon.name}</strong><br>
                    <small>+${weapon.attack} 공격력</small>
                </div>
                <div class="shop-item-price">${weapon.price}G</div>
                <button class="btn" style="margin: 0; padding: 5px 10px; font-size: 12px;" 
                        onclick="buyItem(equipment.weapons.find(w => w.id === '${weapon.id}'), 'weapon')">구매</button>
            `;
            shopItems.appendChild(div);
        }
    });
    
    // 방어구 판매
    equipment.armor.forEach(armor => {
        if (!gameData.armor || gameData.armor.id !== armor.id) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <div class="shop-item-info">
                    <strong>${armor.name}</strong><br>
                    <small>+${armor.defense} 방어력</small>
                </div>
                <div class="shop-item-price">${armor.price}G</div>
                <button class="btn" style="margin: 0; padding: 5px 10px; font-size: 12px;" 
                        onclick="buyItem(equipment.armor.find(a => a.id === '${armor.id}'), 'armor')">구매</button>
            `;
            shopItems.appendChild(div);
        }
    });
    
    // 치유 물약 판매
    const potionDiv = document.createElement('div');
    potionDiv.className = 'shop-item';
    potionDiv.innerHTML = `
        <div class="shop-item-info">
            <strong>치유 물약</strong><br>
            <small>HP 50 회복</small>
        </div>
        <div class="shop-item-price">20G</div>
        <button class="btn" style="margin: 0; padding: 5px 10px; font-size: 12px;" 
                onclick="buyPotion()">구매</button>
    `;
    shopItems.appendChild(potionDiv);
}

function updateCombatUI() {
    if (!currentMonster) return;
    
    document.getElementById('monsterName').textContent = currentMonster.name;
    document.getElementById('monsterHp').textContent = Math.max(0, currentMonster.currentHp);
    document.getElementById('monsterMaxHp').textContent = currentMonster.hp;
    document.getElementById('combatPlayerHp').textContent = Math.max(0, gameData.currentHp);
    document.getElementById('combatPlayerMaxHp').textContent = gameData.maxHp;
    document.getElementById('potionCount').textContent = gameData.potions;
    
    // HP 바 업데이트
    const monsterHpPercent = Math.max(0, (currentMonster.currentHp / currentMonster.hp) * 100);
    const playerHpPercent = Math.max(0, (gameData.currentHp / gameData.maxHp) * 100);
    const actionPercent = Math.min(100, playerActionGauge);
    
    document.getElementById('monsterHpBar').style.width = monsterHpPercent + '%';
    document.getElementById('playerHpBar').style.width = playerHpPercent + '%';
    document.getElementById('playerActionBar').style.width = actionPercent + '%';
    
    // 버튼 상태 업데이트
    const canAct = playerActionGauge >= 100;
    document.getElementById('attackBtn').disabled = !canAct;
    document.getElementById('defendBtn').disabled = !canAct;
    document.getElementById('skillBtn').disabled = !canAct || gameData.skillCooldown > 0;
    
    // 스킬 쿨다운 표시
    const skillBtn = document.getElementById('skillBtn');
    if (gameData.skillCooldown > 0) {
        const cooldownSeconds = Math.ceil(gameData.skillCooldown / 10);
        skillBtn.textContent = `그림자 일격 (${cooldownSeconds}s)`;
    } else {
        skillBtn.textContent = '그림자 일격';
    }
}

// ========================================
// 전투 시스템
// ========================================

function startCombat(monster) {
    currentMonster = {
        ...monster,
        currentHp: monster.hp
    };
    
    gameData.currentHp = gameData.maxHp;
    playerActionGauge = 0;
    monsterActionGauge = 0;
    isDefending = false;
    
    // 전투 로그 초기화
    document.getElementById('combatLog').innerHTML = '';
    
    updateCombatUI();
    showScreen('combat');
    
    addCombatLog(`${monster.name}과의 전투가 시작됩니다!`);
    addCombatLog(`적의 정보: HP ${monster.hp}, 공격력 ${monster.attack}`);
    
    combatInterval = setInterval(updateCombat, 100);
}

function updateCombat() {
    if (!currentMonster || currentMonster.currentHp <= 0 || gameData.currentHp <= 0) {
        return;
    }
    
    // 게이지 증가 (민첩에 따라 플레이어 게이지 속도 변화)
    playerActionGauge += 2 + gameData.agi * 0.1;
    monsterActionGauge += 2 + currentMonster.level * 0.05;
    
    // 스킬 쿨다운 감소
    if (gameData.skillCooldown > 0) {
        gameData.skillCooldown--;
    }
    
    // 몬스터 행동
    if (monsterActionGauge >= 100) {
        monsterAction();
        monsterActionGauge = 0;
    }
    
    updateCombatUI();
}

function playerAttack() {
    if (playerActionGauge < 100) return;
    
    const baseAttack = 5 + gameData.str;
    const weaponAttack = gameData.weapon ? gameData.weapon.attack : 0;
    const criticalChance = 0.1 + gameData.agi * 0.01;
    const isCritical = Math.random() < criticalChance;
    
    let damage = baseAttack + weaponAttack;
    if (isCritical) {
        damage = Math.floor(damage * 1.5);
        addCombatLog(`크리티컬 히트! ${damage} 데미지를 입혔습니다!`);
    } else {
        addCombatLog(`${damage} 데미지를 입혔습니다!`);
    }
    
    currentMonster.currentHp -= damage;
    playerActionGauge = 0;
    isDefending = false;
    
    checkCombatEnd();
}

function playerDefend() {
    if (playerActionGauge < 100) return;
    
    isDefending = true;
    addCombatLog('방어 자세를 취했습니다. 다음 공격의 데미지가 크게 감소합니다.');
    playerActionGauge = 0;
}

function playerSkill() {
    if (playerActionGauge < 100 || gameData.skillCooldown > 0) return;
    
    const baseSkillAttack = 15 + gameData.str * 2;
    const weaponAttack = gameData.weapon ? gameData.weapon.attack * 2 : 0;
    const damage = baseSkillAttack + weaponAttack;
    
    currentMonster.currentHp -= damage;
    addCombatLog(`그림자 일격! 강력한 어둠의 힘으로 ${damage} 데미지를 입혔습니다!`);
    
    gameData.skillCooldown = 50; // 5초 쿨타임
    playerActionGauge = 0;
    isDefending = false;
    
    checkCombatEnd();
}

function usePotion() {
    if (gameData.potions <= 0) return;
    
    const heal = Math.min(50, gameData.maxHp - gameData.currentHp);
    if (heal > 0) {
        gameData.currentHp += heal;
        gameData.potions--;
        addCombatLog(`치유 물약을 사용해 ${heal} HP를 회복했습니다.`);
        updateCombatUI();
    } else {
        addCombatLog('이미 체력이 가득합니다.');
    }
}

function monsterAction() {
    const baseAttack = currentMonster.attack;
    const damage = Math.floor(baseAttack * (0.8 + Math.random() * 0.4));
    
    let finalDamage = damage;
    
    // 방어 중일 때 데미지 감소
    if (isDefending) {
        finalDamage = Math.floor(damage * 0.3);
        addCombatLog(`${currentMonster.name}의 공격을 방어했습니다!`);
    }
    
    // 방어구 적용
    const defense = gameData.armor ? gameData.armor.defense : 0;
    finalDamage = Math.max(1, finalDamage - defense);
    
    gameData.currentHp -= finalDamage;
    addCombatLog(`${currentMonster.name}의 공격! ${finalDamage} 데미지를 받았습니다!`);
    
    isDefending = false;
    checkCombatEnd();
}

function checkCombatEnd() {
    if (currentMonster.currentHp <= 0) {
        // 승리
        clearInterval(combatInterval);
        addCombatLog(`${currentMonster.name}을 처치했습니다!`);
        
        gameData.exp += currentMonster.exp;
        gameData.gold += currentMonster.gold;
        
        // 레벨업 체크
        if (gameData.exp >= gameData.expMax) {
            gameData.canLevelUp = true;
            addCombatLog('레벨업 가능! 로비에서 스탯을 배분하세요.');
        }
        
        // 장비 드롭 (15% 확률)
        if (Math.random() < 0.15) {
            dropEquipment();
        }
        
        // 물약 드롭 (25% 확률)
        if (Math.random() < 0.25) {
            gameData.potions++;
            addCombatLog('치유 물약을 발견했습니다!');
        }
        
        addCombatLog(`경험치 ${currentMonster.exp}, 골드 ${currentMonster.gold}를 획득했습니다!`);
        
        // 최종 보스 처치 시
        if (currentMonster.id === 'shadow_champion') {
            addCombatLog('축하합니다! 어둠의 챔피언을 물리치고 왕국의 심장석을 되찾았습니다!');
            addCombatLog('아르카니아 왕국의 재건이 시작됩니다!');
        }
        
        saveGame();
        
        setTimeout(() => {
            showLobby();
        }, 3000);
        
    } else if (gameData.currentHp <= 0) {
        // 패배
        clearInterval(combatInterval);
        addCombatLog('패배했습니다... 하지만 포기하지 마세요!');
        gameData.currentHp = Math.floor(gameData.maxHp * 0.1); // 10% HP로 부활
        gameData.gold = Math.floor(gameData.gold * 0.8); // 골드 20% 손실
        
        addCombatLog('투기장 치료사가 응급처치를 해주었습니다.');
        addCombatLog(`골드 ${Math.floor(gameData.gold * 0.2)}를 치료비로 지불했습니다.`);
        
        saveGame();
        
        setTimeout(() => {
            showLobby();
        }, 3000);
    }
}

function dropEquipment() {
    const playerLevel = gameData.level;
    let availableEquipment = [];
    
    // 플레이어 레벨에 맞는 장비 필터링
    equipment.weapons.forEach(weapon => {
        if (weapon.price <= playerLevel * 100) {
            availableEquipment.push(weapon);
        }
    });
    
    equipment.armor.forEach(armor => {
        if (armor.price <= playerLevel * 100) {
            availableEquipment.push(armor);
        }
    });
    
    if (availableEquipment.length > 0) {
        const randomItem = availableEquipment[Math.floor(Math.random() * availableEquipment.length)];
        gameData.inventory.push({...randomItem});
        addCombatLog(`${randomItem.name}을(를) 획득했습니다!`);
    }
}

function addCombatLog(message) {
    const log = document.getElementById('combatLog');
    const div = document.createElement('div');
    div.textContent = `> ${message}`;
    div.style.marginBottom = '5px';
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

// ========================================
// 장비 및 상점 시스템
// ========================================

function buyItem(item, type) {
    if (gameData.gold >= item.price) {
        gameData.gold -= item.price;
        gameData.inventory.push({...item});
        showNotification(`${item.name}을(를) 구매했습니다!`);
        updateShopUI();
        saveGame();
    } else {
        showNotification('골드가 부족합니다!');
    }
}

function buyPotion() {
    if (gameData.gold >= 20) {
        gameData.gold -= 20;
        gameData.potions++;
        showNotification('치유 물약을 구매했습니다!');
        updateShopUI();
        saveGame();
    } else {
        showNotification('골드가 부족합니다!');
    }
}

function equipItem(item, index) {
    const isWeapon = equipment.weapons.find(w => w.id === item.id);
    
    if (isWeapon) {
        if (gameData.weapon) {
            gameData.inventory.push(gameData.weapon);
        }
        gameData.weapon = item;
        showNotification(`${item.name}을(를) 장착했습니다!`);
    } else {
        if (gameData.armor) {
            gameData.inventory.push(gameData.armor);
        }
        gameData.armor = item;
        showNotification(`${item.name}을(를) 장착했습니다!`);
    }
    
    gameData.inventory.splice(index, 1);
    updateEquipmentUI();
    saveGame();
}

function unequipItem(type) {
    if (type === 'weapon' && gameData.weapon) {
        gameData.inventory.push(gameData.weapon);
        showNotification(`${gameData.weapon.name}을(를) 해제했습니다.`);
        gameData.weapon = null;
    } else if (type === 'armor' && gameData.armor) {
        gameData.inventory.push(gameData.armor);
        showNotification(`${gameData.armor.name}을(를) 해제했습니다.`);
        gameData.armor = null;
    }
    
    updateEquipmentUI();
    saveGame();
}

// ========================================
// 레벨업 시스템
// ========================================

function addStat(stat) {
    if (!gameData.canLevelUp) return;
    
    if (stat === 'str') {
        gameData.str++;
        showNotification('힘이 1 증가했습니다!');
    } else if (stat === 'agi') {
        gameData.agi++;
        showNotification('민첩이 1 증가했습니다!');
    } else if (stat === 'hp') {
        gameData.maxHp += 10;
        gameData.currentHp += 10;
        showNotification('최대 HP가 10 증가했습니다!');
    }
    
    gameData.level++;
    gameData.exp -= gameData.expMax;
    gameData.expMax = Math.floor(gameData.expMax * 1.2);
    gameData.canLevelUp = false;
    
    saveGame();
    showLobby();
}

// ========================================
// 유틸리티 함수들
// ========================================

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ========================================
// 키보드 단축키 (선택사항)
// ========================================

document.addEventListener('keydown', function(event) {
    // 전투 중에만 키보드 단축키 활성화
    if (document.getElementById('combat').classList.contains('active')) {
        switch(event.key) {
            case '1':
                playerAttack();
                break;
            case '2':
                playerDefend();
                break;
            case '3':
                playerSkill();
                break;
            case '4':
                usePotion();
                break;
        }
    }
});
