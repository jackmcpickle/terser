var save_stderr = process.stderr;
var fs = require("fs");

// discard annoying NodeJS warning ("path.existsSync is now called `fs.existsSync`.")
var devnull = fs.createWriteStream("/dev/null");
process.__defineGetter__("stderr", function(){
    return devnull;
});

var vm = require("vm");
var sys = require("util");
var path = require("path");

var UglifyJS = vm.createContext({
    sys           : sys,
    console       : console,

    MOZ_SourceMap : require("source-map")
});

process.__defineGetter__("stderr", function(){
    return save_stderr;
});

function load_global(file) {
    file = path.resolve(path.dirname(module.filename), file);
    try {
        var code = fs.readFileSync(file, "utf8");
        return vm.runInContext(code, UglifyJS, file);
    } catch(ex) {
        // XXX: in case of a syntax error, the message is kinda
        // useless. (no location information).
        sys.debug("ERROR in file: " + file + " / " + ex);
        process.exit(1);
    }
};

var FILES = exports.FILES = [
    "../lib/utils.js",
    "../lib/ast.js",
    "../lib/parse.js",
    "../lib/transform.js",
    "../lib/scope.js",
    "../lib/output.js",
    "../lib/compress.js",
    "../lib/sourcemap.js",
    "../lib/mozilla-ast.js"
].map(function(file){
    return path.join(path.dirname(fs.realpathSync(__filename)), file);
});

FILES.forEach(load_global);

UglifyJS.AST_Node.warn_function = function(txt) {
    sys.error("WARN: " + txt);
};

// XXX: perhaps we shouldn't export everything but heck, I'm lazy.
for (var i in UglifyJS) {
    if (UglifyJS.hasOwnProperty(i)) {
        exports[i] = UglifyJS[i];
    }
}
