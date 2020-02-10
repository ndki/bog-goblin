# BOGGART

BOGGART is a simple programming language. a boggart (or BOGGART) program
is some series of the characters `-`, `.`, `:`, `*`, or `@`.

BOGGART is purely combinatoric. it has no intrinsic input or output.
rather, external functions must be supplied to a BOGGART program for
it to do anything.

a BOGGART program is first compiled, and then its arguments may be supplied.
it is illegal for a BOGGART program to try to call a function that it does
not have by trying to execute it at compile time. such time-traveling BOGGART
programs are dangerous, rouge individuals, and must be stopped.

## SEMANTICS

the semantics of the first four characters are as follows:
```
-[X]     =>  []         | drop (a.k.a. pop)
.[X]     =>  [[X]]      | wrap (a.k.a. quote)
:[X][Y]  =>  [YX]       | chain
*[X]     =>  X[X]       | mirror
```
we can read these as drop(X), wrap(X), chain(X,Y), and mirror(X).

in general, functions are applied to whatever follows in the program.
so we read `*.-` as `mirror(wrap(drop([X][Y])))`, where [X] and [Y]
stand for arbitrary values that come after the program fragment.
so to figure out what a program does, we can use the above rules and
reduce a program starting from right to left:
```
*.-[X][Y]  =>  *.[Y]  =>  *[[Y]]  =>  [Y][[Y]]
```

actually, `[X]` is the function that evaluates to the value `X`
(in addition to whatever arguments it is given) and in general
we might assume `X` itself is a function.  that's why
```
A[X][Y]  =  A( [X]( [Y]() ) )  =  A(X, Y)
```

so, the program fragment above (`*.-`) forgets the first thing after it,
and then puts down the values "the function that evaluates to Y" and
"the function that evaluates to the function that evaluates to Y".
but when we have `[X]` we can just say that we have "the result `X`"

to be more clear about those functions, here's a written explanation:

- drop takes whatever result is to the right and forgets it.

- wrap takes whatever result is to the right and adds a wrapped function.
    a wrapped function takes no arguments, and when it's called, it
    just adds the original result back on the stack.

- chain takes two results and adds a new function made of their composion,
    combined in "data flow" order. "do X, then do Y".

- mirror takes a result, adds it back, and calls it. another way to understand
    mirror is that it simply chameleons as whatever function it is given.

now, lets say we are given an arbitrary program made of the above functions.
if we write it `ABCDE`, then in the language we've been using, we have a program
that consists of the functions `[A][B][C][D][E]` and calls them from right to
left. the fifth operator, `@` (spiral) takes whatever function follows, and calls that
function on the rest of the program at the same level just discussed. so the program:
```
X@YZ
```
gets interpreted as the series of functions that result from doing:
```
[X]Y[Z]
```

spiral lets us use any of the above functions "on the program". in other words, every
function call is treated as value to be manipulated.

some examples:
```
*@.-    =>  *[-]  =>  -[-] (turns the next function call into a value)
@-:*    =>  *              (forgets that we had written ':')
@*:-    =>  [-:]           (calls : on itself and the rest of the program)
@**     =>  ?              (never finishes compiling or fails to compile)
@.@:.*  =>  [.*]           (replaces two functions with their chained value)
@:*.    =>  .*             (reverses two functions)
```

we can actually write in a data-flow style like:
```
@:@:@: ABCD  =>  DCBA      (do A, do B, do C, do D)
```
and spiral-wrap longer functions like:
```
@.@:@:@: ABCD  => [DCBA]
```

we can also spiral functions that we've spiral-wrapped:
```
@@:@:@: ..:* -.  =>  @[*:..] -.  =>  [:]@.[[:].]  =>  [:][[[:].]]
```

## EXAMPLES

its useful to create the identity function, which we can write as `-[.]` or `[]`.
we have no brackets in the language itself, but by spiraling we can write:
```
-@..  =>  -[.]  =>  []
```
and get it as a value in our code by doing:
```
@.@: @..-  =>  [-[.]]
```
or, perhaps more clearly (in the sense that the spirals are semantically grouped):
```
@@:@: .:. .-  =>  @[.:.].-  =>  [-[.]]
```
or, by just spiral-wraping each part and chaining them later:
```
: @.@.. @.-  =>  :[[.]][-]  =>  [-[.]]
```

we can also make the function that calls its argument:
```
*:@.- [X]  =>  *:[-][X]  =>  *[X-]  =>  X-[X-]  =>  X
```
we can wrap it, like before:
```
@.@:@: @.-:*  -->  .::.[-][:][*]  -->  [*:[-]]
```
in the cleaner style:
```
@@:@:@: .::. -:*  =>  @[.::.] -:*  =>  [*:[-]]
```
or, in the more direct style:
```
:: @.@.- @.: @.*  =>  ::[[-]][:][*]  =>  [*:[-]]
```

for duplicating a value, we can use a similar method:
```
*::@.- .*. [X]  =>  *::[-].[X][[X]]  =>  *[[X][X]-]  =>  [X][X]
```

we can also swap two values:
```
*:@.-: *:@.@:-. .. [X][Y]  =>  *:[-]: *:[.-][[[X]]] [Y]
    =>  *:[-]:[[X]].[Y] => [Y][X]
```

and skip values to call a function:
```
*::@.- *::@.- *:@.@:-. ... [X][Y]  => *::[-] *::[-] *:[-.][[[[X]]]][Y]
    => *::[-][Y][[X]]  =>  [X]Y
```

or call a single function twice:
```
** :*. :@.- [X]  =>  **[[X-]X-]  =>  XX
```

we can even make the special function known as the y combinator
```
*: @.@:@:@:@:@:@:@:@: .*.@.-::*.: [X]
    =>  *: [:.*::[-].*.] [X]
    =>  X :.*::[-].*. [X :.*::[-].*.]
    =>  X [X :.*::[-].*. [X :.*::[-].*.]]
```
u can see that if X is `*:[-]`, it will be called in an infinite loop.

at this point u might notice that this language is not very pretty :)
i hope ur having fun tho.

completeness of the language can be "concisely" shown by defining
the I, K, and S combinators, which provide equivalence with lambda-calculus:
```
I[X] = -@..[X] => [X]
K[X][Y] = *::@.-@.-.[X][Y] => *[[X]--][Y] => [X]
/// Oops this is totally wrong. haha
S[X][Y][Z] = *:@.- *: *:@.-: *:@.@:-. .. *::@.- *::@.- *:@.@:-. ...
     @.@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:@:
     .. @.@:-. :* .@.-: .*. @.-::* @:*: ... @.@:-. :* @.-::* @.-::*
```
a shorter (EDIT: or uh correct) version of S is very much welcome.
