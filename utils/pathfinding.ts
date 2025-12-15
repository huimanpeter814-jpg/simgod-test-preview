import { CONFIG } from '../constants';

interface Node {
    x: number;
    y: number;
    g: number; // 从起点到当前点的代价
    h: number; // 启发式代价（到终点的估算）
    f: number; // 总代价
    parent: Node | null;
}

export class PathFinder {
    grid: number[][]; // 0: 可通行, 1: 障碍
    cellSize: number;
    cols: number;
    rows: number;

    constructor(width: number, height: number, cellSize: number = 20) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = [];
        this.clear();
    }

    // 重置网格 (默认全图可通行)
    clear() {
        this.grid = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    }

    // 标记障碍物区域
    setObstacle(x: number, y: number, w: number, h: number) {
        const startCol = Math.max(0, Math.floor(x / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((x + w) / this.cellSize));
        const startRow = Math.max(0, Math.floor(y / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((y + h) / this.cellSize));

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                this.grid[r][c] = 1;
            }
        }
    }

    // 坐标转网格索引
    toGrid(val: number) {
        return Math.floor(val / this.cellSize);
    }

    // 网格索引转世界中心坐标
    toWorld(gridIdx: number) {
        return gridIdx * this.cellSize + this.cellSize / 2;
    }

    // A* 寻路算法
    findPath(startX: number, startY: number, endX: number, endY: number): { x: number, y: number }[] {
        const startNode: Node = { 
            x: this.toGrid(startX), 
            y: this.toGrid(startY), 
            g: 0, h: 0, f: 0, parent: null 
        };
        const endNode = { 
            x: this.toGrid(endX), 
            y: this.toGrid(endY) 
        };

        // 边界检查
        if (startNode.x < 0 || startNode.x >= this.cols || startNode.y < 0 || startNode.y >= this.rows) return [];
        if (endNode.x < 0 || endNode.x >= this.cols || endNode.y < 0 || endNode.y >= this.rows) return [];

        // 如果终点是障碍物，尝试寻找终点附近最近的可行点 (简单的螺旋搜索)
        if (this.grid[endNode.y][endNode.x] === 1) {
            let found = false;
            for (let r = 1; r <= 3; r++) { // 搜索半径 3 格
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        const nx = endNode.x + dx;
                        const ny = endNode.y + dy;
                        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === 0) {
                            endNode.x = nx;
                            endNode.y = ny;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }
            if (!found) return []; // 真的找不到落脚点
        }

        const openList: Node[] = [startNode];
        const closedSet = new Set<string>();
        
        // 性能保护：防止死循环或过长计算
        let ops = 0;
        const MAX_OPS = 3000; 

        while (openList.length > 0) {
            ops++;
            if (ops > MAX_OPS) {
                // console.warn("Pathfinding timeout, returning straight line");
                return [{x: endX, y: endY}]; // 降级为直线
            }

            // 获取 f 值最小的节点 (简单的数组排序，由于 Grid 小，性能尚可)
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;
            
            const key = `${current.x},${current.y}`;
            closedSet.add(key);

            // 到达终点
            if (current.x === endNode.x && current.y === endNode.y) {
                // [修复] 显式声明 path 数组的类型，防止被推断为 never[]
                const path: { x: number, y: number }[] = [];
                let curr: Node | null = current;
                while (curr) {
                    path.push({ x: this.toWorld(curr.x), y: this.toWorld(curr.y) });
                    curr = curr.parent;
                }
                // 路径反转，并去掉起点（因为我们已经在起点）
                return path.reverse().slice(1); 
            }

            // 探索邻居 (8方向)
            const neighbors = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (let i = 0; i < neighbors.length; i++) {
                const nx = current.x + neighbors[i].x;
                const ny = current.y + neighbors[i].y;

                if (nx < 0 || nx >= this.cols || ny < 0 || ny >= this.rows) continue;
                if (this.grid[ny][nx] === 1) continue;
                if (closedSet.has(`${nx},${ny}`)) continue;

                // 对角线移动增加代价，且如果是“穿墙角”（即两侧都是墙），则不允许
                const isDiag = neighbors[i].x !== 0 && neighbors[i].y !== 0;
                if (isDiag) {
                    if (this.grid[current.y][nx] === 1 || this.grid[ny][current.x] === 1) continue;
                }

                const gScore = current.g + (isDiag ? 1.414 : 1);
                
                let neighbor = openList.find(n => n.x === nx && n.y === ny);
                if (!neighbor) {
                    neighbor = {
                        x: nx, y: ny,
                        g: gScore,
                        h: Math.abs(nx - endNode.x) + Math.abs(ny - endNode.y), // 曼哈顿距离
                        f: 0,
                        parent: current
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    openList.push(neighbor);
                } else if (gScore < neighbor.g) {
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                }
            }
        }

        return []; // 无法到达
    }
}