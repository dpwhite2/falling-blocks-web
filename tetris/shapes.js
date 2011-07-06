(function(){
//============================================================================//
var shape_states = {
    I: {
        0: [[-1,0],[0,0],[1,0],[2,0]],
        1: [[0,-1],[0,0],[0,1],[0,2]],
        2: [[-1,0],[0,0],[1,0],[2,0]],
        3: [[0,-1],[0,0],[0,1],[0,2]]
    },
    L: {
        0: [[-1,0],[0,0],[1,0],[1,-1]],
        1: [[0,-1],[0,0],[0,1],[1,1]],
        2: [[1,0],[0,0],[-1,0],[-1,1]],
        3: [[0,1],[0,0],[0,-1],[-1,-1]]
    },
    J: {
        0: [[1,0],[0,0],[-1,0],[-1,-1]],
        1: [[0,1],[0,0],[0,-1],[1,-1]],
        2: [[-1,0],[0,0],[1,0],[1,1]],
        3: [[0,-1],[0,0],[0,1],[-1,1]]
    },
    T: {
        0: [[0,-1],[0,0],[1,0],[-1,0]],
        1: [[1,0],[0,0],[0,1],[0,-1]],
        2: [[0,1],[0,0],[-1,0],[1,0]],
        3: [[-1,0],[0,0],[0,-1],[0,1]]
    },
    O: {
        0: [[0,-1],[1,-1],[0,0],[1,0]],
        1: [[0,-1],[1,-1],[0,0],[1,0]],
        2: [[0,-1],[1,-1],[0,0],[1,0]],
        3: [[0,-1],[1,-1],[0,0],[1,0]]
    },
    S: {
        0: [[-1,0],[0,0],[1,-1],[0,-1]],
        1: [[0,1],[0,0],[-1,-1],[-1,0]],
        2: [[-1,0],[0,0],[1,-1],[0,-1]],
        3: [[0,1],[0,0],[-1,-1],[-1,0]]
    },
    Z: {
        0: [[1,0],[0,0],[-1,-1],[0,-1]],
        1: [[0,1],[0,0],[1,-1],[1,0]],
        2: [[1,0],[0,0],[-1,-1],[0,-1]],
        3: [[0,1],[0,0],[1,-1],[1,0]]
    }
};

var shape_colors = {
    I: "rgb(240,0,0)",
    L: "rgb(240,160,0)",
    J: "rgb(0,0,240)",
    T: "rgb(0,240,240)",
    O: "rgb(240,240,0)",
    S: "rgb(240,0,240)",
    Z: "rgb(0,240,0)",
};


function Shape(name, orientation) {
    console.debug("Shape()");
    this.name = name;
    this.orientation = orientation || 0;
    this.color = shape_colors[name];
}

Shape.prototype.rotate = function(n) {
    while (n<0) { n+=4; }
    this.orientation = (this.orientation + n) % 4;
};

Shape.prototype.positions = function(row, col) {
    var s = shape_states[this.name][this.orientation];
    var r = [];
    for (var i=0; i<4; i++) {
        r.push([s[i][0],s[i][1]]);
    }
    //var r = shape_states[this.name][this.orientation].slice(0);
    for (var i=0; i<4; i++) {
        r[i][0] += row;
        r[i][1] += col;
    }
    return r;
};

tetris.Shape = Shape;

//============================================================================//
})();

