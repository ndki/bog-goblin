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
    // functions get applied to arguments
    // both of these are stacks:
    // the last value put on <functions> is the next one
    // called on the last value put on <args>.
    // we handle the fact that this can "return" to some
    // other function and some other arguments, by pushing
    // those return values back onto the respective stacks.
    // but we'll just write "calls" and "adds to the stack"
    // respectively to describe how a function returns.
    functions = [];
    args = [];
    // our desired fundamental functions are:
    // -[X] => []         | drop
    // .[X] => [[X]]      | wrap
    // :[X][Y] => [YX]    | chain
    // *[X] => X[X]       | mirror
    // we read this as drop(X), wrap(X), chain(X,Y), and mirror(X).
    // functions are applied to whatever follows. so "*.S" reads as "mirror(wrap(S))".
    // [X] means that X is put on the stack. thats why A[X][Y] = A([X]([Y]())) = A(X,Y)
    // - drop takes a function on the stack and forgets it.
    // - wrap takes a function on the stack and adds to the stack a wrapped function.
    //   a wrapped function takes no arguments, and when it's called, it
    //   just adds the original function back on the stack.
    // - chain takes two functions as arguments and adds to the stack a new function
    //   made of their composion, in "data flow" order. "do X, then do Y".
    // - mirror takes a function on the stack, adds it back to the stack, and calls it.
    //   another way to understand mirror is that it simply chameleons as whatever
    //   the current function on top of the stack is.
    //
    // then, there is the syntax level. lets say at the syntax level,
    // the program "ABC" usually looks like [A][B][C], or "ABC" --> [A][B][C]. then:
    // @XY --> X[Y]     | spiral
    // spiral lets us use any of the above functions "on the program".
    // in other words, every function call is treated as value to be manipulated.
    //
    // some examples of this:
    // @.XP --> .[X]P => [[X]]P     (adds the function X as a first-class value)
    // @-XP --> -[X]P => P          (forgets that we had written X)
    // @*XP --> *[X]P => X[X]P      (calls X on itself and the rest of the program)
    // @:XYP --> :[X][Y]P => [Y X]P (replaces two functions with a single function)
    //
    // for example, normally ABC[X] means A(B(C(X))) ... "do C, then do B, then do A"
    // but @:@:ABC[X] means C(B(A((X))) ... "do A, then do B, then do C"
    // we write:
    // @:@:ABC --> ::[A][B][C] => [C B A] --> CBA
    //
    // another example is creating the identity function, which we can write as "-[-]" or "[]"
    // we have no brackets in the language itself, but using "@" we can write:
    // -@.- --> [-].[-] => [-][[-]] --> -[-] = []
    // we can also make the function that calls its argument:
    // *:@.-[X]S ----> *:[-][X]S => *[X-]S => X-[X-]S => XS
    // or, as a first-class value:
    // @.@:@:@.-:* --> .::.[-][:][*] --> [*:[-]]
    parse () { }
    exec () { }
}

Boggart.parser = function () {
    let _this = new this;
    _this.
}
