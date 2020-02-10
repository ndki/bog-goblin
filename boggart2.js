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
    // our desired fundamental functions are:
    // -[X]  =>  []         | drop
    // .[X]  =>  [[X]]      | wrap
    // :[X][Y]  =>  [YX]    | chain
    // *[X]  =>  X[X]       | mirror
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
    // then, there is the syntax function. lets say at the syntax level,
    // the program "ABC" usually looks like [A][B][C], or "ABC" --> [A][B][C]. then:
    // @XY  -->  X[Y]     | spiral
    // spiral lets us use any of the above functions "on the program".
    // in other words, every function call is treated as value to be manipulated.
    //
    // some examples of this:
    // @.XP  -->  .[X]P => [[X]]P     (adds the function X as a first-class value)
    // @-XP  -->  -[X]P => P          (forgets that we had written X)
    // @*XP  -->  *[X]P => X[X]P      (calls X on itself and the rest of the program)
    // @:XYP  -->  :[X][Y]P => [Y X]P (replaces two functions with a single function)
    //
    // for example, normally ABC[X] means A(B(C(X))) ... "do C, then do B, then do A"
    // but @:@: ABC[X] means C(B(A((X))) ... "do A, then do B, then do C"
    // we write:
    // @:@: ABC  -->  ::[A][B][C]  -->  CBA
    // or even:
    // @@: :: ABC  =>  @[::]ABC  =>  CBA
    //
    // its useful to create the identity function, which we can write as "-[.]" or "[]".
    // we have no brackets in the language itself, but using "@" we can write:
    // -@..  =>  -[.]  =>  []
    // and get it as a value in our code by doing:
    // @.@: @..-  =>  [-[.]]
    // or, perhaps more clearly (in the sense that the spirals are semantically grouped):
    // @@:@: .:. .-  =>  @[.:.].-  =>  [-[.]]
    // or, by just spiral-wraping each part and chaining them later:
    // : @.@.. @.-  =>  :[[.]][-]  =>  [-[.]]
    //
    // we can also make the function that calls its argument:
    // *:@.- [X]  =>  *:[-][X]  =>  *[X-]  =>  X-[X-]  =>  X
    // we can wrap it, like before:
    // @.@:@: @.-:*  -->  .::.[-][:][*]  -->  [*:[-]]
    // in the cleaner style:
    // @@:@:@: .::. -:*  =>  @[.::.] -:*  =>  [*:[-]]
    // or, in the more direct style:
    // :: @.@.- @.: @.*  =>  ::[[-]][:][*]  =>  [*:[-]]
    //
    // for duplicating a value, we can use a similar method:
    // *::@.- .*. [X]  =>  *::[-].[X][[X]]  =>  *[[X][X]-]  =>  [X][X]
    // we can also swap two values now:
    // *:@.-: *:@.@:-. .. [X][Y]  =>  *:[-]: *:[.-][[[X]]] [Y]
    //     =>  *:[-]:[[X]].[Y] => [Y][X]
    // and skip values to call a function:
    // *::@.- *::@.- *:@.@:-. ... [X][Y]  => *::[-] *::[-] *:[-.][[[[X]]]][Y]
    //     => *::[-][Y][[X]]  =>  [X]Y
    // or call a single function twice:
    // ** :*. :@.- [X]  =>  **[[X-]X-]  =>  XX
    //
    // we can even make the special function known as the y combinator
    // *: @.@:@:@:@:@:@:@:@: .*.@.-::*.: [X]
    //     =>  *: [:.*::[-].*.] [X]
    //     =>  X :.*::[-].*. [X :.*::[-].*.]
    //     =>  X [X :.*::[-].*. [X :.*::[-].*.]]
    // u can see that if X = [*:[-]], it will be called in an infinite loop.
    //
    // at this point u might notice that this language is not very pretty :)
    // i hope ur having fun tho.
    //
    // completeness of the language should be obvious, but can be "concisely"
    // shown by defining the I, K, and S combinators:
    // I[X] = -@..[X] => [X]
    // K[X][Y] = *::@.-@.-.[X][Y] => *[[X]--][Y] => [X]
    // S[X][Y][Z] = *:@.- *: *:@.-: *:@.@:-. .. *::@.- *::@.- *:@.@:-. ...
    //      @.@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:
    //      .. @.@:-. :* .@.-: .*. @.-::* @:*: ... @.@:-. :* @.-::* @.-::*
    // a shorter version of S is very much welcome.
    //
    parse () { }
    exec () { }
}

Boggart.parser = function () {
    let _this = new this;
    _this.
}
