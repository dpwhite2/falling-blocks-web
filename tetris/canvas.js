
(function(){
//============================================================================//
// Utility functions
function font(size, style) {
    var style = style || "";
    return style + " " + size.valueOf() + "px " + "sans-serif";
}

//============================================================================//
function ShapesLayer(offset_x, offset_y) {
    this.offset_x = offset_x;
    this.offset_y = offset_y;
    this.cell_size = tetris.config.cell_size;
    this.cell_border = tetris.config.cell_border_size;
    this.width = (this.cell_size + this.cell_border) * tetris.config.grid_columns + this.cell_border;
    this.height = (this.cell_size + this.cell_border) * tetris.config.grid_rows + this.cell_border;
    
    this.cells_canvas = document.getElementById(tetris.config.cells_canvas_id);
    this.shape_canvas = document.getElementById(tetris.config.shape_canvas_id);
    
    this.cells_canvas.width = this.width;
    this.cells_canvas.height = this.height;
    this.shape_canvas.width = this.width;
    this.shape_canvas.height = this.height;
}

ShapesLayer.prototype.paint = function(rc) {
    rc.drawImage(this.cells_canvas, 0,0, this.width, this.height, 
                 this.offset_x, this.offset_y, this.width, this.height);
    rc.drawImage(this.shape_canvas, 0,0, this.width, this.height, 
                 this.offset_x, this.offset_y, this.width, this.height);
};

ShapesLayer.prototype.clear_canvas = function(rc) {
    rc.save();
    rc.globalCompositeOperation = "copy";
    rc.fillStyle = "rgba(255,255,255,0)";
    rc.fillRect(0, 0, this.width, this.height);
    rc.restore();
};

ShapesLayer.prototype.paint_cell = function(rc, col, row, color, highlight, shadow, stroke_color) {
    rc.fillStyle = color;
    rc.strokeStyle = stroke_color;
    
    var x = this.cell_border + col * (this.cell_size + this.cell_border);
    var y = this.cell_border + row * (this.cell_size + this.cell_border);
    //logger.log("ShapesLayer.paint_cell()... x="+x+", y="+y);
    rc.fillRect(x, y, this.cell_size, this.cell_size);
    if (this.cell_border > 0) {
        rc.strokeRect(x-this.cell_border/2, y-this.cell_border/2, 
                      this.cell_size+this.cell_border, this.cell_size+this.cell_border);
    }
    
    var border_offset = this.cell_border * 2;
    var shadow_size = tetris.config.cell_shadow_size;
    
    rc.fillStyle = shadow;
    rc.fillRect(x+this.cell_size-shadow_size,y, shadow_size,this.cell_size);
    rc.fillRect(x,y+this.cell_size-shadow_size, this.cell_size,shadow_size);
    rc.fillRect(x+shadow_size+2, y+shadow_size+2, 1, this.cell_size-2*shadow_size-2);
    rc.fillRect(x+shadow_size+2, y+shadow_size+2, this.cell_size-2*shadow_size-2, 1);
    
    rc.fillStyle = highlight;
    for (var i=0; i<shadow_size; i++) {
        rc.fillRect(x+i,y, 1,this.cell_size-i);
        rc.fillRect(x,y+i, this.cell_size-i,1);
    }
    rc.fillRect(x+this.cell_size-shadow_size-2, y+shadow_size+1, 
                1, this.cell_size-2*shadow_size-2);
    rc.fillRect(x+shadow_size+1, y+this.cell_size-shadow_size-2, 
                this.cell_size-2*shadow_size-2, 1);
};

ShapesLayer.prototype.clear_active_shape = function() {
    // clear shape_canvas (with transparent alpha)
    var rc = this.shape_canvas.getContext("2d");
    this.clear_canvas(rc);
};

ShapesLayer.prototype.draw_active_shape = function(shape) {
    // clear shape_canvas (with transparent alpha)
    var rc = this.shape_canvas.getContext("2d");
    this.clear_canvas(rc);
    // draw shape on canvas
    var stroke_color = "rgba(0,0,0,255)";
    rc.lineWidth = this.cell_border.toFixed(0);
    var positions = shape.cells();
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        this.paint_cell(rc, pos[0], pos[1], shape.color(), shape.highlight(), 
                        shape.shadow(), stroke_color);
    }
};

ShapesLayer.prototype.draw_cells = function(cells) {
    // clear cells_canvas (with transparent alpha)
    var rc = this.cells_canvas.getContext("2d");
    this.clear_canvas(rc);
    // draw cells on canvas
    rc.lineWidth = this.cell_border.toFixed(0);
    for (var i=0; i<cells.length; i++) {
        for (var j=0; j<cells[i].length; j++) {
            var cell = cells[i][j];
            if (!cell.empty) {
                var stroke_color = cell.just_dropped ? "rgba(255,255,255,0)" : "rgba(0,0,0,255)";
                this.paint_cell(rc, cell.col, cell.row, cell.color, 
                                cell.highlight, cell.shadow, stroke_color);
            }
        }
    }
};

ShapesLayer.prototype.draw_game_over = function() {
    var rc = this.shape_canvas.getContext("2d");
    rc.save();
    var gameover_text = "GAME OVER";
    var help_text = "Press \"N\" to start a new game.";
    var font_size1 = 28;
    var font_size2 = 12;
    var vspacing = font_size2+10;
    
    rc.font = font(font_size1);
    var w1 = rc.measureText(gameover_text).width +20;
    rc.font = font(font_size2);
    var w2 = rc.measureText(help_text).width +20;
    var w = Math.max(w1, w2);
    w = Math.min(w, this.shape_canvas.width);
    
    /* Draw white background rectangle */
    var x = this.shape_canvas.width/2 - w/2;
    var y = this.shape_canvas.height/3;
    rc.fillStyle = "rgba(255,255,255,255)";
    rc.fillRect(x, y-font_size1, w, font_size1+font_size2+vspacing);
    
    /* Draw "GAME OVER" text */
    rc.fillStyle = "rgba(0,0,0,255)";
    rc.textAlign = "center";
    rc.font = font(font_size1);
    x = this.shape_canvas.width/2;
    y = this.shape_canvas.height/3;
    rc.fillText(gameover_text, x, y);
    
    /* Draw "Press 'N' to start a new game." text */
    rc.font = font(font_size2);
    x = this.shape_canvas.width/2;
    y = this.shape_canvas.height/3 + vspacing;
    rc.fillText(help_text, x, y);
    
    rc.restore();
};

ShapesLayer.prototype.set_paused = function() {
    var rc = this.cells_canvas.getContext("2d");

    if (!tetris.config.debug) {
        rc.fillStyle = "rgba(255,255,255,255)";
        rc.fillRect(0, 0, this.cells_canvas.width, this.cells_canvas.height);
    }
    
    rc.fillStyle = "rgba(0,0,0,255)";
    //rc.font = "28px Times New Roman, sans-serif";
    rc.font = font(28);
    rc.textAlign = "center";
    rc.fillText("PAUSED", this.cells_canvas.width/2, this.cells_canvas.height/3);
    //rc.font = "12px sans-serif";
    rc.font = font(12);
    rc.fillText("Press \u201CP\u201D to unpause.", this.cells_canvas.width/2, this.cells_canvas.height/3 + 22);
    
    if (!tetris.config.debug) {
        rc = this.shape_canvas.getContext("2d");
        this.clear_canvas(rc);
    }
};

ShapesLayer.prototype.set_unpaused = function() {
    var rc = this.cells_canvas.getContext("2d");
    this.clear_canvas(rc);
};



//============================================================================//
function InfoRegion() {

}

function InfoLayer() {
    this.offset_x = 0;
    this.offset_y = 0;
    this.width = 0;
    this.height = 0;
    this.padd;
    
    this.canvas = document.getElementById(tetris.config.info_canvas_id);
    
    this.regions = {};
    this.regions.score = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        dirty: false
    };
    this.regions.basic_stats = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        dirty: false
    };
    this.regions.shape_counts = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        dirty: false
    };
}


//============================================================================//
function Canvas() {
    this.grid_x = 2;
    this.grid_y = 2;
    this.shapes_layer = new ShapesLayer(this.grid_x, this.grid_y);
    
    this.needs_repaint = true;
    
    this.width = this.shapes_layer.width + 4;
    this.height = this.shapes_layer.height + 4;
    
    this.main_canvas = document.getElementById(tetris.config.main_canvas_id);
    this.buf_canvas = document.getElementById(tetris.config.buf_canvas_id);
    this.bg_canvas = document.getElementById(tetris.config.bg_canvas_id);
    
    this.main_canvas.width = this.width;
    this.main_canvas.height = this.height;
    
    this.buf_canvas.width = this.width;
    this.buf_canvas.height = this.height;
    this.bg_canvas.width = this.width;
    this.bg_canvas.height = this.height;
    
    var offleft = this.main_canvas.offsetLeft;
    
    var canvas_wrapper = document.getElementById("canvas-wrapper");
    var info_wrapper = document.getElementById("info-wrapper");
    var content_wrapper = document.getElementById("content-wrapper");
    
    canvas_wrapper.style.height = this.height+"px";
    canvas_wrapper.style.width = this.width+"px";
    info_wrapper.style.height = this.height+"px";
    info_wrapper.style.width = 150+"px";
    var w = canvas_wrapper.offsetWidth + info_wrapper.offsetWidth;
    content_wrapper.style.height = this.height+"px";
    content_wrapper.style.width = w+"px";
    
    var offset_left = document.getElementById("content-wrapper").offsetLeft;
    
    info_wrapper.style.marginLeft = (this.width)+"px";
    //document.getElementById("info-wrapper").style.marginLeft = (this.width)+"px";
    
    var rc = this.bg_canvas.getContext("2d");
    rc.strokeStyle = "rgb(0,0,0,255)";
    rc.strokeRect(this.grid_x-1.5, this.grid_y-1.5, this.shapes_layer.width+3, this.shapes_layer.height+3);
}

Canvas.prototype.clear_canvas = function(rc) {
    rc.save();
    rc.globalCompositeOperation = "copy";
    rc.fillStyle = "rgba(255,255,255,0)";
    rc.fillRect(0, 0, rc.canvas.width, rc.canvas.height);
    rc.restore();
};

Canvas.prototype.paint = function() {
    // clear buf_canvas
    if (this.needs_repaint) {
        var rc = this.buf_canvas.getContext("2d");
        rc.fillStyle = "rgba(255,255,255,255)";
        rc.fillRect(0, 0, this.buf_canvas.width, this.buf_canvas.height);
        
        // merge bg_canvas, cells_canvas, shape_canvas onto buf_canvas
        rc.drawImage(this.bg_canvas, 0, 0, this.bg_canvas.width, this.bg_canvas.height);
        this.shapes_layer.paint(rc);
        
        // copy buf_canvas to main_canvas
        var rc = this.main_canvas.getContext("2d");
        rc.drawImage(this.buf_canvas, 0, 0, this.buf_canvas.width, this.buf_canvas.height);
        this.needs_repaint = false;
    }
};

Canvas.prototype.set_paused = function() {
    this.shapes_layer.set_paused();
    this.needs_repaint = true;
};

Canvas.prototype.set_unpaused = function() {
    this.shapes_layer.set_unpaused();
    this.needs_repaint = true;
};

Canvas.prototype.clear_active_shape = function() {
    //logger.log("Canvas.clear_active_shape()");
    this.shapes_layer.clear_active_shape();
    this.needs_repaint = true;
};

Canvas.prototype.draw_active_shape = function(shape) {
    this.shapes_layer.draw_active_shape(shape);
    this.needs_repaint = true;
};

Canvas.prototype.draw_cells = function(cells) {
    //logger.log("Canvas.draw_cells()");
    this.shapes_layer.draw_cells(cells);
    this.needs_repaint = true;
};

Canvas.prototype.draw_game_over = function() {
    this.shapes_layer.draw_game_over();
    this.needs_repaint = true;
};

tetris.Canvas = Canvas;

//============================================================================//
})();

