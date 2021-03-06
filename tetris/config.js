
var tetris = {};
var app = null;

var loglevels = {
    ALL: 0,
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    NONE: 100,
};

tetris.config = {
    debug: true,
    loglevel: loglevels.DEBUG,
    
    main_canvas_id: "main-canvas",
    buf_canvas_id: "buf-canvas",
    fg_canvas_id: "fg-canvas",
    bg_canvas_id: "bg-canvas",
    cells_canvas_id: "cells-canvas",
    shape_canvas_id: "shape-canvas",
    
    grid_columns: 10,
    grid_rows: 23,
    
    cell_size: 24,
    cell_border_size: 1,
    cell_shadow_size: 2,
    
    initial_key_repeat_delay: 250, // milliseconds
    key_repeat_delay: 25 // milliseconds
    
};
