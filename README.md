# breeze-next
Next version of Breeze, built using TypeScript 2.

## The Plan
1. Work our way through the original JavaScript files, converting each file to one or more TypeScript modules.
2. Get it all built into a loadable JS module that can replace the legacy breeze.debug.js
3. Test and fix bugs until it works as well as legacy
4. Refactor
    - remove redundancy
    - move KO (and other non-backingstore) support into separate modules
    - move EF metadata support into a separate module
    - improve performance
5. Test more

## Build Notes
We are compiling the code with `--strictNullChecks`, and have used `Object` instead of `any` where possible in parameter declarations, to ensure that null checking is taking place.

Use of `Object` often means casting to `any` within methods, but the payoff should be better compile-time bug catching.

We can consider creating an `IObject` base interface for all Breeze classes, and use that instead of `Object` in method parameters.  That way String and Number types won't be accepted erroneously.




