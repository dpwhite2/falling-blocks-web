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
    logger.info("Starting application...");
    app = new tetris.App();
    tetris.set_handlers(app);
    interval_id = setInterval(tetris.on_tick, 5);
    requestAnimFrame(tetris.on_render, document.getElementById("main-canvas"));
};

tetris.on_render = function() {
    app.on_render();
};

tetris.on_tick = function() {
    app.on_tick();
};

tetris.set_handlers = function(app) {
    logger.debug("Setting event handlers...");
    window.onkeydown = function(event){ app.on_key_down(event); };
    window.onkeyup = function(event){ app.on_key_up(event); };
    window.onkeypress = function(event){ app.on_key_press(event); };
    window.onblur = function(event){ app.on_blur(event); };
};

//============================================================================//
function App() {
    this.canvas = new tetris.Canvas();
    this.new_game();
    //this.game = new tetris.Game();
    this.keys_down = {};
}

App.prototype.on_render = function() {
    //var start = Date.now();
    this.canvas.paint();
    //logger.log("paint time: "+ (Date.now()-start));
    
    this.update_time();
    
    requestAnimFrame(tetris.on_render, document.getElementById("main-canvas"));
};

App.prototype.on_tick = function() {
    this.handle_down_keys();
    this.game.on_turn();
    this.update_canvas();
};

App.prototype.update_time = function() {
    var t = this.game.timer.elapsed();
    var sec = t % 60;
    var min = Math.floor(t / 60.0);
    var s = min.toFixed(0) + ":" + ((sec < 10) ? "0" + sec.toFixed(1) : sec.toFixed(1));
    document.getElementById("elapsed").textContent = s;
};

App.prototype.print_score = function() {
    var score = this.game.status.score.toString();
    while (score.length < 6) {
        score = "0" + score;
    }
    document.getElementById("score").textContent = score;
    
    document.getElementById("level").textContent = this.game.status.level;
    document.getElementById("lines").textContent = this.game.status.lines;
    document.getElementById("shapes").textContent = this.game.status.shapes;
    this.update_time();
    
    document.getElementById("shapes-I").textContent = this.game.status.shape_counts["I"];
    document.getElementById("shapes-L").textContent = this.game.status.shape_counts["L"];
    document.getElementById("shapes-J").textContent = this.game.status.shape_counts["J"];
    document.getElementById("shapes-T").textContent = this.game.status.shape_counts["T"];
    document.getElementById("shapes-O").textContent = this.game.status.shape_counts["O"];
    document.getElementById("shapes-S").textContent = this.game.status.shape_counts["S"];
    document.getElementById("shapes-Z").textContent = this.game.status.shape_counts["Z"];
};

App.prototype.update_canvas = function(options) {
    var options = options || {};
    if (this.game.cells_dirty || options.force_draw_cells) {
        this.canvas.draw_cells(this.game.get_cells());
        this.game.cells_dirty = false;
    }
    if (this.game.status_dirty) {
        this.print_score();
        this.game.status_dirty = false;
    }
    if (this.game.shape_dirty || options.force_draw_shape) {
        if (!this.game.active_shape.is_empty()) {
            this.canvas.draw_active_shape(this.game.active_shape);
        } else {
            this.canvas.clear_active_shape();
        }
        if (this.game.game_over) {
            this.canvas.draw_game_over();
        }
        this.game.shape_dirty = false;
    }
};

App.prototype.new_game = function() {
    logger.info("App.new_game()");
    this.game = new tetris.Game();
};

var LEFT_ARROW = 37; // same in all browsers
var UP_ARROW = 38; // same in all browsers
var RIGHT_ARROW = 39; // same in all browsers
var DOWN_ARROW = 40; // same in all browsers
var SPACEBAR = 32; // same in all browsers

App.prototype.handle_down_keys = function() {
    var now = Date.now();
    for (var keyCode in this.keys_down) {
        if (this.keys_down[keyCode].time < now) {
            this.keys_down[keyCode].func.apply(this);
            this.keys_down[keyCode].time = now + tetris.config.key_repeat_delay;
        }
    }
};

App.prototype.on_up_arrow = function() {
    this.game.rotate_shape(1);
    this.update_canvas();
};

App.prototype.on_left_arrow = function() {
    this.game.move_shape_horizontal(-1);
    this.update_canvas();
};

App.prototype.on_right_arrow = function() {
    this.game.move_shape_horizontal(1);
    this.update_canvas();
};

App.prototype.on_down_arrow = function() {
    this.game.soft_drop();
    this.update_canvas();
};

App.prototype.on_key_down = function(event) {
    if (event.keyCode in this.keys_down) {
        // ignore if the key is already pressed
        event.preventDefault();
        return;
    }
    if (tetris.config.debug) {
        logger.debug("App.on_key_down()");
    }
    if (event.keyCode === UP_ARROW) {
        this.on_up_arrow();
        this.keys_down[UP_ARROW] = { func: this.on_up_arrow, 
                                     time: Date.now()+tetris.config.initial_key_repeat_delay };
        event.preventDefault();
    }
    else if (event.keyCode === LEFT_ARROW) {
        this.on_left_arrow();
        this.keys_down[LEFT_ARROW] = { func: this.on_left_arrow, 
                                       time: Date.now()+tetris.config.initial_key_repeat_delay };
        event.preventDefault();
    }
    else if (event.keyCode === RIGHT_ARROW) {
        this.on_right_arrow();
        this.keys_down[RIGHT_ARROW] = { func: this.on_right_arrow, 
                                        time: Date.now()+tetris.config.initial_key_repeat_delay };
        event.preventDefault();
    }
    else if (event.keyCode === DOWN_ARROW) {
        this.on_down_arrow();
        this.keys_down[DOWN_ARROW] = { func: this.on_down_arrow, 
                                       time: Date.now()+tetris.config.initial_key_repeat_delay };
        event.preventDefault();
    }
};

App.prototype.on_key_up = function(event) {
    //logger.log("App.on_key_up()");
    if (event.keyCode in this.keys_down) {
        //logger.log("App.on_key_up(): keyCode in this.keys_down...");
        delete this.keys_down[event.keyCode];
        event.preventDefault();
    }
};

/* Handle character key events. */
App.prototype.on_key_press = function(event) {
    if (tetris.config.debug) {
        logger.debug("App.on_key_press()");
    }
    //logger.log(event);
    var c = String.fromCharCode(event.charCode);
    if (c === "p" || c === "P") {
        if (this.game.is_paused()) {
            this.game.pause(false);
            this.canvas.set_unpaused();
            interval_id = window.setInterval(tetris.on_tick, 5);
            this.update_canvas({force_draw_cells: true, force_draw_shape: true});
        } else {
            this.game.pause(true);
            this.canvas.set_paused();
            window.clearInterval(interval_id);
            this.update_canvas();
        }
        event.preventDefault();
    } 
    else if (c === "n") {
        this.new_game();
    }
    else if (c === " ") {
        this.game.hard_drop();
    }
};

App.prototype.on_blur = function(event) {
    logger.debug("App.on_blur()");
    //logger.log(event);
    if (!this.game.is_paused()) {
        this.game.pause(true);
        this.canvas.set_paused();
        window.clearInterval(interval_id);
        this.update_canvas();
    }
};

tetris.App = App;

//============================================================================//
})();

