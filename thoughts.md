a "concatenative"? language.

 - cost/benefits ?

 - prefix style more suitable for stating intentions

 - postfix style more suitable for stating dataflow

   ￫ what are the details of APL-like syntax? re: dataflow..

 - want to emphasize data storage

 - want syntactic ease

   ￫ programs need to be easy to read, easy to document,
       easy to reason about, easy to differentiate, etc?

 - want some sort of memory-level (pseudo?) access...

   ￫ a conformant compiler does not guarantee hardware
       memory layout, but should perhaps guarantee something
       similar, like, ... idk. hmmm...

   ￫ obviously(?), look more closely at what rust does.....
       (and why it does it!)

 - strong high-order polymorphism is Good (and fun?)

   ￫ counter: consider fixed-point combinators and their inherent
       typelessness.....??

   ￫ consider how "class" based systems work vs the , well,
       much better "role" systems and "type class" systems,
       -- maybe think about this in a deep way. has this been?
       can we do better than prototypy?

   ￫ the main idea, i think, is to provide that certain "operations"
       have certain "properties". what does this mean? what is
       necessary, and where?

   ￫ the person who did Cat made a language that "in version 0.1"
       does not allow new type definitions at the program level!
       (but!.. the functional paradigm gets around this a bit, no?)

 - syntax should be _expressive_ BUT simple, and compositional

   ￫ if you can do something with it, you should be able to
       do, uhh... a lot of things with it. idk. "mileage"

   ￫ ok the first example i thought of, Om uses drop [...]
       as a comment. fine, but this is horrible syntax.
       (there are a lot of other problems, for a "minimalize" lang)
       nothing is really lost by adding // ... \n, and also
       ///[ comment ] with /// as drop seems.. well its a start,
       right? there's a lot more to it than just saying, oh,
       drop [...] is a comment. when u do that, u "retro"actively
       change/create the meaning of "drop"!!
       (also, is it really a good idea to have ur comments use
       the same bracketing as everything else??)

 - what does access mean ? when we talk about accessing values
   on different threads, how does a "concatenative" language
   understand that and deal with it ?

 - functionality should be "generic" -- "ffi" above all!

