const process = require('process');

let run_repl = (chunk) => {
    process.stdin.pause();
    let boggart = Boggart.parser();
    boggart.parse(chunk);
    boggart.exec();
    process.stdin.resume();
}

process.stdin.setEncoding('utf8');
process.stdout.write('> ');
process.stdin.on('data', run_repl);

let Boggart = class {
    // <functions> get applied to <arguments>
    // both of these are stacks:
    // the last value put on <functions> is called on
    // the last value put on <args>, and both are removed
    // from their respective stacks.
    // we handle the fact that a function can return to some
    // other functions and some other arguments by pushing
    // those return values onto the appropriate stacks.
    // but we'll just write "calls" to say it adds the functions,
    // and "adds to the stack" to say it adds to the arguments.
    functions = [];
    args = [];
    //
    parse () { }
    exec () { }
}

Boggart.parser = function () {
    let _this = new this;
    _this.
}
