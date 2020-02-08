'use strict';
const process = require('process');

process.stdin.setEncoding('utf8');

String.prototype.pretty = function () { return this } // shhhhhh
let pretty_print = (array) => {
    return array.map((v) => v.pretty()).join(' ');
}
class Boggart {
    // well, this terminology is misleading..
    stack = [];
    queue = [];
    pretty_print (inner) {
        let peek = 12;
        let str = '';
        if (this.queue.length < peek) {
            str += '['+pretty_print(this.queue)+'] ';
        } else {
            str += '[ * '+pretty_print(this.queue.slice(3-peek))+'] ';
        }
        if (inner) {
            str += inner+' ';
        }
        if (this.stack.length < peek) {
            str += '['+pretty_print(this.stack.slice(0).reverse())+']';
        } else {
            str += '['+pretty_print(this.stack.slice(3-peek).reverse())+' * ]';
        }
        return str;
    }
    parse(read, write) {
        console.log('parsing: '+this.pretty_print(''));
        this.stack.push(this.base_parser);
        this.queue.push(this.base_parser)
        this.exec(read, write);
        this.queue.pop();
        console.log('compiling: '+this.pretty_print(''));
        this.exec(read, write);
        this.queue = this.stack.reverse();
        this.stack = [];
        console.log('result: '+this.pretty_print(''));
    }
    exec (read, write) {
        this.read = read;
        this.write = write;
        while (this.queue.length > 0) {
            let current_fn = this.queue.pop();
            if (this.stack.length == 0 && !current_fn.constant) {
                this.queue.push(current_fn);
                break;
            }
            let [to_queue, to_stack, exception] =
                current_fn.constant ? current_fn.unwrap() : current_fn(this.stack.pop());
            if (exception) {
                this.queue.push(current_fn);
                return false;
            }
            this.stack.push(...to_stack);
            this.queue.push(...to_queue);
            console.log(this.pretty_print(''));
        }
        return true;
    }
}
Boggart.parser = function (string) {
    let _this = new this;
    // TODO we want this in lazy style (i think)
    _this.stack = string.trim().split('').reverse();
    let pretty = function () { return ''+this.desc };
    let wrap = (desc, fn, constant, ...args) => {
        fn.desc = [desc,...args.map((a)=>a.pretty())].join(constant?'':'.');
        fn.pretty = pretty;
        if (constant) {
            fn.constant = true;
            fn.unwrap = function () {
                let c = this([])
                return [c[0], c[1].splice(1), c[2]];
            }
        }
        return fn;
    }
    let quote = wrap('.', (A) => [[], [constant(A)], false]);
    let constant = (C) => wrap('.', (A) => [[], [A, C], false], true, C);
    let lambda = wrap('`', (A) => [[wrap('`'+A.pretty(),(B) => [[lambda_fn(A,B)],[], false], false)],[]]);
    let lambda_fn = (C,D) => wrap('`', (A) => [[quote,D], [C,A], false], false, C, D);
    let join = wrap('+', (A) => [[wrap('+'+A.pretty(),(B) => [[],[join_(A,B)], false], false)],[]]);
    let join_ = (C,D) => wrap('+', (A) => [[], [A,D,C], false], true, C, D);
    let drop = wrap('-',(A) => [[],[], false]);
    let apply = wrap('!', (A) => [[A],[], false]);
    let apply2 = wrap(':', (A) => [[A,A],[], false]);
    let swap = wrap('x', (A) => [[wrap('x',(B) => [[], [A, B], false], false, A)],[],false]);
    let chain = wrap(';', (A) => [[wrap(';',(B) => [[A, B], [], false], false, A)],[],false]);
    //let lift = wrap('^', ???);
    let lift = wrap('^', (P) => {
        // TODO: semantics????
        // TODO EXCEPTION HANDLING!!!
        let PP = P(P)[0][0];
        let parse_lifted = wrap('^', (C) => {
            let ast_builders = PP(C)[0];
            let tail = PP(C)[1];
            let read_lifted = wrap('^', (B) => {
                let ast_fn = ast_builders[0];
                let parser = ast_builders[1];
                if (parser) {
                    if (ast_fn.constant) {
                        let ast_c = ast_fn.unwrap();
                        return [[chain,apply,...ast_c[0]], [...tail, parser, B, ...ast_c[1]], false];
                    } else {
                        let ast_c = ast_fn(B);
                        return [[chain,...ast_c[0]], [...tail, parser, ...ast_c[1]], false];
                    }
                } else {
                    throw 'uhhhhhhh';
                }
            }, false, P, C);
            return [[read_lifted],[], false];
        }, false, P);
        return [[parse_lifted],[], false];
    });
    let write = wrap('>', (A) => {
        let R = _this.write(''+A);
        if (R) {
            return [[],[apply], false];
        } else {
            return [[],[apply], false];
        }
    });
    let read = wrap('<',(A) => {
        let R = _this.read();
        if (R.done) {
            return [[],[A, R.value], true]; // just, uh. try again.
        } else {
            return [[],[A, R.value], false];
        }
    }, true);
    let parse = wrap('P', (P) => {
        let parse_char = wrap('P', (C) => {
            let T = {
                '^': [lift],
                '`': [lambda, P],
                '.': [quote, P],
                '%': [constant(P), P],
                'o': [constant(quote), P],
                '+': [constant(join), P],
                'x': [constant(swap), P],
                ';': [constant(chain), P],
                '-': [constant(drop), P],
                '!': [constant(apply), P],
                ':': [constant(apply2), P],
                '>': [constant(write), P],
                '<': [constant(read), P],
            };
            if (!T[C]) {
                throw 'sorry, whats a <'+C+'>?';
            }
            return [T[C], [P], false];
        }, false, P);
        return [[parse_char], [], false]
    });
    _this.base_parser = parse;
    return _this;
}

process.stdout.write('>: ');
let run_repl = () => {
    let read = process.stdin.read.bind(process.stdin);
    let write = process.stdout.write.bind(process.stdout);
    let chunk;
    while ((chunk = read()) != null) {
        let boggart = Boggart.parser(chunk);
        let new_chunk = ''[Symbol.iterator]();
        let read_char = function () {
            return new_chunk.next();
        }
        boggart.parse(read_char, write);
        let bge = boggart.exec(read_char, write);
        // IDK!!! ajdflakdjfl
        if (bge == false) {
            let resume_fn = () => {
                new_chunk = read()[Symbol.iterator]();
                process.stdin.on('readable', run_repl);
                let bge = boggart.exec(read_char, write);
                if (bge == false) {
                    process.stdin.off('readable', run_repl);
                    process.stdin.once('readable', resume_fn);
                } else {
                    process.stdout.write('>: ');
                }
            }
            process.stdin.off('readable', run_repl);
            process.stdin.once('readable', resume_fn);
        } else {
            process.stdout.write('>: ');
        }
    }
}
process.stdin.on('readable', run_repl);

process.stdin.on('end', () => {
    process.stdout.write('end');
});
