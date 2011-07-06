/* 
requestAnimFrame taken from: 
    http://paulirish.com/2011/requestanimationframe-for-smart-animating/
*/
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
            };
})();


(function(){
//============================================================================//
var interval_id = null;

tetris.start = function() {
    // create game
    //var canvas = new tetris.Canvas();
    app = new tetris.App();
    tetris.set_handlers(app);
    interval_id = setInterval(tetris.on_tick, 4);
    requestAnimFrame(tetris.on_render, document.getElementById("main-canvas"));
};

tetris.on_render = function() {
    app.on_render();
};

tetris.on_tick = function() {
    app.on_tick();
};

tetris.set_handlers = function(app) {
    window.onkeydown = function(event){ app.on_key_down(event) };
};

//============================================================================//
function App() {
    this.canvas = new tetris.Canvas();
    this.game = new tetris.Game();
    // this.game.grid.grid[0][0].empty = false;
    // this.game.grid.grid[0][1].empty = false;
    // this.game.grid.grid[0][2].empty = false;
    // this.game.grid.grid[1][1].empty = false;
    // this.game.grid.grid[2][2].empty = false;
}

App.prototype.on_render = function() {
    this.canvas.paint();
    
    requestAnimFrame(tetris.on_render, document.getElementById("main-canvas"));
};

App.prototype.on_tick = function() {
    this.game.on_turn();
    this.update_canvas();
};

App.prototype.update_canvas = function() {
    if (this.game.cells_dirty) {
        this.canvas.draw_cells(this.game.get_cells());
        this.game.cells_dirty = false;
    }
    if (this.game.shape_dirty) {
        if (!this.game.active_shape.is_empty()) {
            this.canvas.draw_active_shape(this.game.active_shape);
        } else {
            this.canvas.clear_active_shape();
        }
        this.game.shape_dirty = false;
    }
}

var LEFT_ARROW = 37; // same in all browsers
var UP_ARROW = 38; // same in all browsers
var RIGHT_ARROW = 39; // same in all browsers
var DOWN_ARROW = 40; // same in all browsers
var SPACEBAR = 32; // same in all browsers

App.prototype.on_key_down = function(event) {
    console.log("App.on_key()");
    if (!window.KeyEvent) {
        KeyEvent = window.KeyboardEvent;
    }
    //console.log(KeyEvent);
    //console.log(event);
    if (event.keyCode === UP_ARROW) {
        this.game.rotate_shape(1);
        this.update_canvas();
        event.preventDefault();
    }
    else if (event.keyCode === LEFT_ARROW) {
        this.game.move_shape_horizontal(-1);
        this.update_canvas();
        event.preventDefault();
    }
    else if (event.keyCode === RIGHT_ARROW) {
        this.game.move_shape_horizontal(1);
        this.update_canvas();
        event.preventDefault();
    }
    else if (event.keyCode === DOWN_ARROW) {
        this.game.drop_shape();
        this.update_canvas();
        event.preventDefault();
    }
    
};

tetris.App = App;

//============================================================================//
})();

