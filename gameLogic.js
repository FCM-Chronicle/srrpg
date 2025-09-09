// 게임 로직 클래스

class GameLogic {
    constructor() {
        this.gameState = this.getDefaultGameState();
        this.currentEnemy = null;
        this.combatState = {
            perfectDodgeNext: false,
            tempEffects: {}
        };
    }

    // 기본 게임 상태 반환
    getDefaultGameState() {
        return {
            player: {
                level: 1,
                hp: 100,
                maxHP: 100,
                exp: 0,
                maxEXP: 100,
                gold: 100,
                strength: 10,
                agility: 10,
                vitality: 10,
                statPoints: 0,
                equipment: {
                    weapon: null,
                    armor: null,
                    shield: null
                },
                inventory: [],
                currentArea: "shelter"
            },
            gameProgress: {
                unlockedAreas: ["shelter", "forest"],
                defeatedBosses: [],
                foundArtifact: false
            }
        };
    }

    // 플레이어 스탯 계산
    getPlayerStats() {
        const base = this.gameState.player;
        let attack = base.strength + 5;
        let defense = Math.floor(base.vitality / 2);
        let dodgeRate = Math.min(base.agility + 10, 50);

        // 장비 보너스 적용
        if (base.equipment.weapon && ITEMS[base.equipment.weapon]) {
            attack += ITEMS[base.equipment.weapon].attack || 0;
        }
        if (base.equipment.armor && ITEMS[base.equipment.armor]) {
            defense += ITEMS[base.equipment.armor].defense || 0;
        }
        if (base.equipment.shield && ITEMS[base.equipment.shield]) {
            defense += ITEMS[base.equipment.shield].defense || 0;
        }

        return { attack, defense, dodgeRate };
    }

    // 레벨업 체크 및 처리
    checkLevelUp() {
        const player = this.gameState.player;
        if (player.exp >= player.maxEXP) {
            player.level++;
            player.exp -= player.maxEXP;
            player.maxEXP = EXP_TABLE[Math.min(player.level - 1, EXP_TABLE.length - 1)];
            player.statPoints++;
            
            // HP 회복
            const hpIncrease = player.vitality * 2;
            player.maxHP = 100 + hpIncrease;
            player.hp = player.maxHP;
            
            return true;
        }
        return false;
    }

    // 스탯 증가
    increaseStat(statName) {
        const player = this.gameState.player;
        if (player.statPoints > 0) {
            player[statName]++;
            player.statPoints--;
            
            // 체력 증가시 최대 HP 갱신
            if (statName === 'vitality') {
                const newMaxHP = 100 + (player.vitality * 2);
                const hpDiff = newMaxHP - player.maxHP;
                player.maxHP = newMaxHP;
                player.hp += hpDiff;
            }
            
            return true;
        }
        return false;
    }

    // 전투 시작
    startCombat(enemyId) {
        this.currentEnemy = JSON.parse(JSON.stringify(MONSTERS[enemyId]));
        this.combatState = {
            perfectDodgeNext: false,
            tempEffects: {},
            turn: 1
        };
        return this.currentEnemy;
    }

    // 플레이어 공격
    playerAttack() {
        if (!this.currentEnemy) return null;

        const stats = this.getPlayerStats();
        let damage = stats.attack + Math.floor(Math.random() * 10) - 5;
        
        // 완벽한 회피 후 보너스
        if (this.combatState.perfectDodgeNext) {
            damage = Math.floor(damage * 1.5);
            this.combatState.perfectDodgeNext = false;
        }

        damage = Math.max(1, damage);
        this.currentEnemy.hp -= damage;

        const result = {
            type: 'playerAttack',
            damage: damage,
            enemyHP: this.currentEnemy.hp,
            enemyMaxHP: this.currentEnemy.maxHP
        };

        // 적 처치 확인
        if (this.currentEnemy.hp <= 0) {
            const rewards = this.calculateCombatRewards();
            result.victory = true;
            result.rewards = rewards;
            this.applyCombatRewards(rewards);
            this.currentEnemy = null;
        } else {
            // 적 공격
            const enemyResult = this.enemyAttack();
            result.enemyAttack = enemyResult;
        }

        return result;
    }

    // 플레이어 회피
    playerDodge() {
        if (!this.currentEnemy) return null;

        const stats = this.getPlayerStats();
        const dodgeSuccess = Math.random() * 100 < stats.dodgeRate;
        const perfectDodge = Math.random() * 100 < 15; // 15% 확률로 완벽한 회피

        let result = {
            type: 'playerDodge',
            success: dodgeSuccess,
            perfect: false
        };

        if (dodgeSuccess && perfectDodge) {
            result.perfect = true;
            this.combatState.perfectDodgeNext = true;
        }

        // 회피 실패시 적 공격
        if (!dodgeSuccess) {
            const enemyResult = this.enemyAttack();
            result.enemyAttack = enemyResult;
        } else {
            // 회피 성공시에도 적의 다음 턴
            this.combatState.turn++;
        }

        return result;
    }

    // 적 공격
    enemyAttack() {
        if (!this.currentEnemy) return null;

        const stats = this.getPlayerStats();
        let damage = this.currentEnemy.attack + Math.floor(Math.random() * 6) - 3;
        damage = Math.max(1, damage - stats.defense);

        this.gameState.player.hp -= damage;

        const result = {
            damage: damage,
            playerHP: this.gameState.player.hp,
            playerMaxHP: this.gameState.player.maxHP
        };

        // 플레이어 사망 확인
        if (this.gameState.player.hp <= 0) {
            result.defeat = true;
            this.gameState.player.hp = 1; // 사망시 1로 설정
        }

        return result;
    }

    // 전투 보상 계산
    calculateCombatRewards() {
        const enemy = this.currentEnemy;
        const rewards = {
            exp: enemy.exp,
            gold: enemy.gold + Math.floor(Math.random() * 10),
            items: []
        };

        // 아이템 드롭 계산
        if (Math.random() < enemy.dropRate && enemy.drops) {
            const randomDrop = enemy.drops[Math.floor(Math.random() * enemy.drops.length)];
            rewards.items.push(randomDrop);
        }

        return rewards;
    }

    // 전투 보상 적용
    applyCombatRewards(rewards) {
        const player = this.gameState.player;
        
        player.exp += rewards.exp;
        player.gold += rewards.gold;
        
        // 아이템 추가
        rewards.items.forEach(itemId => {
            if (player.inventory.length < 20) { // 인벤토리 최대 20개
                player.inventory.push(itemId);
            }
        });
    }

    // 도망
    runFromCombat() {
        this.currentEnemy = null;
        this.combatState = {};
        return Math.random() < 0.8; // 80% 확률로 도망 성공
    }

    // 아이템 사용
    useItem(itemId) {
        const player = this.gameState.player;
        const itemIndex = player.inventory.indexOf(itemId);
        
        if (itemIndex === -1) return false;

        const item = ITEMS[itemId];
        if (!item || item.type !== 'consumable') return false;

        // 아이템 효과 적용
        switch (item.effect) {
            case 'heal':
                player.hp = Math.min(player.maxHP, player.hp + item.value);
                break;
            case 'temp_strength':
                this.combatState.tempEffects.strength = {
                    value: item.value,
                    duration: item.duration
                };
                break;
        }

        // 인벤토리에서 제거
        player.inventory.splice(itemIndex, 1);
        return true;
    }

    // 아이템 장착
    equipItem(itemId) {
        const player = this.gameState.player;
        const item = ITEMS[itemId];
        
        if (!item || !['weapon', 'armor', 'shield'].includes(item.type)) return false;

        // 기존 장비 해제
        if (player.equipment[item.type]) {
            player.inventory.push(player.equipment[item.type]);
        }

        // 새 장비 장착
        player.equipment[item.type] = itemId;
        
        // 인벤토리에서 제거
        const itemIndex = player.inventory.indexOf(itemId);
        if (itemIndex !== -1) {
            player.inventory.splice(itemIndex, 1);
        }

        return true;
    }

    // 상점에서 구매
    buyItem(itemId) {
        const player = this.gameState.player;
        const item = ITEMS[itemId];
        
        if (!item || player.gold < item.price) return false;
        if (player.inventory.length >= 20) return false; // 인벤토리 가득참

        player.gold -= item.price;
        player.inventory.push(itemId);
        return true;
    }

    // 휴식 (HP 회복)
    rest() {
        this.gameState.player.hp = this.gameState.player.maxHP;
        return true;
    }

    // 지역 이동
    travelTo(areaId) {
        const area = AREAS[areaId];
        if (!area) return false;

        // 이동 조건 확인
        if (areaId === 'ruins' && this.gameState.player.level < 3) {
            return false;
        }

        this.gameState.player.currentArea = areaId;
        return true;
    }

    // 탐험
    explore() {
        const currentArea = this.gameState.player.currentArea;
        const events = EXPLORATION_EVENTS[currentArea];
        
        if (!events) return null;

        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        if (randomEvent.type === 'treasure' && randomEvent.rewards) {
            // 보상 적용
            if (randomEvent.rewards.gold) {
                this.gameState.player.gold += randomEvent.rewards.gold;
            }
            if (randomEvent.rewards.items) {
                randomEvent.rewards.items.forEach(itemId => {
                    if (this.gameState.player.inventory.length < 20) {
                        this.gameState.player.inventory.push(itemId);
                    }
                });
            }
        }

        return randomEvent;
    }

    // 게임 저장
    saveGame() {
        try {
            const saveData = {
                gameState: this.gameState,
                timestamp: Date.now()
            };
            // 메모리 저장 (브라우저 스토리지 대신)
            window.gameData = saveData;
            return true;
        } catch (error) {
            console.error('게임 저장 실패:', error);
            return false;
        }
    }

    // 게임 로드
    loadGame() {
        try {
            // 메모리에서 로드
            const saveData = window.gameData;
            if (saveData && saveData.gameState) {
                this.gameState = saveData.gameState;
                return true;
            }
            return false;
        } catch (error) {
            console.error('게임 로드 실패:', error);
            return false;
        }
    }

    // 요구사항 확인
    checkRequirement(requirement) {
        if (!requirement) return true;
        
        switch (requirement.type) {
            case 'level':
                return this.gameState.player.level >= requirement.value;
            case 'item':
                return this.gameState.player.inventory.includes(requirement.value);
            case 'boss':
                return this.gameState.gameProgress.defeatedBosses.includes(requirement.value);
            default:
                return true;
        }
    }

    // 게임 상태 반환
    getGameState() {
        return this.gameState;
    }

    // 현재 지역 정보 반환
    getCurrentArea() {
        return AREAS[this.gameState.player.currentArea];
    }

    // 몬스터 랜덤 선택
    getRandomEnemy(enemies) {
        return enemies[Math.floor(Math.random() * enemies.length)];
    }
}
