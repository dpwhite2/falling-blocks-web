
(function(){
//============================================================================//
function Canvas() {
    var size = tetris.config.cell_size;
    var border = tetris.config.cell_border_size;
    this.grid_width = (size + border) * tetris.config.grid_columns + border;
    this.grid_height = (size + border) * tetris.config.grid_rows + border;
    
    this.canvas_width = this.grid_width;
    this.canvas_height = this.grid_height;
    this.grid_x = 1;
    this.grid_y = 1;
    
    this.main_canvas = document.getElementById(tetris.config.main_canvas_id);
    this.buf_canvas = document.getElementById(tetris.config.buf_canvas_id);
    this.bg_canvas = document.getElementById(tetris.config.bg_canvas_id);
    this.cells_canvas = document.getElementById(tetris.config.cells_canvas_id);
    this.shape_canvas = document.getElementById(tetris.config.shape_canvas_id);
    
    this.main_canvas.width = this.canvas_width+2;
    this.main_canvas.height = this.canvas_height+2;
    
    this.buf_canvas.width = this.canvas_width+2;
    this.buf_canvas.height = this.canvas_height+2;
    this.bg_canvas.width = this.canvas_width+2;
    this.bg_canvas.height = this.canvas_height+2;
    this.cells_canvas.width = this.canvas_width;
    this.cells_canvas.height = this.canvas_height;
    this.shape_canvas.width = this.canvas_width;
    this.shape_canvas.height = this.canvas_height;
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
    var rc = this.buf_canvas.getContext("2d");
    rc.fillStyle = "rgba(255,255,255,255)";
    rc.fillRect(0, 0, this.buf_canvas.width, this.buf_canvas.height);
    
    // merge bg_canvas, cells_canvas, shape_canvas onto buf_canvas
    rc.drawImage(this.bg_canvas, 0, 0, this.bg_canvas.width, this.bg_canvas.height);
    rc.drawImage(this.cells_canvas, 0,0, this.canvas_width, this.canvas_height, this.grid_x, this.grid_y, this.canvas_width, this.canvas_height);
    rc.drawImage(this.shape_canvas, 0,0, this.canvas_width, this.canvas_height, this.grid_x, this.grid_y, this.canvas_width, this.canvas_height);
    
    // copy buf_canvas to main_canvas
    var rc = this.main_canvas.getContext("2d");
    rc.drawImage(this.buf_canvas, 0, 0, this.buf_canvas.width, this.buf_canvas.height);
};

Canvas.prototype.paint_cell = function(rc, col, row) {
    var size = tetris.config.cell_size;
    var border = tetris.config.cell_border_size;
    var x = border + col * (size + border);
    var y = border + row * (size + border);
    //console.debug("Canvas.paint_cell()... x="+x+", y="+y);
    rc.fillRect(x, y, size, size);
    rc.strokeRect(x-0.5, +y-0.5, size+1, size+1);
};

Canvas.prototype.clear_active_shape = function() {
    console.debug("Canvas.clear_active_shape()");
    // clear shape_canvas (with transparent alpha)
    var rc = this.shape_canvas.getContext("2d");
    this.clear_canvas(rc);
};

Canvas.prototype.draw_active_shape = function(shape, center) {
    //console.debug("Canvas.draw_active_shape()");
    // clear shape_canvas (with transparent alpha)
    var rc = this.shape_canvas.getContext("2d");
    this.clear_canvas(rc);
    // draw shape on canvas
    rc.fillStyle = shape.color;
    var positions = shape.positions(center[0], center[1]);
    for (var i=0; i<positions.length; i++) {
        var pos = positions[i];
        this.paint_cell(rc, pos[0], pos[1]);
    }
};

Canvas.prototype.draw_cells = function(cells) {
    console.debug("Canvas.draw_cells()");
    // clear cells_canvas (with transparent alpha)
    var rc = this.cells_canvas.getContext("2d");
    this.clear_canvas(rc);
    // draw cells on canvas
    rc.strokeStyle = "rgba(0,0,0,255)";
    for (var i=0; i<cells.length; i++) {
        for (var j=0; j<cells[i].length; j++) {
            var cell = cells[i][j];
            if (!cell.empty) {
                //console.log("drawing cell: " + i + "," + j);
                rc.fillStyle = cell.color;
                this.paint_cell(rc, cell.col, cell.row);
            }
        }
    }
};

tetris.Canvas = Canvas;

//============================================================================//
})();

