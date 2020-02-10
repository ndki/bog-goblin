// a javascript boggart REPL interpreter
//
// see BOGGART.md for a description of the language
//
// by default, we supply boggart programs with a series
// of functions that write a unique character to stdout
// and return their input.
//

const process = require('process');

let run_repl = (chunk) => {
    process.stdin.pause();
    let boggart = Boggart.parser();
    boggart.parse(chunk.trim());
    console.log('program ' + boggart.functions.join(' '));
    let result = boggart.exec(new CharFns);
    process.stdout.write(result.str + '\n');
    process.stdout.write('> ');
    process.stdin.resume();
}

let wrapper = function () {
    return {
        wrapped: true,
        value: [...arguments],
        toString: function () {
            return "["+this.value.join(' ')+"]";
        }
    };
}

class CharFns extends Array {
    n = 0; str = '';
    constructor () {
        super(...arguments);
        this.push(this.char_fn(this.n++))
    }
    pop () {
        if (this.length < 2) {
            this.push(this.char_fn(this.n++))
        }
        return super.pop();
    }
    char_fn  (n, str) {
        let this_ = this;
        let char_fn = function (A) {
            this_.str += String.fromCharCode(n+32);
            return [wrapper(A)];
        }
        return char_fn;
    }
}

process.stdin.setEncoding('utf8');
process.stdout.write('> ');
process.stdin.on('data', run_repl);

let error = function (message) {
    return { exception: true, value: message }
}

/*
let BoggartFns = {
    Wrapped,
    Chained,
    Wrap,
    Chain,
    Drop,
    Mirror,
}
*/

let Boggart = class {
    functions = [];

    parse (string) {
        this.functions = [this.base_parser];
        let args = string.split('').reverse().flatMap((c) => [c, false]);
        args.unshift(true);
        let result = this.exec(args);
        this.functions = result.reverse();
        return this;
    }

    exec (args_) {
        // TODO: dynamic optimization
        // real compilation??
        let fn;
        let functions = this.functions.slice(0);
        let args = args_.slice(0);
        while (fn = functions.pop()) {
            if (fn.wrapped) {
                args.push(...fn.value);
            } else if (fn.chained) {
                functions.push(...fn.value);
            } else if (fn.exception) {
                /// need 2 think abt this
                console.error(fn.value);
                return [];
            } else if (args.length) {
                functions.push(...fn(args.pop()));
            } else {
                // error ?????
                console.error("insufficient arguments 2 program....");
                return [];
            }
        }
        return args;
    }
}

Boggart.parser = function () {
    let _this = new this;

    // TODO: implement without functions! :)
    // TODO: implicit typing :)
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
                return [wrapper(chainer())];
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
                mirror, chain, chain, wrapper(drop), wrapper(wrap),
                wrap, wrapper(parser), char2fn
            ];
        } else {
            return [];
        }
    }
    parser.toString = function () { return "#parser" }

    _this.base_parser = parser;
    return _this
}
