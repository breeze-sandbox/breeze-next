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

## Breaking changes
Api is almost identical to the original but small changes are noted below:

Breeze no longer depends upon Q.js.  But it does depend on a ES6 promise implementation. i.e. the existence of a global Promise object. 


## Compile Notes
In general we have avoided using null parameters in favor of undefined parameters thoughout the API. This means that signatures will look like

a(p1: string, p2?: Entity)

as opposed to 

a(p1: string, p2?: Entity | null);

This IS deliberate.  In general, with very few exceptions input parameters will rarely say 'p: x | null'.  The only exceptions are where
we need to be able to pass a null parameter followed by one or more non null params.  This is very rare. SaveEntities(entities: Entity[] | null, ...)
is one exception. 

Note that this is not a breaking change because the underlying code will always check for either a null or undefined. i.e. 'if (p2 == null) {'
so this convention only affects typescript consumers of the api.  Pure javascript users can still pass a null in ( if they want to)

Note that it is still acceptable for api calls to return a null to indicate that nothing was found.  i.e. like getEntityType().  

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


