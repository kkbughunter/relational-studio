import * as PF from 'pathfinding';

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

export class ExternalPathfinder {
  private gridSize: number;
  private grid: PF.Grid;
  private finder: PF.AStarFinder;

  constructor(gridSize: number = 20) {
    this.gridSize = gridSize;
    this.finder = new PF.AStarFinder({
      allowDiagonal: false,
      dontCrossCorners: true
    });
  }

  private createGrid(obstacles: Rectangle[], bounds: { minX: number, minY: number, maxX: number, maxY: number }) {
    const width = Math.ceil((bounds.maxX - bounds.minX) / this.gridSize) + 10;
    const height = Math.ceil((bounds.maxY - bounds.minY) / this.gridSize) + 10;
    
    // Create walkable grid
    const matrix = Array(height).fill(null).map(() => Array(width).fill(0));
    
    // Mark obstacles
    obstacles.forEach(obstacle => {
      const startX = Math.max(0, Math.floor((obstacle.x - bounds.minX) / this.gridSize));
      const endX = Math.min(width - 1, Math.ceil((obstacle.x + obstacle.width - bounds.minX) / this.gridSize));
      const startY = Math.max(0, Math.floor((obstacle.y - bounds.minY) / this.gridSize));
      const endY = Math.min(height - 1, Math.ceil((obstacle.y + obstacle.height - bounds.minY) / this.gridSize));
      
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          matrix[y][x] = 1; // blocked
        }
      }
    });
    
    this.grid = new PF.Grid(matrix);
  }

  findPath(start: Point, end: Point, obstacles: Rectangle[]): Point[] {
    // Add horizontal stubs at start and end
    const stubLength = 30;
    const startStub = { x: start.x + (end.x > start.x ? stubLength : -stubLength), y: start.y };
    const endStub = { x: end.x + (end.x > start.x ? -stubLength : stubLength), y: end.y };
    
    // Calculate bounds
    const allPoints = [startStub, endStub, ...obstacles.flatMap(o => [
      { x: o.x, y: o.y },
      { x: o.x + o.width, y: o.y + o.height }
    ])];
    
    const bounds = {
      minX: Math.min(...allPoints.map(p => p.x)) - 100,
      minY: Math.min(...allPoints.map(p => p.y)) - 100,
      maxX: Math.max(...allPoints.map(p => p.x)) + 100,
      maxY: Math.max(...allPoints.map(p => p.y)) + 100
    };

    this.createGrid(obstacles, bounds);

    // Convert world coordinates to grid coordinates
    const startGrid = {
      x: Math.floor((startStub.x - bounds.minX) / this.gridSize),
      y: Math.floor((startStub.y - bounds.minY) / this.gridSize)
    };
    
    const endGrid = {
      x: Math.floor((endStub.x - bounds.minX) / this.gridSize),
      y: Math.floor((endStub.y - bounds.minY) / this.gridSize)
    };

    // Find path between stubs
    const path = this.finder.findPath(
      startGrid.x, startGrid.y,
      endGrid.x, endGrid.y,
      this.grid.clone()
    );

    if (path.length === 0) {
      // Fallback with stubs
      return [start, startStub, endStub, end];
    }

    // Convert back to world coordinates
    const worldPath = path.map(([x, y]) => ({
      x: bounds.minX + x * this.gridSize,
      y: bounds.minY + y * this.gridSize
    }));

    // Include stubs in final path
    const fullPath = [start, startStub, ...worldPath, endStub, end];
    return this.simplifyPath(fullPath);
  }

  private simplifyPath(path: Point[]): Point[] {
    if (path.length <= 2) return path;

    const simplified: Point[] = [path[0]];
    let current = path[0];

    for (let i = 1; i < path.length - 1; i++) {
      const next = path[i];
      const after = path[i + 1];

      // Check if we need to add this point (direction change)
      const dir1 = { x: next.x - current.x, y: next.y - current.y };
      const dir2 = { x: after.x - next.x, y: after.y - next.y };

      if (dir1.x !== dir2.x || dir1.y !== dir2.y) {
        simplified.push(next);
        current = next;
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  createSVGPath(points: Point[]): string {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  }
}