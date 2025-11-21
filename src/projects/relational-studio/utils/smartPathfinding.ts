interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

class PathNode {
  constructor(
    public x: number,
    public y: number,
    public g: number = 0,
    public h: number = 0,
    public parent: PathNode | null = null
  ) {}

  get f() {
    return this.g + this.h;
  }
}

export class SmartPathfinder {
  private gridSize: number;
  private obstacles: Rectangle[];

  constructor(gridSize: number = 20) {
    this.gridSize = gridSize;
    this.obstacles = [];
  }

  setObstacles(obstacles: Rectangle[]) {
    this.obstacles = obstacles;
  }

  private snapToGrid(point: Point): Point {
    return {
      x: Math.round(point.x / this.gridSize) * this.gridSize,
      y: Math.round(point.y / this.gridSize) * this.gridSize
    };
  }

  private isPointInObstacle(point: Point): boolean {
    return this.obstacles.some(obstacle => 
      point.x >= obstacle.x - 10 &&
      point.x <= obstacle.x + obstacle.width + 10 &&
      point.y >= obstacle.y - 10 &&
      point.y <= obstacle.y + obstacle.height + 10
    );
  }

  private heuristic(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getNeighbors(node: PathNode): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { x: 0, y: -this.gridSize }, // up
      { x: this.gridSize, y: 0 },  // right
      { x: 0, y: this.gridSize },  // down
      { x: -this.gridSize, y: 0 }  // left
    ];

    for (const dir of directions) {
      const neighbor = {
        x: node.x + dir.x,
        y: node.y + dir.y
      };

      if (!this.isPointInObstacle(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  findPath(start: Point, end: Point): Point[] {
    const startSnapped = this.snapToGrid(start);
    const endSnapped = this.snapToGrid(end);

    // Simple orthogonal path if no obstacles block direct route
    if (!this.hasObstaclesBetween(startSnapped, endSnapped)) {
      return this.createOrthogonalPath(startSnapped, endSnapped);
    }

    // Use A* for complex routing
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();
    const startNode = new PathNode(startSnapped.x, startSnapped.y, 0, this.heuristic(startSnapped, endSnapped));
    
    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.x},${current.y}`;

      if (closedSet.has(currentKey)) continue;
      closedSet.add(currentKey);

      // Check if we reached the goal
      if (Math.abs(current.x - endSnapped.x) < this.gridSize && 
          Math.abs(current.y - endSnapped.y) < this.gridSize) {
        return this.reconstructPath(current, startSnapped, endSnapped);
      }

      // Explore neighbors
      for (const neighborPos of this.getNeighbors(current)) {
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + this.gridSize;
        const h = this.heuristic(neighborPos, endSnapped);
        const neighbor = new PathNode(neighborPos.x, neighborPos.y, g, h, current);

        openSet.push(neighbor);
      }

      // Limit search to prevent infinite loops
      if (closedSet.size > 100) break;
    }

    // Fallback to simple orthogonal path
    return this.createOrthogonalPath(startSnapped, endSnapped);
  }

  private hasObstaclesBetween(start: Point, end: Point): boolean {
    const midY = (start.y + end.y) / 2;
    return this.obstacles.some(obstacle => 
      midY >= obstacle.y - 20 && 
      midY <= obstacle.y + obstacle.height + 20 &&
      ((start.x < obstacle.x + obstacle.width + 20 && end.x > obstacle.x - 20) ||
       (start.x > obstacle.x - 20 && end.x < obstacle.x + obstacle.width + 20))
    );
  }

  private createOrthogonalPath(start: Point, end: Point): Point[] {
    const path: Point[] = [start];
    const midY = (start.y + end.y) / 2;
    
    // Horizontal then vertical routing
    if (Math.abs(start.x - end.x) > this.gridSize) {
      path.push({ x: start.x + (end.x > start.x ? 30 : -30), y: start.y });
      path.push({ x: start.x + (end.x > start.x ? 30 : -30), y: midY });
      path.push({ x: end.x + (end.x > start.x ? -30 : 30), y: midY });
      path.push({ x: end.x + (end.x > start.x ? -30 : 30), y: end.y });
    }
    
    path.push(end);
    return path;
  }

  private reconstructPath(node: PathNode, start: Point, end: Point): Point[] {
    const path: Point[] = [];
    let current: PathNode | null = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    // Ensure we start and end at exact points
    if (path.length > 0) {
      path[0] = start;
      path[path.length - 1] = end;
    }

    return path;
  }

  createSmoothPath(points: Point[]): string {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }
}