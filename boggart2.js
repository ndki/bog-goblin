// a javascript boggart REPL interpreter
//
// see BOGGART.md for a description of the language
//
// by default, we supply boggart programs with a series
// of functions that write a unique character to stdout
// and return their input.
//

const process = require('process');

//let char_fns = new CharFns;
let run_repl = (chunk) => {
    process.stdin.pause();
    let boggart = Boggart.parser();
    boggart.parse(chunk.trim());
    // hmm...
    //console.log(boggart.functions);
    //boggart.exec(char_fns);
    process.stdout.write('> ');
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
    functions = [];
    args = [];

    parse (string) {
        this.functions = [this.base_parser];
        this.args = string.split('').reverse().flatMap((c) => [c, false]);
        this.args.unshift(true);
        this.exec(); // error??
        this.functions = this.args.reverse();
        this.args = [];
        console.log('program '+this.functions.join(' '));
        return this;
    }

    exec () {
        // TODO: dynamic optimization
        // real compilation??
        let fn;
        while (fn = this.functions.pop()) {
            if (fn.wrapped) {
                this.args.push(...fn.value);
            } else if (fn.chained) {
                this.functions.push(...fn.value);
            } else if (this.args.length) {
                this.functions.push(...fn(this.args.pop()));
            } else {
                // error ?????
            }
        }
    }
}

Boggart.parser = function () {
    let _this = new this;

    // TODO: implement without functions! :)
    // TODO: implicit typing :)
    let wrapper = function () {
        return {
            wrapped: true,
            value: [...arguments],
            toString: function () {
                return "["+this.value.join(' ')+"]";
            }
        };
    }

    let chainer = function () {
        return {
            chained: true,
            value: [...arguments],
            toString: function () {
                return "{"+this.value.join(' ')+"}";
            }
        };
    }

    let wrap = function (A) {
        return [wrapper(wrapper(A))];
    }
    wrap.toString = function () { return "." }

    let chain = function (A) {
        let chain_partial = function (B) {
            let R = A.chained ? A.value : [A];
            let L = B.chained ? B.value : [B];
            return [wrapper(chainer(...L, ...R))];
        }
        chain_partial.toString = function () { return ":"+A }
        return [chain_partial];
    }
    chain.toString = function () { return ":" }

    let drop = function (A) { return [ ] }
    drop.toString = function () { return "-" }

    let mirror = function (A) { return [A, wrapper(A)] }
    mirror.toString = function () { return "*" }

    let char2fn = function (character) {
        switch (character) {
            case '@':
            return [chain, chain, wrap, wrapper(drop), wrapper(chain), wrapper(mirror)];

            case '.':
            return [wrap, wrapper(wrap)];

            case '-':
            return [wrap, wrapper(drop)];

            case ':':
            return [wrap, wrapper(chain)];

            case '*':
            return [wrap, wrapper(mirror)];

            default:
            if (character.match(/\s/)) {
                return [ ];
            } else {
                return [error(
                    "parse error: unrecognized character <"+character+">."
                )];
            }
        }
    }
    char2fn.toString = function () { return "#ch2fn" }

    let parser = function (done) {
        if (!done) {
            return [
                mirror, chain, wrapper(drop),
                mirror, chain, chain, wrapper(drop),
                mirror, chain, chain, wrapper(drop), wrapper(wrap), wrap,
                wrapper(parser), char2fn
            ];
        } else {
            return [];
        }
    }
    parser.toString = function () { return "#parser" }

    _this.base_parser = parser;
    return _this
}
