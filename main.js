// 메인 게임 컨트롤러

class GameController {
    constructor() {
        this.gameLogic = new GameLogic();
        this.currentMode = 'exploration';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showMainMenu();
    }

    // 이벤트 바인딩
    bindEvents() {
        // 메인 메뉴
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('loadGameBtn').addEventListener('click', () => this.loadGame());

        // UI 버튼들
        document.getElementById('inventoryBtn').addEventListener('click', () => this.showInventory());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMainMenu());

        // 모달 닫기
        document.getElementById('closeInventoryBtn').addEventListener('click', () => this.hideModal('inventoryModal'));
        document.getElementById('closeStatsBtn').addEventListener('click', () => this.hideModal('statsModal'));
        document.getElementById('confirmLevelUpBtn').addEventListener('click', () => this.hideModal('levelUpModal'));

        // 전투 버튼들
        document.getElementById('attackBtn').addEventListener('click', () => this.playerAttack());
        document.getElementById('dodgeBtn').addEventListener('click', () => this.playerDodge());
        document.getElementById('runBtn').addEventListener('click', () => this.runFromCombat());

        // 상점 나가기
        document.getElementById('leaveShopBtn').addEventListener('click', () => this.switchMode('exploration'));

        // 스탯 업 버튼들
        document.querySelectorAll('.stat-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stat = e.target.getAttribute('data-stat');
                this.increaseStat(stat);
            });
        });
    }

    // 새 게임 시작
    startNewGame() {
        this.gameLogic = new GameLogic();
        this.showGameScreen();
        this.updateUI();
        this.updateArea();
    }

    // 게임 로드
    loadGame() {
        if (this.gameLogic.loadGame()) {
            this.showGameScreen();
            this.updateUI();
            this.updateArea();
            this.showMessage('게임을 불러왔습니다.');
        } else {
            this.showMessage('저장된 게임이 없습니다.');
        }
    }

    // 게임 저장
    saveGame() {
        if (this.gameLogic.saveGame()) {
            this.showMessage('게임이 저장되었습니다.');
        } else {
            this.showMessage('게임 저장에 실패했습니다.');
        }
    }

    // 화면 전환
    showMainMenu() {
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('gameScreen').classList.add('hidden');
    }

    showGameScreen() {
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
    }

    // 모드 전환
    switchMode(mode) {
        const modes = ['exploration', 'combat', 'shop'];
        modes.forEach(m => {
            const element = document.getElementById(`${m}Mode`);
            if (m === mode) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
        this.currentMode = mode;

        if (mode === 'exploration') {
            this.updateArea();
        } else if (mode === 'shop') {
            this.updateShop();
        }
    }

    // UI 업데이트
    updateUI() {
        const player = this.gameLogic.getGameState().player;
        const stats = this.gameLogic.getPlayerStats();

        // 상단 UI 업데이트
        document.getElementById('playerLevel').textContent = player.level;
        document.getElementById('playerHP').textContent = player.hp;
        document.getElementById('playerMaxHP').textContent = player.maxHP;
        document.getElementById('playerEXP').textContent = player.exp;
        document.getElementById('playerMaxEXP').textContent = player.maxEXP;
        document.getElementById('currentLocation').textContent = this.gameLogic.getCurrentArea().name;

        // 스탯 모달 업데이트
        document.getElementById('playerStrength').textContent = player.strength;
        document.getElementById('playerAgility').textContent = player.agility;
        document.getElementById('playerVitality').textContent = player.vitality;
        document.getElementById('playerAttack').textContent = stats.attack;
        document.getElementById('playerDodgeRate').textContent = stats.dodgeRate;
        document.getElementById('maxHPDisplay').textContent = player.maxHP;
        document.getElementById('playerGold').textContent = player.gold;
        document.getElementById('statPoints').textContent = player.statPoints;

        // 스탯 업 버튼 표시/숨김
        const statUpButtons = document.getElementById('statUpButtons');
        if (player.statPoints > 0) {
            statUpButtons.classList.remove('hidden');
        } else {
            statUpButtons.classList.add('hidden');
        }
    }

    // 지역 업데이트
    updateArea() {
        const area = this.gameLogic.getCurrentArea();
        document.getElementById('areaTitle').textContent = area.name;
        document.getElementById('areaDescription').textContent = area.description;

        const buttonsContainer = document.getElementById('areaButtons');
        buttonsContainer.innerHTML = '';

        area.actions.forEach(action => {
            // 요구사항 확인
            if (action.requirement && !this.gameLogic.checkRequirement(action.requirement)) {
                return;
            }

            const button = document.createElement('button');
            button.textContent = action.text;
            button.addEventListener('click', () => this.handleAreaAction(action));
            buttonsContainer.appendChild(button);
        });
    }

    // 지역 액션 처리
    handleAreaAction(action) {
        switch (action.type) {
            case 'shop':
                this.switchMode('shop');
                break;
            case 'rest':
                this.gameLogic.rest();
                this.updateUI();
                this.showMessage('휴식을 취해 HP가 완전히 회복되었습니다.');
                break;
            case 'travel':
                if (this.gameLogic.travelTo(action.target)) {
                    this.updateUI();
                    this.updateArea();
                    this.showMessage(`${AREAS[action.target].name}로 이동했습니다.`);
                } else {
                    this.showMessage('아직 이 지역에 갈 수 없습니다.');
                }
                break;
            case 'explore':
                this.handleExplore();
                break;
            case 'combat':
                this.handleCombatStart(action);
                break;
            case 'quest':
                this.handleQuest(action);
                break;
        }
    }

    // 탐험 처리
    handleExplore() {
        const event = this.gameLogic.explore();
        if (event) {
            this.showMessage(event.text);
            
            if (event.type === 'combat') {
                this.startCombat(event.enemy);
            } else if (event.type === 'treasure') {
                this.updateUI();
            }
        }
    }

    // 전투 시작 처리
    handleCombatStart(action) {
        const enemy = this.gameLogic.getRandomEnemy(action.enemies);
        this.startCombat(enemy);
    }

    // 퀘스트 처리
    handleQuest(action) {
        if (action.id === 'artifact') {
            this.showMessage('마법 유물을 발견했습니다! 게임 클리어!');
            this.gameLogic.getGameState().gameProgress.foundArtifact = true;
        }
    }

    // 전투 시작
    startCombat(enemyId) {
        const enemy = this.gameLogic.startCombat(enemyId);
        this.switchMode('combat');
        this.updateCombatUI();
        this.addCombatLog(`${enemy.name}이(가) 나타났습니다!`);
    }

    // 전투 UI 업데이트
    updateCombatUI() {
        if (!this.gameLogic.currentEnemy) return;

        const enemy = this.gameLogic.currentEnemy;
        document.getElementById('enemyName').textContent = enemy.name;
        document.getElementById('enemyHP').textContent = enemy.hp;
        document.getElementById('enemyMaxHP').textContent = enemy.maxHP;
        
        const hpPercentage = (enemy.hp / enemy.maxHP) * 100;
        document.getElementById('enemyHPFill').style.width = `${hpPercentage}%`;
    }

    // 플레이어 공격
    playerAttack() {
        const result = this.gameLogic.playerAttack();
        if (!result) return;

        this.addCombatLog(`${this.gameLogic.currentEnemy?.name || '적'}에게 ${result.damage}의 데미지를 입혔습니다!`);
        this.updateCombatUI();

        if (result.victory) {
            this.handleCombatVictory(result.rewards);
        } else if (result.enemyAttack) {
            setTimeout(() => {
                this.addCombatLog(`${this.gameLogic.currentEnemy?.name || '적'}이(가) ${result.enemyAttack.damage}의 데미지를 입혔습니다!`);
                this.updateUI();
                
                if (result.enemyAttack.defeat) {
                    this.handleCombatDefeat();
                }
            }, 1000);
        }
    }

    // 플레이어 회피
    playerDodge() {
        const result = this.gameLogic.playerDodge();
        if (!result) return;

        if (result.success) {
            if (result.perfect) {
                this.addCombatLog('완벽한 회피! 다음 공격의 데미지가 증가합니다!');
            } else {
                this.addCombatLog('공격을 성공적으로 회피했습니다!');
            }
        } else {
            this.addCombatLog('회피에 실패했습니다!');
            if (result.enemyAttack) {
                setTimeout(() => {
                    this.addCombatLog(`${this.gameLogic.currentEnemy?.name || '적'}이(가) ${result.enemyAttack.damage}의 데미지를 입혔습니다!`);
                    this.updateUI();
                    
                    if (result.enemyAttack.defeat) {
                        this.handleCombatDefeat();
                    }
                }, 1000);
            }
        }
    }

    // 전투에서 도망
    runFromCombat() {
        if (this.gameLogic.runFromCombat()) {
            this.addCombatLog('성공적으로 도망쳤습니다!');
            setTimeout(() => {
                this.switchMode('exploration');
            }, 1000);
        } else {
            this.addCombatLog('도망치지 못했습니다!');
            // 적 공격
            const enemyResult = this.gameLogic.enemyAttack();
            if (enemyResult) {
                setTimeout(() => {
                    this.addCombatLog(`${this.gameLogic.currentEnemy?.name || '적'}이(가) ${enemyResult.damage}의 데미지를 입혔습니다!`);
                    this.updateUI();
                    
                    if (enemyResult.defeat) {
                        this.handleCombatDefeat();
                    }
                }, 1000);
            }
        }
    }

    // 전투 승리 처리
    handleCombatVictory(rewards) {
        this.addCombatLog(`적을 처치했습니다!`);
        this.addCombatLog(`경험치 ${rewards.exp}를 획득했습니다!`);
        this.addCombatLog(`골드 ${rewards.gold}를 획득했습니다!`);
        
        rewards.items.forEach(itemId => {
            const item = ITEMS[itemId];
            this.addCombatLog(`${item.name}을(를) 획득했습니다!`);
        });

        // 레벨업 체크
        if (this.gameLogic.checkLevelUp()) {
            this.showModal('levelUpModal');
        }

        this.updateUI();
        
        setTimeout(() => {
            this.switchMode('exploration');
        }, 2000);
    }

    // 전투 패배 처리
    handleCombatDefeat() {
        this.addCombatLog('당신이 쓰러졌습니다...');
        this.addCombatLog('고요한 쉼터로 돌아갑니다.');
        
        // 고요한 쉼터로 이동
        this.gameLogic.travelTo('shelter');
        this.gameLogic.rest(); // HP 회복
        
        setTimeout(() => {
            this.switchMode('exploration');
            this.updateUI();
            this.updateArea();
        }, 2000);
    }

    // 전투 로그 추가
    addCombatLog(message) {
        const logElement = document.getElementById('combatLog');
        const p = document.createElement('p');
        p.textContent = message;
        logElement.appendChild(p);
        logElement.scrollTop = logElement.scrollHeight;
    }

    // 상점 업데이트
    updateShop() {
        const shopContainer = document.getElementById('shopItems');
        shopContainer.innerHTML = '';

        SHOP_ITEMS.forEach(itemId => {
            const item = ITEMS[itemId];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            
            itemDiv.innerHTML = `
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <p class="price">${item.price} 골드</p>
                <button onclick="gameController.buyItem('${itemId}')">구매</button>
            `;
            
            shopContainer.appendChild(itemDiv);
        });
    }

    // 아이템 구매
    buyItem(itemId) {
        if (this.gameLogic.buyItem(itemId)) {
            this.updateUI();
            this.showMessage(`${ITEMS[itemId].name}을(를) 구매했습니다!`);
        } else {
            this.showMessage('골드가 부족하거나 인벤토리가 가득 찼습니다!');
        }
    }

    // 인벤토리 표시
    showInventory() {
        this.updateInventory();
        this.showModal('inventoryModal');
    }

    // 인벤토리 업데이트
    updateInventory() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        inventoryGrid.innerHTML = '';

        const player = this.gameLogic.getGameState().player;
        
        // 20개 슬롯 생성
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (i < player.inventory.length) {
                const itemId = player.inventory[i];
                const item = ITEMS[itemId];
                slot.classList.add('has-item');
                slot.innerHTML = `<div class="item-name">${item.name}</div>`;
                slot.addEventListener('click', () => this.handleItemClick(itemId, i));
            }
            
            inventoryGrid.appendChild(slot);
        }
    }

    // 아이템 클릭 처리
    handleItemClick(itemId, index) {
        const item = ITEMS[itemId];
        
        if (item.type === 'consumable') {
            if (this.gameLogic.useItem(itemId)) {
                this.updateInventory();
                this.updateUI();
                this.showMessage(`${item.name}을(를) 사용했습니다!`);
            }
        } else if (['weapon', 'armor', 'shield'].includes(item.type)) {
            if (this.gameLogic.equipItem(itemId)) {
                this.updateInventory();
                this.updateUI();
                this.showMessage(`${item.name}을(를) 장착했습니다!`);
            }
        }
    }

    // 스탯 표시
    showStats() {
        this.showModal('statsModal');
    }

    // 스탯 증가
    increaseStat(statName) {
        if (this.gameLogic.increaseStat(statName)) {
            this.updateUI();
            const statNames = {
                strength: '힘',
                agility: '민첩',
                vitality: '체력'
            };
            this.showMessage(`${statNames[statName]}이(가) 1 증가했습니다!`);
        }
    }

    // 모달 표시
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    // 모달 숨김
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // 메시지 표시 (임시)
    showMessage(message) {
        console.log(message);
        // 실제 구현에서는 UI에 메시지를 표시할 수 있습니다
    }
}

// 게임 컨트롤러 인스턴스 생성
let gameController;

// 페이지 로드 시 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
});
