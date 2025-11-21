import { Table } from '@/types/schema';

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

export class PathFinder {
  private tables: Table[];
  private padding: number;

  constructor(tables: Table[], padding = 30) {
    this.tables = tables;
    this.padding = padding;
  }

  private getTableBounds(table: Table): Rectangle {
    return {
      x: table.position.x - this.padding,
      y: table.position.y - this.padding,
      width: 420 + (this.padding * 2),
      height: Math.max(120, 60 + table.columns.length * 40) + (this.padding * 2)
    };
  }

  private isPointInRectangle(point: Point, rect: Rectangle): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }

  private lineIntersectsRectangle(start: Point, end: Point, rect: Rectangle): boolean {
    // Check if line segment intersects with rectangle
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    // Check intersection with each edge of rectangle
    return this.lineIntersectsLine(start, end, {x: left, y: top}, {x: right, y: top}) ||
           this.lineIntersectsLine(start, end, {x: right, y: top}, {x: right, y: bottom}) ||
           this.lineIntersectsLine(start, end, {x: right, y: bottom}, {x: left, y: bottom}) ||
           this.lineIntersectsLine(start, end, {x: left, y: bottom}, {x: left, y: top});
  }

  private lineIntersectsLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0) return false;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  public findPath(start: Point, end: Point, excludeTables: string[] = []): Point[] {
    const obstacles = this.tables
      .filter(table => !excludeTables.includes(table.id))
      .map(table => this.getTableBounds(table));

    // Always use orthogonal routing with bends
    const waypoints: Point[] = [start];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Create orthogonal path with multiple segments
    const stepOut = 50; // Distance to step out from connection point
    
    // Step 1: Move out from start point
    const startOut = {
      x: start.x + (dx > 0 ? stepOut : -stepOut),
      y: start.y
    };
    waypoints.push(startOut);
    
    // Step 2: Create intermediate waypoints for routing around obstacles
    const midX = (startOut.x + end.x) / 2;
    const routeY = this.findClearHorizontalRoute(startOut.y, end.y, startOut.x, end.x, obstacles);
    
    // Add horizontal routing waypoints
    waypoints.push({ x: startOut.x, y: routeY });
    waypoints.push({ x: end.x + (dx > 0 ? -stepOut : stepOut), y: routeY });
    
    // Step 3: Move to target level
    waypoints.push({ x: end.x + (dx > 0 ? -stepOut : stepOut), y: end.y });
    
    waypoints.push(end);

    // Clean up and optimize waypoints
    return this.optimizeWaypoints(waypoints, obstacles);
  }

  private findClearHorizontalRoute(startY: number, endY: number, startX: number, endX: number, obstacles: Rectangle[]): number {
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    const leftX = Math.min(startX, endX);
    const rightX = Math.max(startX, endX);
    
    // Try the direct horizontal route first
    const directY = (startY + endY) / 2;
    const directClear = !obstacles.some(rect => 
      rect.y <= directY && rect.y + rect.height >= directY &&
      rect.x <= rightX && rect.x + rect.width >= leftX
    );
    
    if (directClear) return directY;
    
    // Try routes above and below
    for (let offset = 50; offset <= 200; offset += 50) {
      // Try above
      const aboveY = minY - offset;
      const aboveClear = !obstacles.some(rect => 
        rect.y <= aboveY && rect.y + rect.height >= aboveY &&
        rect.x <= rightX && rect.x + rect.width >= leftX
      );
      if (aboveClear) return aboveY;
      
      // Try below
      const belowY = maxY + offset;
      const belowClear = !obstacles.some(rect => 
        rect.y <= belowY && rect.y + rect.height >= belowY &&
        rect.x <= rightX && rect.x + rect.width >= leftX
      );
      if (belowClear) return belowY;
    }
    
    return directY; // Fallback
  }

  private optimizeWaypoints(waypoints: Point[], obstacles: Rectangle[]): Point[] {
    // Remove redundant waypoints that are in straight lines
    const optimized: Point[] = [waypoints[0]];
    
    for (let i = 1; i < waypoints.length - 1; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      
      // Keep waypoint if it creates a bend (not collinear)
      const isCollinear = (prev.x === curr.x && curr.x === next.x) || 
                         (prev.y === curr.y && curr.y === next.y);
      
      if (!isCollinear) {
        optimized.push(curr);
      }
    }
    
    optimized.push(waypoints[waypoints.length - 1]);
    return optimized;
  }


}