// 游戏变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameSpeed = 10;
let gameInterval;
let isGameOver = false;
let isPaused = false;

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 2.5D效果参数（立体元素配置）
const config3d = {
  thickness: 15, // 元素厚度（蛇身、食物的侧面高度）
  mainColor: { snake: "#2ecc71", food: "#e74c3c" }, // 主面颜色
  sideColor: { snake: "#27ae60", food: "#c0392b" }, // 侧面颜色（比主面深一级，模拟光影）
  shadowColor: "rgba(0, 0, 0, 0.15)", // 阴影颜色
  shadowOffset: 8 // 阴影偏移量
};

// 初始化游戏
function initGame() {
    snake = [];
    for (let i = 5; i >= 0; i--) {
        snake.push({ x: i, y: 10 });
    }
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    isPaused = false;
    generateFood();
    drawGame();
    // 自动开始游戏
    gameInterval = setInterval(gameLoop, 1000 / gameSpeed);
}

// 生成食物
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // 确保食物不会生成在蛇身上
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

// 绘制单段蛇身（2D逻辑不变，新增立体渲染）
function drawSnakeSegment(x, y, size, isHead) {
  const { thickness, mainColor, sideColor, shadowColor, shadowOffset } = config3d;

  // 步骤1：绘制阴影（底层，营造悬浮感）
  ctx.fillStyle = shadowColor;
  ctx.fillRect(
    x + shadowOffset,
    y + shadowOffset + thickness, // 偏移至侧面下方
    size,
    size
  );

  // 步骤2：绘制蛇身侧面（厚度部分，模拟3D侧面）
  ctx.fillStyle = sideColor.snake;
  // 水平侧面（右方）
  ctx.fillRect(x + size, y, thickness, size);
  // 垂直侧面（下方）
  ctx.fillRect(x, y + size, size + thickness, thickness);

  // 步骤3：绘制蛇身主面（原有2D绘制逻辑，顶层）
  ctx.fillStyle = mainColor.snake;
  ctx.fillRect(x, y, size, size);
  
  // 如果是蛇头，绘制眼睛
  if (isHead) {
    drawSnakeEyes(x, y);
  }
}

// 绘制食物（立体效果，与蛇身风格一致）
function drawFood(x, y, size) {
  const { thickness, mainColor, sideColor, shadowColor, shadowOffset } = config3d;

  // 步骤1：绘制阴影
  ctx.fillStyle = shadowColor;
  ctx.fillRect(
    x + shadowOffset,
    y + shadowOffset + thickness,
    size,
    size
  );

  // 步骤2：绘制食物侧面
  ctx.fillStyle = sideColor.food;
  // 水平侧面（右方）
  ctx.fillRect(x + size, y, thickness, size);
  // 垂直侧面（下方）
  ctx.fillRect(x, y + size, size + thickness, thickness);

  // 步骤3：绘制食物主面
  ctx.fillStyle = mainColor.food;
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.fill();
  
  // 绘制食物高光
  drawFoodHighlight(x, y);
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#f8f5f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制2.5D地面网格和边界
    drawGroundGrid();
    drawGameWall();
    
    // 绘制蛇
    for (let i = snake.length - 1; i >= 0; i--) {
        let segment = snake[i];
        let x = segment.x * gridSize;
        let y = segment.y * gridSize;
        
        // 绘制蛇身段
        drawSnakeSegment(x, y, gridSize, i === 0);
    }
    
    // 绘制食物
    let foodX = food.x * gridSize;
    let foodY = food.y * gridSize;
    drawFood(foodX, foodY, gridSize);
    
    // 游戏结束提示
    if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '16px Arial';
        ctx.fillText(`最终分数: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText('点击重新开始按钮继续', canvas.width / 2, canvas.height / 2 + 30);
    }
}

// 绘制2.5D地面网格纹理
function drawGroundGrid() {
  const gridSize = 40; // 网格大小，与蛇身尺寸匹配
  ctx.strokeStyle = "rgba(200, 190, 170, 0.3)"; // 浅淡纹理色，不干扰核心元素
  ctx.lineWidth = 1;

  // 绘制水平网格（随透视延伸）
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 绘制垂直网格（随透视延伸）
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

// 绘制立体围墙（边界高度）
function drawGameWall() {
  const wallWidth = 20;
  const wallHeight = 30; // 围墙高度，比蛇身厚度更高
  
  // 围墙主色
  ctx.fillStyle = "#d3d0c8";
  // 上围墙
  ctx.fillRect(0, -wallHeight, canvas.width, wallHeight);
  // 左围墙
  ctx.fillRect(-wallWidth, 0, wallWidth, canvas.height);
  
  // 围墙侧面色（深一级，模拟立体）
  ctx.fillStyle = "#b9b6ae";
  // 下围墙（立体侧面）
  ctx.fillRect(0, canvas.height, canvas.width, wallHeight);
  // 右围墙（立体侧面）
  ctx.fillRect(canvas.width, 0, wallWidth, canvas.height);
}

// 绘制蛇眼
function drawSnakeEyes(x, y) {
    // 根据蛇的方向绘制眼睛
    ctx.fillStyle = 'white';
    
    switch (direction) {
        case 'up':
            ctx.fillRect(x + 5, y + 3, 3, 3);
            ctx.fillRect(x + gridSize - 8, y + 3, 3, 3);
            break;
        case 'down':
            ctx.fillRect(x + 5, y + gridSize - 6, 3, 3);
            ctx.fillRect(x + gridSize - 8, y + gridSize - 6, 3, 3);
            break;
        case 'left':
            ctx.fillRect(x + 3, y + 5, 3, 3);
            ctx.fillRect(x + 3, y + gridSize - 8, 3, 3);
            break;
        case 'right':
            ctx.fillRect(x + gridSize - 6, y + 5, 3, 3);
            ctx.fillRect(x + gridSize - 6, y + gridSize - 8, 3, 3);
            break;
    }
}

// 绘制食物高光
function drawFoodHighlight(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x + gridSize/2 - 5, y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加第二个高光点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x + gridSize/2 + 3, y + 8, 2, 0, Math.PI * 2);
    ctx.fill();
}

// 移动蛇
function moveSnake() {
    if (isPaused || isGameOver) return;
    
    // 更新方向
    direction = nextDirection;
    
    // 创建新头部
    const head = { ...snake[0] };
    
    // 根据方向移动头部
    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // 检查边界碰撞
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
        // 增加游戏速度
        if (score % 50 === 0) {
            gameSpeed += 1;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / gameSpeed);
        }
    } else {
        // 移除尾部
        snake.pop();
    }
    
    // 添加新头部
    snake.unshift(head);
    drawGame();
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    drawGame();
}

// 游戏循环
function gameLoop() {
    moveSnake();
}

// 开始游戏
function startGame() {
    if (!isGameOver && !isPaused) return;
    
    if (isPaused) {
        isPaused = false;
        gameInterval = setInterval(gameLoop, 1000 / gameSpeed);
    } else {
        initGame();
    }
}

// 暂停游戏
function pauseGame() {
    if (isGameOver || isPaused) return;
    
    isPaused = true;
    clearInterval(gameInterval);
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameInterval);
    initGame();
}

// 键盘事件监听
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') {
                nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') {
                nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') {
                nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') {
                nextDirection = 'right';
            }
            break;
        case ' ': // 空格键暂停/继续
            if (isGameOver) {
                restartGame();
            } else {
                isPaused ? startGame() : pauseGame();
            }
            break;
    }
});

// 触摸事件支持（移动端）
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 防止页面滚动
});

canvas.addEventListener('touchend', (e) => {
    if (isGameOver || isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 确定滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0 && direction !== 'left') {
            nextDirection = 'right';
        } else if (deltaX < 0 && direction !== 'right') {
            nextDirection = 'left';
        }
    } else {
        // 垂直滑动
        if (deltaY > 0 && direction !== 'up') {
            nextDirection = 'down';
        } else if (deltaY < 0 && direction !== 'down') {
            nextDirection = 'up';
        }
    }
});

// 按钮事件监听
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);

// 初始化游戏
initGame();
