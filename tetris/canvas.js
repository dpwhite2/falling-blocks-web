
(function(){
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

ShapesLayer.prototype.paint_cell = function(rc, col, row, color, highlight, shadow) {
    rc.fillStyle = color;
    
    var x = this.cell_border + col * (this.cell_size + this.cell_border);
    var y = this.cell_border + row * (this.cell_size + this.cell_border);
    //console.log("ShapesLayer.paint_cell()... x="+x+", y="+y);
    rc.fillRect(x, y, this.cell_size, this.cell_size);
    if (this.cell_border > 0) {
        rc.strokeRect(x-this.cell_border/2, y-this.cell_border/2, this.cell_size+this.cell_border, this.cell_size+this.cell_border);
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
    rc.fillRect(x+this.cell_size-shadow_size-2, y+shadow_size+1, 1, this.cell_size-2*shadow_size-2);
    rc.fillRect(x+shadow_size+1, y+this.cell_size-shadow_size-2, this.cell_size-2*shadow_size-2, 1);
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
    rc.strokeStyle = "rgba(0,0,0,255)";
    rc.lineWidth = this.cell_border.toFixed(0);
    var positions = shape.cells();
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        this.paint_cell(rc, pos[0], pos[1], shape.color(), shape.highlight(), shape.shadow());
    }
};

ShapesLayer.prototype.draw_cells = function(cells) {
    // clear cells_canvas (with transparent alpha)
    var rc = this.cells_canvas.getContext("2d");
    this.clear_canvas(rc);
    // draw cells on canvas
    rc.strokeStyle = "rgba(0,0,0,255)";
    rc.lineWidth = this.cell_border.toFixed(0);
    for (var i=0; i<cells.length; i++) {
        for (var j=0; j<cells[i].length; j++) {
            var cell = cells[i][j];
            if (!cell.empty) {
                this.paint_cell(rc, cell.col, cell.row, cell.color, cell.highlight, cell.shadow);
            }
        }
    }
};

ShapesLayer.prototype.set_paused = function() {
    var rc = this.cells_canvas.getContext("2d");
    rc.fillStyle = "rgba(255,255,255,255)";
    rc.fillRect(0, 0, this.cells_canvas.width, this.cells_canvas.height);
    rc.fillStyle = "rgba(0,0,0,255)";
    rc.font = "28px sans-serif";
    rc.textAlign = "center";
    rc.fillText("PAUSED", this.cells_canvas.width/2, this.cells_canvas.height/3);
    rc.font = "12px sans-serif";
    rc.fillText("Press \"P\" to unpause.", this.cells_canvas.width/2, this.cells_canvas.height/3 + 22);
    
    rc = this.shape_canvas.getContext("2d");
    this.clear_canvas(rc);
};

ShapesLayer.prototype.set_unpaused = function() {
    var rc = this.cells_canvas.getContext("2d");
    this.clear_canvas(rc);
};

//============================================================================//


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
    //this.fg_canvas = document.getElementById(tetris.config.fg_canvas_id);
    this.bg_canvas = document.getElementById(tetris.config.bg_canvas_id);
    
    this.main_canvas.width = this.width;
    this.main_canvas.height = this.height;
    
    this.buf_canvas.width = this.width;
    this.buf_canvas.height = this.height;
    //this.fg_canvas.width = this.width;
    //this.fg_canvas.height = this.height;
    this.bg_canvas.width = this.width;
    this.bg_canvas.height = this.height;
    
    var offleft = this.main_canvas.offsetLeft;
    
    document.getElementById("content-wrapper").style.height = this.height+"px";
    document.getElementById("canvas-wrapper").style.height = this.height+"px";
    document.getElementById("info-wrapper").style.height = this.height+"px";
    document.getElementById("info-wrapper").style.marginLeft = (this.width)+"px";
    //document.getElementById("info-wrapper").style.left = (offleft+this.width)+"px";
    
    var rc = this.bg_canvas.getContext("2d");
    rc.strokeStyle = "rgb(0,0,0,255)";
    rc.strokeRect(this.grid_x-1.5, this.grid_y-1.5, this.shapes_layer.width+3, this.shapes_layer.height+3);
    
    //var rc = this.fg_canvas.getContext("2d");
    //this.clear_canvas(rc);
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
    //console.log("Canvas.clear_active_shape()");
    this.shapes_layer.clear_active_shape();
    this.needs_repaint = true;
};

Canvas.prototype.draw_active_shape = function(shape) {
    this.shapes_layer.draw_active_shape(shape);
    this.needs_repaint = true;
};

Canvas.prototype.draw_cells = function(cells) {
    //console.log("Canvas.draw_cells()");
    this.shapes_layer.draw_cells(cells);
    this.needs_repaint = true;
};

tetris.Canvas = Canvas;

//============================================================================//
})();

