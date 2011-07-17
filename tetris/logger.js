
(function(){

// makeshift Function.apply()-like function for MSIE which doesn't have the 
// apply method on native objects.
function apply(func, args) {
    var args = args || [];
    var args_strings = [];
    for (var i=0; i<args.length; i++) {
        args_strings.push("args["+i+"]");
    }
    var args_string = args_strings.join(",");
    
    /* Note: this call should be safe.  The code consists of:
            func: The name of the function we are calling.  This is always 
                  specified by string literals within this script.
            args_strings: Elements of the 'args' array accessed by index.  For 
                  instance, 'args[0]'.  This cannot execute arbitrary code.
       
       Bottom line: the evaluated string does not contain arbitrary code.
    */
    var call = func + "(" + args_string + ");";
    return eval(call);
}

function Logger() {}

if (!console) {
    console = {};
}

function console_method(method, level) {
    if (console[method]) {
        if (console[method].apply) {
            return function() {
                if (tetris.config.loglevel <= loglevels[level]) {
                    return console[method].apply(console, arguments);
                }
            }
        } else {
            return function() {
                if (tetris.config.loglevel <= loglevels[level]) {
                    return apply("console." + method, arguments);
                }
            }
        }
    } else {
        return function() {
            if (tetris.config.loglevel <= loglevels[level]) {
                return this.log.apply(this, arguments);
            }
        }
    }
}

// console.log()
if (console.log) {
    if (console.log.apply) {
        Logger.prototype.log = function() {
            if (tetris.config.loglevel < loglevels.NONE) {
                return console.log.apply(console, arguments);
            }
        }
    } else {
        Logger.prototype.log = function() {
            if (tetris.config.loglevel < loglevels.NONE) {
                return apply("console.log", arguments);
            }
        }
    }
} else {
    Logger.prototype.log = function() {}
}

// console.debug()
if (tetris.config.debug) {
    Logger.prototype.debug = console_method("debug", "DEBUG");
} else {
    Logger.prototype.debug = function(){}
}
Logger.prototype.ignore = function() {}
Logger.prototype.info = console_method("info", "INFO");
Logger.prototype.warn = console_method("warn", "WARN");
Logger.prototype.error = console_method("error", "ERROR");

window.logger = new Logger();

})();
