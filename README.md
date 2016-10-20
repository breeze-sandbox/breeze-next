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

## Build using WebPack
Run `npm run build`.  This will create a breeze.core.js file in the \build dir.


## Compile Notes
We are compiling the code with `--strictNullChecks`, and have used `Object` instead of `any` where possible in parameter declarations, to ensure that null checking is taking place.

Use of `Object` often means casting to `any` within methods, but the payoff should be better compile-time bug catching.

We can consider creating an `IObject` base interface for all Breeze classes, and use that instead of `Object` in method parameters.  That way String and Number types won't be accepted erroneously.

## Jasmine tests 

1) from command line
    run 'npm install jasmine -g' ( global install).
    run 'jasmine'  from top level breeze-next dir.

2) from vs code debugger
    add this section to 'launch.json'
     
        {
            "name": "Debug Jasime Tests",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}/node_modules/jasmine/bin/jasmine.js",
            "stopOnEntry": false,
            "args": [
               
            ],
            "cwd": "${workspaceRoot}",
            "sourceMaps": true,
            "outDir": "${workspaceRoot}/dist"
        }    

    run 'npm install jasmine' // local install   
    set breakpoint and hit Ctrl-F5.     


