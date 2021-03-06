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
                col: i,
                just_dropped: false
            };
        }
    }
    this.just_dropped_cells = [];
}

Grid.prototype.reset_just_dropped = function() {
    for (var i=0; i< this.just_dropped_cells.length; i++) {
        var col = this.just_dropped_cells[i][0];
        var row = this.just_dropped_cells[i][1];
        this.grid[col][row].just_dropped = false;
    }
    this.just_dropped = [];
}

Grid.prototype.set_cell = function(col, row, options) {
    this.grid[col][row].empty = options.empty ? true : false;
    this.grid[col][row].color = options.color || "rgb(255,255,255)";
    this.grid[col][row].highlight = options.highlight || "rgb(255,255,255)";
    this.grid[col][row].shadow = options.shadow || "rgb(255,255,255)";
    this.grid[col][row].just_dropped = options.just_dropped || false;
    if (options.just_dropped) {
        this.just_dropped_cells.push([col,row]);
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
        this.grid[j][dest].just_dropped = this.grid[j][src].just_dropped;
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
    logger.log("Grid.clear_lines()");
    var line_count = 0;
    
    for (var i=0; i<this.rows; i++) {
        if (this.is_row_full(i)) {
            this.clear_row(i);
            line_count++;
        }
    }
    
    if (line_count > 0) {
        logger.log("Grid.clear_lines(): "+line_count+" lines found");
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
        logger.log("Grid.clear_lines(): no lines found");
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
    /* Every shape is used at least once before any single shape is used more 
       than three times. */
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

ActiveShape.prototype.name = function() {
    return this.shape.name;
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
    this.soft_drop_dist = 0;
    this.hard_drop_start = -1;
    this.shape_counts = {"I": 0, "L": 0, "J": 0, "T": 0, "O": 0, "S": 0, "Z": 0};
}

var lines_score_lookup = {
    0: 0,
    1: 40,
    2: 100,
    3: 300,
    4: 1200
};

GameStatus.prototype.calc_points = function(hard_drop_dist, soft_drop_dist, lines) {
    var points = lines_score_lookup[lines] * this.level;
    points += hard_drop_dist * 2 * this.level;
    points += soft_drop_dist * 1 * this.level;
    return points;
};

GameStatus.prototype.on_shape_lock = function(lines, active_shape) {
    var hard_drop_dist = 0;
    var soft_drop_dist = this.soft_drop_dist;
    if (this.hard_drop_start !== -1) {
        hard_drop_dist = active_shape.center[1] - this.hard_drop_start;
    }
    var points = this.calc_points(hard_drop_dist, soft_drop_dist, lines);
    this.lines += lines;
    if (this.lines/10 >= this.level) {
        this.level++;
    }
    logger.log("Scoring info:\n  lines: "+lines+"\n  hard_drop_dist: "+hard_drop_dist+"\n  soft_drop_dist: "+soft_drop_dist+"\n  points: "+points);
    this.score += points;
};

GameStatus.prototype.on_new_shape = function(active_shape) {
    this.shape_counts[active_shape.name()]++;
    this.soft_drop_dist = 0;
    this.hard_drop_start = -1;
    this.shapes++;
};

GameStatus.prototype.on_soft_drop = function() {
    this.soft_drop_dist++;
};

GameStatus.prototype.on_hard_drop = function(active_shape) {
    this.soft_drop_dist = 0;
    this.hard_drop_start = active_shape.center[1];
};

GameStatus.prototype.on_auto_drop = function() {
    this.soft_drop_dist = 0;
};

var drop_intervals = [
    1000, // not used (there is no level 0)
    1000, // level 1
     817, // level 2
     667, // level 3
     533, // level 4
     433, // level 5
     367, // level 6
     300, // level 7
     233, // level 8
     200, // level 9
     167, // level 10
     133, // level 11
     100, // level 12
      83, // level 13
      67, // level 14
      50, // level 15
      33, // level 16
      17, // level 17
];

GameStatus.prototype.drop_interval = function() {
    if (this.level >= drop_intervals.length) {
        return drop_intervals[drop_intervals.length-1];
    } else {
        return drop_intervals[this.level];
    }
};

//============================================================================//
function GameTimer() {
    this.next_drop = Date.now();
    this.pause_time = null;
    this.start_time = Date.now();
    this.cumulative_paused_time = 0;
}

GameTimer.prototype.is_drop_time = function() {
    return this.next_drop <= Date.now();
};

/* The next drop will occur 'ms' milliseconds in the future. */
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
        var now = Date.now();
        this.next_drop += now - this.pause_time;
        this.cumulative_paused_time += now - this.pause_time;
        this.pause_time = null;
    }
};

GameTimer.prototype.paused = function() {
    return this.pause_time !== null;
};

GameTimer.prototype.elapsed = function() {
    if (this.pause_time !== null) {
        var ms = (this.pause_time - this.start_time) - this.cumulative_paused_time;
    } else {
        var ms = (Date.now() - this.start_time) - this.cumulative_paused_time;
    }
    return ms / 1000;
};

//============================================================================//
function Game() {
    this.grid = new Grid(tetris.config.grid_columns, tetris.config.grid_rows);
    //this.shape_generator = new tetris.DebugShapeGenerator();
    this.shape_generator = new tetris.ShapeGenerator();
    this.active_shape = new ActiveShape();
    this.cells_dirty = true;
    this.shape_dirty = true;
    this.status_dirty = true;
    
    this.status = new GameStatus();
    this.game_over = false;
    this.timer = new GameTimer();
}

Game.prototype.get_cells = function() {
    return this.grid.grid;
};

Game.prototype.reset_next_drop = function() {
    this.timer.set_drop_time(this.status.drop_interval());
};

/* Lock the active shape in place. This occurs when the shape hits the bottom 
   of the game grid, or when it drops onto occupied cells. */
Game.prototype.lock = function() {
    logger.debug("Game.lock()");
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
        var options = {
            color: this.active_shape.color(),
            highlight: this.active_shape.highlight(),
            shadow: this.active_shape.shadow(),
            empty: false,
            just_dropped: true
        };
        this.grid.set_cell(col, row, options);
    }
    var lines = this.grid.clear_lines();
    this.status.on_shape_lock(lines, this.active_shape);
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

Game.prototype.do_drop = function(n) {
    //logger.log("Game.do_drop()");
    var n = n || 1;
    if (this.active_shape.is_empty()) {
        throw "active_shape cannot be null when dropping it";
    }
    // if shape is above occupied squares or if it is in the bottom row, lock
    // if shape overlaps occupied squares, game over
    for (var i=0; i<n; i++) {
        if (this.is_at_bottom()) {
            this.lock();
            break;
        } else {
            this.active_shape.move(0,1);
        }
    }
    this.reset_next_drop();
    this.shape_dirty = true;
};

Game.prototype.new_shape = function() {
    logger.debug("Game.new_shape()");
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
    this.status.on_new_shape(this.active_shape);
    this.grid.reset_just_dropped();
    this.reset_next_drop();
    this.status_dirty = true;
    this.shape_dirty = true;
    this.cells_dirty = true;
};

Game.prototype.on_game_over = function() {
    logger.log("Game.on_game_over()");
    this.game_over = true;
    this.timer.pause();
};

Game.prototype.is_game_active = function() {
    return !this.active_shape.is_empty() && !this.game_over && !this.timer.paused();
};

Game.prototype.rotate_shape = function(n) {
    //logger.log("Game.rotate_shape()");
    if (this.is_game_active()) {
        this.active_shape.rotate(n);
        
        if (this.is_overlapping()) {
            // try moving left
            this.active_shape.move(-1,0);
            if (this.is_overlapping()) {
                // try moving right
                this.active_shape.move(2,0);
                if (this.is_overlapping()) {
                    // return to original position, and undo rotation
                    this.active_shape.move(-1,0);
                    this.active_shape.rotate(-n);
                    if (tetris.config.debug) {
                        logger.debug("Game.rotate_shape(): rotate failed due to obstacle");
                    }
                }
            }
        }
        this.shape_dirty = true;
    }
};

Game.prototype.move_shape_horizontal = function(n) {
    //logger.log("Game.move_shape_horizontal()");
    if (this.is_game_active()) {
        this.active_shape.move(n,0);
        if (this.is_overlapping()) {
            this.active_shape.move(-n,0);
            if (tetris.config.debug) {
                logger.debug("Game.move_shape_horizontal(): move failed due to obstacle");
            }
        }
        this.shape_dirty = true;
    }
};

Game.prototype.soft_drop = function(n) {
    //logger.log("Game.soft_drop()");
    if (this.is_game_active()) {
        this.status.on_soft_drop();
        this.do_drop();
    }
};

Game.prototype.hard_drop = function() {
    //logger.log("Game.soft_drop()");
    if (this.is_game_active()) {
        this.status.on_hard_drop(this.active_shape);
        this.do_drop(tetris.config.grid_rows);
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
        if (!this.game_over) {
            // unpause
            this.timer.unpause();
        }
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
            this.status.on_auto_drop();
            this.do_drop();
        }
    }
};


tetris.Game = Game;

//============================================================================//
})();
