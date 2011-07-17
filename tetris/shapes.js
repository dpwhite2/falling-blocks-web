(function(){
//============================================================================//
// The following functions are from:
// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

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

var shape_color_config = {
    I: {r:240, g:0, b:0},  // red
    L: {r:240, g:160, b:0}, // orange
    J: {r:0, g:64, b:235},  // blue
    T: {r:0, g:230, b:210}, // cyan
    O: {r:235, g:235, b:0}, // yellow
    S: {r:230, g:0, b:235}, // magenta
    Z: {r:0, g:230, b:0},   // green
};

function get_color(name) {
    var c = shape_color_config[name];
    return "rgb("+c.r+","+c.g+","+c.b+")";
}

function get_highlight(name) {
    var c = shape_color_config[name];
    var hsl = rgbToHsl(c.r, c.g, c.b);
    hsl[2] *= 1.2;
    var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    logger.ignore("hsl: " + hsl);
    logger.ignore("rgb: " + rgb);
    var r = rgb[0].toFixed(0);
    var g = rgb[1].toFixed(0);
    var b = rgb[2].toFixed(0);
    return "rgb("+r+","+g+","+b+")";
}

function get_shadow(name) {
    var c = shape_color_config[name];
    var hsl = rgbToHsl(c.r, c.g, c.b);
    hsl[2] /= 1.12;
    var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    logger.ignore("hsl: " + hsl);
    logger.ignore("rgb: " + rgb);
    var r = rgb[0].toFixed(0);
    var g = rgb[1].toFixed(0);
    var b = rgb[2].toFixed(0);
    return "rgb("+r+","+g+","+b+")";
}

var shape_colors = {
    I: get_color("I"),
    L: get_color("L"),
    J: get_color("J"),
    T: get_color("T"),
    O: get_color("O"),
    S: get_color("S"),
    Z: get_color("Z"),
};
var shape_highlights = {
    I: get_highlight("I"),
    L: get_highlight("L"),
    J: get_highlight("J"),
    T: get_highlight("T"),
    O: get_highlight("O"),
    S: get_highlight("S"),
    Z: get_highlight("Z"),
};
var shape_shadows = {
    I: get_shadow("I"),
    L: get_shadow("L"),
    J: get_shadow("J"),
    T: get_shadow("T"),
    O: get_shadow("O"),
    S: get_shadow("S"),
    Z: get_shadow("Z"),
};


function Shape(name, orientation) {
    logger.ignore("Shape()");
    this.name = name;
    this.orientation = orientation || 0;
    this.color = shape_colors[name];
    this.highlight = shape_highlights[name];
    this.shadow = shape_shadows[name];
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
    for (var i=0; i<4; i++) {
        r[i][0] += row;
        r[i][1] += col;
    }
    return r;
};

tetris.Shape = Shape;

//============================================================================//
})();

