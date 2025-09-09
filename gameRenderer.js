// 게임 렌더링 클래스

class GameRenderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.combatCanvas = document.getElementById('combatCanvas');
        this.combatCtx = this.combatCanvas.getContext('2d');
        
        this.player = {
            x: 400,
            y: 200,
            width: 40,
            height: 40,
            direction: 'down',
            animFrame: 0,
            isMoving: false
        };
        
        this.animationTime = 0;
        this.setupControls();
        this.animate();
    }

    // 키보드 컨트롤 설정
    setupControls() {
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        // 플레이어 이동 처리
        setInterval(() => {
            let moved = false;
            const speed = 3;
            
            if (keys['ArrowUp'] || keys['w']) {
                this.player.y = Math.max(50, this.player.y - speed);
                this.player.direction = 'up';
                moved = true;
            }
            if (keys['ArrowDown'] || keys['s']) {
                this.player.y = Math.min(350, this.player.y + speed);
                this.player.direction = 'down';
                moved = true;
            }
            if (keys['ArrowLeft'] || keys['a']) {
                this.player.x = Math.max(20, this.player.x - speed);
                this.player.direction = 'left';
                moved = true;
            }
            if (keys['ArrowRight'] || keys['d']) {
                this.player.x = Math.min(740, this.player.x + speed);
                this.player.direction = 'right';
                moved = true;
            }
            
            this.player.isMoving = moved;
        }, 16);
    }

    // 메인 애니메이션 루프
    animate() {
        this.animationTime += 0.1;
        this.render();
        requestAnimationFrame(() => this.animate());
    }

    // 메인 렌더링
    render() {
        const area = gameController?.gameLogic?.getCurrentArea();
        if (!area) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 렌더링
        this.renderBackground(area.name);
        
        // NPC 및 오브젝트 렌더링
        this.renderAreaObjects(area.name);
        
        // 플레이어 렌더링
        this.renderPlayer();
    }

    // 배경 렌더링
    renderBackground(areaName) {
        const ctx = this.ctx;
        
        switch(areaName) {
            case '고요한 쉼터':
                this.renderShelter();
                break;
            case '버려진 숲':
                this.renderForest();
                break;
            case '고대의 유적':
                this.renderRuins();
                break;
        }
    }

    // 쉼터 렌더링
    renderShelter() {
        const ctx = this.ctx;
        
        // 잔디 배경
        ctx.fillStyle = '#2d5a2d';
        ctx.fillRect(0, 0, 800, 400);
        
        // 집들
        this.drawBuilding(100, 100, 150, 100, '#8B4513', '#654321');
        this.drawBuilding(300, 150, 120, 80, '#8B4513', '#654321');
        this.drawBuilding(500, 120, 140, 90, '#8B4513', '#654321');
        
        // 중앙 광장
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(400, 250, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // 상인 위치 표시
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(380, 230, 40, 40);
        ctx.fillStyle = '#000';
        ctx.font = '12px monospace';
        ctx.fillText('상인', 385, 250);
    }

    // 숲 렌더링
    renderForest() {
        const ctx = this.ctx;
        
        // 어두운 배경
        ctx.fillStyle = '#1a3d1a';
        ctx.fillRect(0, 0, 800, 400);
        
        // 나무들
        for (let i = 0; i < 15; i++) {
            const x = (i * 60 + Math.sin(i) * 30) % 800;
            const y = (i * 40 + Math.cos(i) * 20) % 350 + 30;
            this.drawTree(x, y, 40 + Math.sin(i) * 10);
        }
        
        // 길
        ctx.fillStyle = '#654321';
        ctx.fillRect(350, 0, 100, 400);
        
        // 몬스터 위치 표시 (랜덤하게 움직임)
        const monsterX = 200 + Math.sin(this.animationTime) * 30;
        const monsterY = 150 + Math.cos(this.animationTime * 0.7) * 20;
        this.drawMonster(monsterX, monsterY, '#4CAF50', '슬라임');
    }

    // 유적 렌더링
    renderRuins() {
        const ctx = this.ctx;
        
        // 돌 배경
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 0, 800, 400);
        
        // 고대 건물들
        this.drawRuinBuilding(50, 80, 200, 150);
        this.drawRuinBuilding(350, 50, 250, 180);
        this.drawRuinBuilding(650, 100, 120, 120);
        
        // 신비로운 빛 효과
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.animationTime) * 0.2;
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.arc(400, 200, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 몬스터 위치
        const skeletonX = 150 + Math.sin(this.animationTime * 0.5) * 20;
        const skeletonY = 250 + Math.cos(this.animationTime * 0.3) * 15;
        this.drawMonster(skeletonX, skeletonY, '#E0E0E0', '해골');
    }

    // 플레이어 렌더링
    renderPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        
        // 애니메이션 프레임 업데이트
        if (p.isMoving) {
            p.animFrame = Math.floor(this.animationTime * 8) % 4;
        } else {
            p.animFrame = 0;
        }
        
        // 플레이어 그리기 (간단한 픽셀 스타일)
        ctx.fillStyle = '#FF6B6B';
        
        // 몸체
        ctx.fillRect(p.x, p.y, p.width, p.height);
        
        // 머리
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(p.x + 5, p.y - 15, 30, 20);
        
        // 눈
        ctx.fillStyle = '#000';
        ctx.fillRect(p.x + 10, p.y - 10, 5, 5);
        ctx.fillRect(p.x + 25, p.y - 10, 5, 5);
        
        // 방향에 따른 추가 표시
        ctx.fillStyle = '#4ECDC4';
        switch(p.direction) {
            case 'up':
                ctx.fillRect(p.x + 15, p.y - 5, 10, 5);
                break;
            case 'down':
                ctx.fillRect(p.x + 15, p.y + 40, 10, 5);
                break;
            case 'left':
                ctx.fillRect(p.x - 5, p.y + 15, 5, 10);
                break;
            case 'right':
                ctx.fillRect(p.x + 40, p.y + 15, 5, 10);
                break;
        }
        
        // 이동 효과
        if (p.isMoving) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(p.x - 2, p.y + 35 + Math.sin(this.animationTime * 10) * 2, p.width + 4, 5);
            ctx.restore();
        }
    }

    // 건물 그리기
    drawBuilding(x, y, width, height, roofColor, wallColor) {
        const ctx = this.ctx;
        
        // 벽
        ctx.fillStyle = wallColor;
        ctx.fillRect(x, y, width, height);
        
        // 지붕
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + width/2, y - 30);
        ctx.lineTo(x + width + 10, y);
        ctx.closePath();
        ctx.fill();
        
        // 문
        ctx.fillStyle = '#4B2C2C';
        ctx.fillRect(x + width/2 - 15, y + height - 40, 30, 40);
        
        // 창문
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x + 20, y + 20, 25, 25);
        ctx.fillRect(x + width - 45, y + 20, 25, 25);
    }

    // 나무 그리기
    drawTree(x, y, size) {
        const ctx = this.ctx;
        
        // 나무 줄기
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 5, y, 10, size);
        
        // 나뭇잎
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y - size/3, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - size/4, y - size/2, size/3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + size/4, y - size/2, size/3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 유적 건물 그리기
    drawRuinBuilding(x, y, width, height) {
        const ctx = this.ctx;
        
        // 메인 구조
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x, y, width, height);
        
        // 기둥들
        for (let i = 0; i < 4; i++) {
            const pillarX = x + (i + 1) * (width / 5);
            ctx.fillStyle = '#808080';
            ctx.fillRect(pillarX - 5, y, 10, height);
        }
        
        // 손상된 부분
        ctx.fillStyle = '#696969';
        ctx.fillRect(x + 20, y + 20, 30, 30);
        ctx.fillRect(x + width - 50, y + height - 40, 25, 40);
    }

    // 몬스터 그리기
    drawMonster(x, y, color, type) {
        const ctx = this.ctx;
        
        ctx.fillStyle = color;
        if (type === '슬라임') {
            // 슬라임 모양
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 눈
            ctx.fillStyle = '#000';
            ctx.fillRect(x - 8, y - 5, 4, 4);
            ctx.fillRect(x + 4, y - 5, 4, 4);
        } else if (type === '해골') {
            // 해골 모양
            ctx.fillRect(x - 15, y - 20, 30, 40);
            
            // 해골 얼굴
            ctx.fillStyle = '#000';
            ctx.fillRect(x - 8, y - 15, 4, 6);
            ctx.fillRect(x + 4, y - 15, 4, 6);
            ctx.fillRect(x - 3, y - 5, 6, 3);
        }
    }

    // 전투 렌더링
    renderCombat(enemy) {
        if (!this.combatCanvas || !enemy) return;
        
        const ctx = this.combatCtx;
        ctx.clearRect(0, 0, this.combatCanvas.width, this.combatCanvas.height);
        
        // 전투 배경
        const gradient = ctx.createLinearGradient(0, 0, 800, 300);
        gradient.addColorStop(0, '#2d1b1b');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 300);
        
        // 플레이어 (왼쪽)
        this.renderCombatPlayer(150, 150);
        
        // 적 (오른쪽)
        this.renderCombatEnemy(550, 150, enemy);
        
        // 전투 효과
        this.renderCombatEffects();
    }

    // 전투 플레이어 렌더링
    renderCombatPlayer(x, y) {
        const ctx = this.combatCtx;
        
        // 플레이어 (확대된 버전)
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(x, y, 60, 80);
        
        // 머리
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(x + 10, y - 25, 40, 30);
        
        // 눈
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 18, y - 15, 8, 8);
        ctx.fillRect(x + 34, y - 15, 8, 8);
        
        // 무기 (검)
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x + 65, y + 10, 8, 50);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 63, y + 55, 12, 15);
    }

    // 전투 적 렌더링
    renderCombatEnemy(x, y, enemy) {
        const ctx = this.combatCtx;
        
        switch(enemy.name) {
            case '슬라임':
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(x, y, 40, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#000';
                ctx.fillRect(x - 15, y - 10, 8, 8);
                ctx.fillRect(x + 7, y - 10, 8, 8);
                break;
                
            case '늑대':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x - 30, y, 60, 40);
                
                // 머리
                ctx.fillRect(x + 20, y - 20, 30, 30);
                
                // 눈
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x + 25, y - 15, 6, 6);
                ctx.fillRect(x + 35, y - 15, 6, 6);
                break;
                
            default:
                // 기본 적 모양
                ctx.fillStyle = '#800080';
                ctx.fillRect(x - 25, y - 25, 50, 50);
                break;
        }
    }

    // 전투 이펙트 렌더링
    renderCombatEffects() {
        // 간단한 파티클 효과나 충격 효과를 여기에 추가할 수 있습니다
    }

    // 플레이어 위치 리셋 (지역 변경시)
    resetPlayerPosition() {
        this.player.x = 400;
        this.player.y = 200;
    }
}
