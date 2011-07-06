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
                row: j,
                col: i
            };
        }
    }
}

//============================================================================//
function ShapeGenerator() {
    this.shape_names = ["I","L","J","T","O","S","Z"];
    this.last_shapes = [];
}

ShapeGenerator.prototype.choose = function() {
    var k = Math.floor(Math.random()*7);
    var name = this.shape_names[k];
    // check if there are more than two occurrences of name
    var count = 0;
    for (var i=0; i<this.last_shapes.length; i++) {
        if (this.last_shapes[i] === name) {
            count++;
            if (count === 3) {
                return null;
            }
        }
    }
    this.last_shapes.push(name);
    if (this.last_shapes.length > 8) {
        this.last_shapes.splice(0, 1);
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

//============================================================================//
function Game() {
    this.grid = new Grid(tetris.config.grid_columns, tetris.config.grid_rows);
    this.paused = false;
    this.score = 0;
    this.level = 1;
    this.shape_generator = new tetris.ShapeGenerator();
    this.active_shape = null;
    this.shape_pos = [];
    this.next_drop = Date.now();
    this.cells_dirty = true;
    this.shape_dirty = true;
    this.game_over = false;
}

Game.prototype.get_cells = function() {
    return this.grid.grid;
};

Game.prototype.reset_next_drop = function() {
    this.next_drop = Date.now() + 1000;
};

Game.prototype.lock = function() {
    console.debug("Game.lock()");
    if (this.active_shape === null) {
        throw "active_shape cannot be null when locking it";
    }
    var positions = this.active_shape.positions(this.shape_pos[0], this.shape_pos[1]);
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        var col = pos[0];
        var row = pos[1];
        if (!this.grid.grid[col][row].empty) {
            throw "cannot lock shape: a cell is already occupied";
        }
        this.grid.grid[col][row].color = this.active_shape.color;
        this.grid.grid[col][row].empty = false;
    }
    this.cells_dirty = true;
    this.shape_dirty = true;
    this.active_shape = null;
    // TODO: check for lines
};

Game.prototype.is_overlapping = function() {
    var positions = this.active_shape.positions(this.shape_pos[0], this.shape_pos[1]);
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        if (pos[0] >= tetris.config.grid_columns || pos[0] < 0) {
            return true;
        } else if (pos[1] >= tetris.config.grid_rows || pos[1] < 0) {
            return true;
        } else if (!this.grid.grid[pos[0]][pos[1]].empty) {
            return true;
        }
    }
    return false;
};

Game.prototype.is_at_bottom = function() {
    var positions = this.active_shape.positions(this.shape_pos[0], this.shape_pos[1]);
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        if (pos[1]+1 === tetris.config.grid_rows) {
            return true;
        } else if (!this.grid.grid[pos[0]][pos[1]+1].empty) {
            return true;
        }
    }
    return false;
};

Game.prototype.do_drop = function() {
    console.debug("Game.do_drop()");
    if (this.active_shape === null) {
        throw "active_shape cannot be null when dropping it";
    }
    // if shape is above occupied squares or if it is in the bottom row, lock
    // if shape overlaps occupied squares, game over
    if (this.is_at_bottom()) {
        this.lock();
    } else {
        this.shape_pos[1]++;
    }
    this.reset_next_drop();
    this.shape_dirty = true;
};

Game.prototype.new_shape = function() {
    console.debug("Game.new_shape()");
    if (this.active_shape !== null) {
        throw "active_shape must be null when creating a new shape";
    }
    this.active_shape = this.shape_generator.next();
    this.shape_pos = [tetris.config.grid_columns/2-1, 1];
    // if shape overlaps occupied squares, game over
    if (this.is_overlapping()) {
        this.on_game_over();
    } else if (this.is_at_bottom()) {
        this.on_game_over();
    }
    this.reset_next_drop();
    this.shape_dirty = true;
};

Game.prototype.on_game_over = function() {
    console.debug("Game.on_game_over()");
    this.game_over = true;
}

Game.prototype.rotate_shape = function(n) {
    console.debug("Game.rotate_shape()");
    if (this.active_shape && !this.game_over) {
        this.active_shape.rotate(n);
        if (this.is_overlapping()) {
            this.active_shape.rotate(-n);
            console.debug("Game.rotate_shape(): rotate failed due to obstacle");
        } /*else if (this.is_at_bottom()) {
            this.lock();
        }*/
        this.shape_dirty = true;
    }
};

Game.prototype.move_shape_horizontal = function(n) {
    console.debug("Game.move_shape_horizontal()");
    if (this.active_shape && !this.game_over) {
        this.shape_pos[0] += n;
        if (this.is_overlapping()) {
            this.shape_pos[0] -= n;
            console.debug("Game.move_shape_horizontal(): move failed due to obstacle");
        } /*else if (this.is_at_bottom()) {
            this.lock();
        }*/
        this.shape_dirty = true;
    }
};

Game.prototype.drop_shape = function(n) {
    console.debug("Game.drop_shape()");
    if (this.active_shape && !this.game_over) {
        this.do_drop();
    }
};

Game.prototype.on_turn = function() {
    if (this.game_over) {
        return;
    }
    // is it time to drop the shape?
    var now = Date.now();
    if (this.next_drop <= now) {
        if (this.active_shape === null) {
            this.new_shape();
        } else {
            this.do_drop();
        }
    }
};


tetris.Game = Game;

//============================================================================//
})();
