"use strict";
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
                args.push(fn.value);
            } else if (fn.chained) {
                functions.push(...fn.value);
            } else if (fn.typed) {
                if (args.length < fn.arity) {
                    console.error("insufficient arguments 2 program....");
                    return [];
                } else {
                    functions.push(fn.apply(args));
                }
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

let chainer = function (result) {
    return {
        chained: true,
        value: result,
        toString: function () {
            return "{"+this.value.join(' ')+"}";
        }
    };
}
let wrapper = function (result) {
    return {
        wrapped: true,
        value: result,
        toString: function () {
            return "["+this.value+"]";
        }
    };
}

let type = function (arity, combinator, name) {
    return {
        typed: true,
        arity: arity,
        combinator: combinator,
        name: name,
        toString: function() { return this.name },
        apply: function(args) {
            let values = [];
            let n = this.arity;
            while (n--) {
                values.push(args.pop());
            }
            let might_chain = function (a) {
                if (a.length == 1) {
                    return a[0];
                } else {
                    return chainer(a);
                }
            }
            let substituter = function (t) {
                if (t instanceof Array) {
                    return wrapper(might_chain(t.map(substituter)));
                } else {
                    return values[t]
                }
            }
            return might_chain(this.combinator.map(substituter));
        }
    }
}

let wrap = type(1, [[[0]]], '.');
let chain = type(2, [[1,0]], ':');
let drop = type(1, [], '-');
let mirror = type(1, [0,[0]], '*');


Boggart.parser = function () {
    let _this = new this;

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
                return [wrapper(chainer([]))];
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
