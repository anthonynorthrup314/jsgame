namespace JSGame {
    export class Grid {
        private width: number;
        private height: number;
        private cell_size: number;
        private cells: Array<Array<Cell>>;

        constructor(width: number, height: number, cell_size: number) {
            this.width = Math.ceil(width / cell_size);
            this.height = Math.ceil(height / cell_size);
            this.cell_size = cell_size;

            // Create cell grid
            this.cells = new Array<Array<Cell>>();
            for (let i = 0; i < this.width; i++) {
                let row = new Array<Cell>();
                for (let j = 0; j < this.height; j++)
                    row.push(new Cell(j, i, null));
                this.cells.push(row);
            }
        }

        public log(): void {
            console.log(this.cells);
            for (let row = 0; row < this.height; row++)
                for (let col = 0; col < this.width; col++)
                    console.log(row, col, this.cells[row][col]);
        }

        private extent(item: Item): [number, number, number, number] {
            return [
                Math.min(Math.max(0, Math.floor(item.x / this.cell_size)), this.width - 1),
                Math.min(Math.max(0, Math.floor(item.y / this.cell_size)), this.height - 1),
                Math.min(Math.max(0, Math.floor((item.x + item.width) / this.cell_size)), this.width - 1),
                Math.min(Math.max(0, Math.floor((item.y + item.height) / this.cell_size)), this.height - 1)
            ];
        }

        private addToCell(item: Item, cell: Cell): void {
            let p = new Pointer(cell, item, null, cell.head);
            cell.head = p;
            item.pointers.push(p);
        }

        private removeFromCell(p: Pointer): void {
            if (p.prev != null)
                p.prev.next = p.next;
            if (p.next != null)
                p.next.prev = p.prev;
            if (p.cell.head == p)
                p.cell.head = p.next;
        }

        public add(item: Item): void {
            // Add item to each cell in extent
            let [left, top, right, bottom] = this.extent(item);
            for (let row = top; row <= bottom; row++)
                for (let col = left; col <= right; col++)
                    this.addToCell(item, this.cells[row][col]);
        }

        public move(item: Item, x: number, y: number): void {
            // Didn't move at all?
            if (item.x == x && item.y == y)
                return;

            // Move and calculate extent before and after
            let [old_left, old_top, old_right, old_bottom] = this.extent(item);
            item.x = x;
            item.y = y;
            let [left, top, right, bottom] = this.extent(item);

            // Extent didn't change?
            if (old_left == left && old_top == top && old_right == right && old_bottom == bottom)
                return;
            
            // Remove from old cells
            let stillActive: Array<Cell> = new Array<Cell>();
            for (let i = 0; i < item.pointers.length; i++) {
                let p = item.pointers[i],
                    cell = p.cell;
                // Is still used?
                if (cell.row >= left && cell.col >= top && cell.row <= right && cell.col <= bottom) {
                    stillActive.push(cell);
                    continue;
                }
                this.removeFromCell(p);
                item.pointers.splice(i, 1);
                i--;
            }

            // Add to new cells
            for (let row = top; row <= bottom; row++)
                for (let col = left; col <= right; col++) {
                    let cell = this.cells[row][col],
                        shouldSkip = false;
                    // Already in cell?
                    for (let i = 0; i < stillActive.length; i++)
                        if (cell.equals(stillActive[i])) {
                            shouldSkip = true;
                            break;
                        }
                    if (shouldSkip)
                        continue;
                    this.addToCell(item, cell);
                }
        }

        public remove(item: Item): void {
            for (let i = 0; i < item.pointers.length; i++)
                this.removeFromCell(item.pointers[i]);
            item.pointers.splice(0);
        }
    }

    export class Cell {
        public row: number;
        public col: number;
        public head: Pointer;

        public constructor(row: number, col: number, head: Pointer) {
            this.row = row;
            this.col = col;
            this.head = head;
        }

        public equals(other: Cell): boolean {
            return this.row == other.row && this.col == other.col;
        }
    }

    export class Item {
        public pointers: Array<Pointer>;
        public x: number;
        public y: number;
        public width: number;
        public height: number;

        public constructor(x: number, y: number, width: number, height: number) {
            this.pointers = new Array<Pointer>();
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
    }

    export class Pointer {
        public cell: Cell;
        public item: Item;
        public prev: Pointer;
        public next: Pointer;

        constructor(cell: Cell, item: Item, prev: Pointer = null, next: Pointer = null) {
            this.cell = cell;
            this.item = item;
            this.prev = prev;
            this.next = next;
        }
    }
}
