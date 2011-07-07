(function(){

//============================================================================//
function Grid(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    for (var i=0; i<cols; i++) {
        this.grid[i] = [];
        for (var j=0; j<rows; j++) {
            this.grid[i][j] = {
                empty: true,
                color: "rgb(255,255,255)",
                highlight: "rgb(255,255,255)",
                shadow: "rgb(255,255,255)",
                row: j,
                col: i
            };
        }
    }
}

Grid.prototype.is_empty_at = function(col, row) {
    return this.grid[col][row].empty;
}

Grid.prototype.is_overlapping = function(col, row) {
    if (col >= this.cols || col < 0) {
        return true;
    } else if (row >= this.rows || row < 0) {
        return true;
    } else if (!this.is_empty_at(col, row)) {
        return true;
    }
    return false;
}

Grid.prototype.is_at_bottom = function(col, row) {
    if (row+1 === this.rows) {
        return true;
    } else if (!this.is_empty_at(col, row+1)) {
        return true;
    }
    return false;
};

Grid.prototype.is_row_empty = function(row) {
    for (var j=0; j<this.cols; j++) {
        if (!this.is_empty_at(j,row)) {
            return false;
        }
    }
    return true;
};

Grid.prototype.drop_row = function(src, dest) {
    if (src >= dest) {
        throw "src row must be above dest row. (i.e. src < row must be true)";
    }
    for (var j=0; j<this.cols; j++) {
        this.grid[j][dest].color = this.grid[j][src].color;
        this.grid[j][dest].highlight = this.grid[j][src].highlight;
        this.grid[j][dest].shadow = this.grid[j][src].shadow;
        this.grid[j][dest].empty = this.grid[j][src].empty;
        this.grid[j][src].empty = true;
    }
};

Grid.prototype.is_row_full = function(row) {
    for (var j=0; j<this.cols; j++) {
        if (this.is_empty_at(j,row)) {
            return false;
        }
    }
    return true;
};

Grid.prototype.clear_row = function(row) {
    for (var j=0; j<this.cols; j++) {
        this.grid[j][row].empty = true;
    }
};

Grid.prototype.clear_lines = function() {
    console.log("Grid.clear_lines()");
    var line_count = 0;
    
    for (var i=0; i<this.rows; i++) {
        if (this.is_row_full(i)) {
            this.clear_row(i);
            line_count++;
        }
    }
    
    if (line_count > 0) {
        console.log("Grid.clear_lines(): "+line_count+" lines found");
        for (var i=this.rows-1; i>0; i--) {
            if (this.is_row_empty(i)) {
                var non_empty_row_found = false;
                for (var j=i; j>0; j--) {
                    if (!this.is_row_empty(j)) {
                        this.drop_row(j,i);
                        non_empty_row_found = true;
                        break;
                    }
                }
                if (!non_empty_row_found) {
                    break;
                }
            }
        }
    } else {
        console.log("Grid.clear_lines(): no lines found");
    }
    
    return line_count;
}


//============================================================================//
function ShapeGenerator() {
    this.shape_names = ["I","L","J","T","O","S","Z"];
    this.last_shapes = [];
    this.recent_shapes = {"I":0,"L":0,"J":0,"T":0,"O":0,"S":0,"Z":0};
}

ShapeGenerator.prototype.choose = function() {
    /* Every shape is used at least once before any single shape is used three 
       times. */
    var k = Math.floor(Math.random()*7);
    var name = this.shape_names[k];
    // check if shape has been used 3 or more times
    if (this.recent_shapes[name] >= 3) {
        return null;
    }
    this.recent_shapes[name] += 1;
    var all_greater_than_zero = true;
    for (var i=0; i<this.shape_names.length; i++) {
        var shape_name = this.shape_names[i];
        if (this.recent_shapes[shape_name] === 0) {
            all_greater_than_zero = false;
            break;
        }
    }
    if (all_greater_than_zero) {
        for (var i=0; i<this.shape_names.length; i++) {
            var shape_name = this.shape_names[i];
            this.recent_shapes[shape_name] -= 1;
        }
    }
    
    return new tetris.Shape(name);
}

ShapeGenerator.prototype.next = function() {
    var shape = null;
    do {
        shape = this.choose();
    } while (!shape);
    return shape;
}

tetris.ShapeGenerator = ShapeGenerator;

function DebugShapeGenerator() {
    this.shape_names = ["I","L","J","T","O","S","Z"];
    this.index = 0;
}

DebugShapeGenerator.prototype.next = function() {
    var name = this.shape_names[this.index];
    this.index = (this.index+1) % this.shape_names.length;
    return new tetris.Shape(name);
}

tetris.DebugShapeGenerator = DebugShapeGenerator;

//============================================================================//
function ActiveShape() {
    this.shape = null;
    this.center = [tetris.config.grid_columns/2-1, 1];
}

ActiveShape.prototype.cells = function() {
    return this.shape.positions(this.center[0], this.center[1]);
}

ActiveShape.prototype.move = function(dx, dy) {
    this.center[0] += dx;
    this.center[1] += dy;
}

ActiveShape.prototype.rotate = function(n) {
    this.shape.rotate(n);
}

ActiveShape.prototype.clear = function() {
    this.shape = null;
}

ActiveShape.prototype.color = function() {
    return this.shape.color;
}

ActiveShape.prototype.highlight = function() {
    return this.shape.highlight;
}

ActiveShape.prototype.shadow = function() {
    return this.shape.shadow;
}

ActiveShape.prototype.set = function(shape) {
    this.shape = shape;
    this.center = [tetris.config.grid_columns/2-1, 1];
}

ActiveShape.prototype.is_empty = function() {
    return this.shape === null;
}

//============================================================================//
function GameStatus() {
    this.score = 0;
    this.shapes = 0;
    this.lines = 0;
    this.level = 1;
}

GameStatus.prototype.on_shape_lock = function(lines) {
    this.lines += lines;
    if (this.lines/10 >= this.level) {
        this.level++;
    }
};

GameStatus.prototype.on_new_shape = function() {
    this.shapes++;
};

//============================================================================//
function GameTimer() {
    this.next_drop = Date.now();
    this.pause_time = null;
}

GameTimer.prototype.is_drop_time = function() {
    return this.next_drop <= Date.now();
};

GameTimer.prototype.set_drop_time = function(ms) {
    this.next_drop = Date.now() + ms;
};

GameTimer.prototype.pause = function() {
    if (this.pause_time === null) {
        this.pause_time = Date.now();
    }
};

GameTimer.prototype.unpause = function() {
    if (this.pause_time !== null) {
        this.next_drop += Date.now() - this.pause_time;
        this.pause_time = null;
    }
};

GameTimer.prototype.paused = function() {
    return this.pause_time !== null;
};

//============================================================================//
function Game() {
    this.grid = new Grid(tetris.config.grid_columns, tetris.config.grid_rows);
    //this.shape_generator = new tetris.DebugShapeGenerator();
    this.shape_generator = new tetris.ShapeGenerator();
    this.active_shape = new ActiveShape();
    //this.shape_pos = [];
    this.cells_dirty = true;
    this.shape_dirty = true;
    this.status_dirty = true;
    
    // game status?
    //this.paused = false;
    this.status = new GameStatus();
    this.game_over = false;
    this.timer = new GameTimer();
}

Game.prototype.get_cells = function() {
    return this.grid.grid;
};

Game.prototype.reset_next_drop = function() {
    this.timer.set_drop_time(1000);
};

/* Lock the active shape in place. This occurs when the shape hits the bottom 
   of the game grid, or when it drops onto occupied cells. */
Game.prototype.lock = function() {
    console.log("Game.lock()");
    if (this.active_shape.is_empty()) {
        throw "active_shape cannot be null when locking it";
    }
    var positions = this.active_shape.cells();
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        var col = pos[0];
        var row = pos[1];
        if (!this.grid.is_empty_at(col, row)) {
            throw "cannot lock shape: a cell is already occupied";
        }
        this.grid.grid[col][row].color = this.active_shape.color();
        this.grid.grid[col][row].highlight = this.active_shape.highlight();
        this.grid.grid[col][row].shadow = this.active_shape.shadow();
        this.grid.grid[col][row].empty = false;
    }
    var lines = this.grid.clear_lines();
    this.status.on_shape_lock(lines);
    this.status_dirty = true;
    this.cells_dirty = true;
    this.shape_dirty = true;
    this.active_shape.clear();
};

Game.prototype.is_overlapping = function() {
    var positions = this.active_shape.cells();
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        if (this.grid.is_overlapping(pos[0], pos[1])) {
            return true;
        }
    }
    return false;
};

Game.prototype.is_at_bottom = function() {
    //var positions = this.active_shape.positions(this.shape_pos[0], this.shape_pos[1]);
    var positions = this.active_shape.cells();
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        if (this.grid.is_at_bottom(pos[0], pos[1])) {
            return true;
        }
    }
    return false;
};

Game.prototype.do_drop = function() {
    //console.log("Game.do_drop()");
    if (this.active_shape.is_empty()) {
        throw "active_shape cannot be null when dropping it";
    }
    // if shape is above occupied squares or if it is in the bottom row, lock
    // if shape overlaps occupied squares, game over
    if (this.is_at_bottom()) {
        this.lock();
    } else {
        this.active_shape.move(0,1);
    }
    this.reset_next_drop();
    this.shape_dirty = true;
};

Game.prototype.new_shape = function() {
    console.log("Game.new_shape()");
    if (!this.active_shape.is_empty()) {
        throw "active_shape must be null when creating a new shape";
    }
    this.active_shape.set(this.shape_generator.next());
    
    // if shape overlaps occupied squares, game over
    if (this.is_overlapping()) {
        this.on_game_over();
    } else if (this.is_at_bottom()) {
        this.on_game_over();
    }
    this.status.on_new_shape();
    this.status_dirty = true;
    this.reset_next_drop();
    this.shape_dirty = true;
};

Game.prototype.on_game_over = function() {
    console.log("Game.on_game_over()");
    this.game_over = true;
};

Game.prototype.is_game_active = function() {
    return !this.active_shape.is_empty() && !this.game_over && !this.timer.paused();
};

Game.prototype.rotate_shape = function(n) {
    //console.log("Game.rotate_shape()");
    if (this.is_game_active()) {
        this.active_shape.rotate(n);
        if (this.is_overlapping()) {
            this.active_shape.rotate(-n);
            console.log("Game.rotate_shape(): rotate failed due to obstacle");
        }
        this.shape_dirty = true;
    }
};

Game.prototype.move_shape_horizontal = function(n) {
    //console.log("Game.move_shape_horizontal()");
    if (this.is_game_active()) {
        this.active_shape.move(n,0);
        if (this.is_overlapping()) {
            this.active_shape.move(-n,0);
            console.log("Game.move_shape_horizontal(): move failed due to obstacle");
        }
        this.shape_dirty = true;
    }
};

Game.prototype.drop_shape = function(n) {
    //console.log("Game.drop_shape()");
    if (this.is_game_active()) {
        this.do_drop();
    }
};

Game.prototype.pause = function(flag) {
    if (this.timer.paused() === flag) {
        // do nothing if we are already in the desired state
        return;
    }
    if (flag) {
        // pause
        this.timer.pause();
    } else {
        // unpause
        this.timer.unpause();
    }
};

Game.prototype.is_paused = function() {
    return this.timer.paused();
};

Game.prototype.on_turn = function() {
    if (this.game_over || this.timer.paused()) {
        return;
    }
    // is it time to drop the shape?
    if (this.timer.is_drop_time()) {
        if (this.active_shape.is_empty()) {
            this.new_shape();
        } else {
            this.do_drop();
        }
    }
};


tetris.Game = Game;

//============================================================================//
})();
