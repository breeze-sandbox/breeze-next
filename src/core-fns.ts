import { Entity, EntityAspect, EntityType } from '../typings/breeze1x';

var __hasOwnProperty: (obj: any, key: string) => boolean = uncurry(Object.prototype.hasOwnProperty);
var __arraySlice: (ar: any[], start?: number, end?:number) => any[] = uncurry(Array.prototype.slice);
var __isES5Supported: boolean = function () {
    try {
        return !!(Object.getPrototypeOf && Object.defineProperty({}, 'x', {}));
    } catch (e) {
        return false;
    }
} ();

// iterate over object
function __objectForEach(obj: any, kvFn: (key: string, val: any) => any) {
    for (var key in obj) {
        if (__hasOwnProperty(obj, key)) {
            kvFn(key, obj[key]);
        }
    }
}

function __objectMap(obj: any, kvFn?: (key: string, val: any) => any) : any[] {
    var results: any[] = [];
    for (var key in obj) {
        if (__hasOwnProperty(obj, key)) {
            var result = kvFn ? kvFn(key, obj[key]) : obj[key];
            if (result !== undefined) {
                results.push(result);
            }
        }
    }
    return results;
}

function __objectFirst(obj: any, kvPredicate: (key: string, val: any) => boolean): { key: string, value: any } {
    for (var key in obj) {
        if (__hasOwnProperty(obj, key)) {
            var value = obj[key];
            if (kvPredicate(key, value)) {
                return { key: key, value: value };
            }
        }
    }
    return null;
}

function __isSettable(entity: Entity, propertyName: string): boolean {
    var pd = __getPropDescriptor(entity, propertyName);
    if (pd == null) return true;
    return !!(pd.writable || pd.set);
}

function __getPropDescriptor(obj: any, propertyName: string): PropertyDescriptor {
    if (!__isES5Supported) return null;

    if (obj.hasOwnProperty(propertyName)) {
        return Object.getOwnPropertyDescriptor(obj, propertyName);
    } else {
        var nextObj = Object.getPrototypeOf(obj);
        if (nextObj == null) return null;
        return __getPropDescriptor(nextObj, propertyName);
    }
}

// Functional extensions

/** can be used like: persons.filter(propEq("firstName", "John")) */
function __propEq(propertyName: string, value: any): (obj: any) => boolean {
    return function (obj: any) {
        return obj[propertyName] === value;
    };
}

/** can be used like persons.map(pluck("firstName")) */
function __pluck(propertyName: any): (obj: any) => any {
    return function (obj: any) {
        return obj[propertyName];
    };
}

// end functional extensions

/** Return an array of property values from source */
function __getOwnPropertyValues(source: any): any[] {
    var result: any[] = [];
    for (var name in source) {
        if (__hasOwnProperty(source, name)) {
            result.push(source[name]);
        }
    }
    return result;
}

/** Copy properties from source to target. Returns target. */
export function __extend(target: any, source: any, propNames?: string[]): any {
    if (!source) return target;
    if (propNames) {
        propNames.forEach(function (propName) {
            target[propName] = source[propName];
        });
    } else {
        for (var propName in source) {
            if (__hasOwnProperty(source, propName)) {
                target[propName] = source[propName];
            }
        }
    }
    return target;
}

/** Copy properties from defaults iff undefined on target.  Returns target. */
function __updateWithDefaults(target: any, defaults: any): any {
    for (var name in defaults) {
        if (target[name] === undefined) {
            target[name] = defaults[name];
        }
    }
    return target;
}

/** Set ctor.defaultInstance to an instance of ctor with properties from target.
    We want to insure that the object returned by ctor.defaultInstance is always immutable
    Use 'target' as the primary template for the ctor.defaultInstance;
    Use current 'ctor.defaultInstance' as the template for any missing properties
    creates a new instance for ctor.defaultInstance
    returns target unchanged */
function __setAsDefault(target: any, ctor: any): any {
    ctor.defaultInstance = __updateWithDefaults(new ctor(target), ctor.defaultInstance);
    return target;
}

/**
    'source' is an object that will be transformed into another
    'template' is a map where the
       keys: are the keys to return
         if a key contains ','s then the key is treated as a delimited string with first of the
         keys being the key to return and the others all valid aliases for this key
       'values' are either
           1) the 'default' value of the key
           2) a function that takes in the source value and should return the value to set
         The value from the source is then set on the target,
         after first passing thru the fn, if provided, UNLESS:
           1) it is the default value
           2) it is undefined ( nulls WILL be set)
    'target' is optional
       - if it exists then properties of the target will be set ( overwritten if the exist)
       - if it does not exist then a new object will be created as filled.
    'target is returned.
*/
function __toJson(source: any, template: any, target: any): any {
    target = target || {};

    for (var key in template) {
        var aliases = key.split(",");
        var defaultValue = template[key];
        // using some as a forEach with a 'break'
        aliases.some(function (propName) {
            if (!(propName in source)) return false;
            var value = source[propName];
            // there is a functional property defined with this alias ( not what we want to replace).
            if (typeof value == 'function') return false;
            // '==' is deliberate here - idea is that null or undefined values will never get serialized
            // if default value is set to null.
            if (value == defaultValue) return true;
            if (Array.isArray(value) && value.length === 0) return true;
            if (typeof (defaultValue) === "function") {
                value = defaultValue(value);
            } else if (typeof (value) === "object") {
                if (value && value.parentEnum) {
                    value = value.name;
                }
            }
            if (value === undefined) return true;
            target[aliases[0]] = value;
            return true;
        });
    }
    return target;
}

/** Safely perform toJSON logic on objects with cycles. */
function __toJSONSafe(obj: any, replacer?: (prop: string, value: any) => any): any {
    if (obj !== Object(obj)) return obj; // primitive value
    if (obj._$visited) return undefined;
    if (obj.toJSON) {
        var newObj = obj.toJSON();
        if (newObj !== Object(newObj)) return newObj; // primitive value
        if (newObj !== obj) return __toJSONSafe(newObj);
        // toJSON returned the object unchanged.
        obj = newObj;
    }
    obj._$visited = true;
    var result: any;
    if (obj instanceof Array) {
        result = obj.map(function (o: any) {
            return __toJSONSafe(o, replacer);
        });
    } else if (typeof (obj) === "function") {
        result = undefined;
    } else {
        result = {};
        for (var prop in obj) {
            if (prop === "_$visited") continue;
            var val = obj[prop];
            if (replacer) {
                val = replacer(prop, val);
                if (val === undefined) continue;
            }
            val = __toJSONSafe(val);
            if (val === undefined) continue;
            result[prop] = val;
        }
    }
    delete obj._$visited;
    return result;
}

/** Resolves the values of a list of properties by checking each property in multiple sources until a value is found. */
function __resolveProperties(sources: any[], propertyNames: string[]): any {
    var r = {};
    var length = sources.length;
    propertyNames.forEach(function (pn) {
        for (var i = 0; i < length; i++) {
            var src = sources[i];
            if (src) {
                var val = src[pn];
                if (val !== undefined) {
                    r[pn] = val;
                    break;
                }
            }
        }
    });
    return r;
}


// array functions

function __toArray(item: any): any[] {
    if (item == null) {
        return [];
    } else if (Array.isArray(item)) {
        return item;
    } else {
        return [item];
    }
}

/** a version of Array.map that doesn't require an array, i.e. works on arrays and scalars. */
function __map(items: any, fn: (v:any, ix?:number) => void, includeNull?: boolean): any {
    // whether to return nulls in array of results; default = true;
    includeNull = includeNull == null ? true : includeNull;
    if (items == null) return items;
    var result: any;
    if (Array.isArray(items)) {
        result = [];
        items.forEach(function (v: any, ix: number) {
            var r = fn(v, ix);
            if (r != null || includeNull) {
                result[ix] = r;
            }
        });
    } else {
        result = fn(items);
    }
    return result;
}

/** Return first element matching predicate */
function __arrayFirst(array: any[], predicate: (el: any) => boolean): any {
    for (var i = 0, j = array.length; i < j; i++) {
        if (predicate(array[i])) {
            return array[i];
        }
    }
    return null;
}

/** Return index of first element matching predicate */
function __arrayIndexOf(array: any[], predicate: (el: any) => boolean): number {
    for (var i = 0, j = array.length; i < j; i++) {
        if (predicate(array[i])) return i;
    }
    return -1;
}

/** Add item if not already in array */
function __arrayAddItemUnique(array: any[], item: any) {
    var ix = array.indexOf(item);
    if (ix === -1) array.push(item);
}

/** Remove items from the array
 * @param array
 * @param predicateOrItem - item to remove, or function to determine matching item
 * @param shouldRemoveMultiple - true to keep removing after first match, false otherwise
 */
function __arrayRemoveItem(array: any[], predicateOrItem: any, shouldRemoveMultiple?: boolean) {
    var predicate = __isFunction(predicateOrItem) ? predicateOrItem : undefined;
    var lastIx = array.length - 1;
    var removed = false;
    for (var i = lastIx; i >= 0; i--) {
        if (predicate ? predicate(array[i]) : (array[i] === predicateOrItem)) {
            array.splice(i, 1);
            removed = true;
            if (!shouldRemoveMultiple) {
                return true;
            }
        }
    }
    return removed;
}

/** Combine array elements using the callback.  Returns array with length == min(a1.length, a2.length) */
function __arrayZip(a1: any[], a2: any[], callback: (x1: any, x2: any) => any): any[] {
    var result: any[] = [];
    var n = Math.min(a1.length, a2.length);
    for (var i = 0; i < n; ++i) {
        result.push(callback(a1[i], a2[i]));
    }
    return result;
}

//function __arrayDistinct(array) {
//    array = array || [];
//    var result = [];
//    for (var i = 0, j = array.length; i < j; i++) {
//        if (result.indexOf(array[i]) < 0)
//            result.push(array[i]);
//    }
//    return result;
//}

// Not yet needed
//// much faster but only works on array items with a toString method that
//// returns distinct string for distinct objects.  So this is safe for arrays with primitive
//// types but not for arrays with object types, unless toString() has been implemented.
//function arrayDistinctUnsafe(array) {
//    var o = {}, i, l = array.length, r = [];
//    for (i = 0; i < l; i += 1) {
//        var v = array[i];
//        o[v] = v;
//    }
//    for (i in o) r.push(o[i]);
//    return r;
//}

function __arrayEquals(a1: any[], a2: any[], equalsFn?: (x1: any, x2: any) => boolean): boolean {
    //Check if the arrays are undefined/null
    if (!a1 || !a2) return false;

    if (a1.length !== a2.length) return false;

    //go thru all the vars
    for (var i = 0; i < a1.length; i++) {
        //if the var is an array, we need to make a recursive check
        //otherwise we'll just compare the values
        if (Array.isArray(a1[i])) {
            if (!__arrayEquals(a1[i], a2[i])) return false;
        } else {
            if (equalsFn) {
                if (!equalsFn(a1[i], a2[i])) return false;
            } else {
                if (a1[i] !== a2[i]) return false;
            }
        }
    }
    return true;
}

// end of array functions

/** Returns an array for a source and a prop, and creates the prop if needed. */
function __getArray(source: any, propName: string): any[] {
    var arr = source[propName];
    if (!arr) {
        arr = [];
        source[propName] = arr;
    }
    return arr;
}

/** Calls __requireLibCore on semicolon-separated libNames */
function __requireLib(libNames: string, errMessage: string) {
    var arrNames = libNames.split(";");
    for (var i = 0, j = arrNames.length; i < j; i++) {
        var lib = __requireLibCore(arrNames[i]);
        if (lib) return lib;
    }
    if (errMessage) {
        throw new Error("Unable to initialize " + libNames + ".  " + errMessage);
    }
}

var global: any; // TODO for TS compile of function below.  What are runtime implications?

/** Returns the 'libName' module if loaded or else returns undefined */
function __requireLibCore(libName: string) {
    var window = global.window;
    if (!window) return; // Must run in a browser. Todo: add commonjs support

    // get library from browser globals if we can
    var lib = window[libName];
    if (lib) return lib;

    // if require exists, maybe require can get it.
    // This method is synchronous so it can't load modules with AMD.
    // It can only obtain modules from require that have already been loaded.
    // Developer should bootstrap such that the breeze module
    // loads after all other libraries that breeze should find with this method
    // See documentation
    var r = window.require;
    if (r) { // if require exists
        if (r.defined) { // require.defined is not standard and may not exist
            // require.defined returns true if module has been loaded
            return r.defined(libName) ? r(libName) : undefined;
        } else {
            // require.defined does not exist so we have to call require('libName') directly.
            // The require('libName') overload is synchronous and does not load modules.
            // It throws an exception if the module isn't already loaded.
            try {
                return r(libName);
            } catch (e) {
                // require('libName') threw because module not loaded
                return;
            }
        }
    }
}

/** Execute fn while obj has tempValue for property */
function __using(obj: any, property: string, tempValue: any, fn: () => any) {
    var originalValue = obj[property];
    if (tempValue === originalValue) {
        return fn();
    }
    obj[property] = tempValue;
    try {
        return fn();
    } finally {
        if (originalValue === undefined) {
            delete obj[property];
        } else {
            obj[property] = originalValue;
        }
    }
}

/** Call state = startFn(), call fn(), call endFn(state) */
function __wrapExecution(startFn: () => any, endFn: (state: any) => any, fn: () => any) {
    var state: any;
    try {
        state = startFn();
        return fn();
    } catch (e) {
        if (typeof (state) === 'object') {
            state.error = e;
        }
        throw e;
    } finally {
        endFn(state);
    }
}

/** Remember & return the value of fn() when it was called with its current args */
function __memoize(fn: any): any {
    return function () {
        var args = __arraySlice(<any>arguments),
            hash = "",
            i = args.length,
            currentArg: any = null;
        while (i--) {
            currentArg = args[i];
            hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
            fn.memoize || (fn.memoize = {});
        }
        return (hash in fn.memoize) ?
            fn.memoize[hash] :
            fn.memoize[hash] = fn.apply(this, args);
    };
}

function __getUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        //noinspection NonShortCircuitBooleanExpressionJS
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function __durationToSeconds(duration: string) {
    // basic algorithm from https://github.com/nezasa/iso8601-js-period
    if (typeof duration !== "string") throw new Error("Invalid ISO8601 duration '" + duration + "'");

    // regex splits as follows - grp0, grp1, y, m, d, grp2, h, m, s
    //                           0     1     2  3  4  5     6  7  8
    var struct = /^P((\d+Y)?(\d+M)?(\d+D)?)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.exec(duration);
    if (!struct) throw new Error("Invalid ISO8601 duration '" + duration + "'");

    var ymdhmsIndexes = [2, 3, 4, 6, 7, 8]; // -> grp1,y,m,d,grp2,h,m,s
    var factors = [31104000, // year (360*24*60*60)
        2592000,             // month (30*24*60*60)
        86400,               // day (24*60*60)
        3600,                // hour (60*60)
        60,                  // minute (60)
        1];                  // second (1)

    var seconds = 0;
    for (var i = 0; i < 6; i++) {
        var digit = struct[ymdhmsIndexes[i]];
        // remove letters, replace by 0 if not defined
        digit = <any>(digit ? +digit.replace(/[A-Za-z]+/g, '') : 0);
        seconds += <any>digit * factors[i];
    }
    return seconds;

}

// is functions

function __noop() {
    // does nothing
}

function __identity(x: any): any {
    return x;
}

function __classof(o: any) {
    if (o === null) {
        return "null";
    }
    if (o === undefined) {
        return "undefined";
    }
    return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
}

function __isDate(o: any) {
    return __classof(o) === "date" && !isNaN(o.getTime());
}

function __isDateString(s: string) {
    // var rx = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
    var rx = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
    return (typeof s === "string") && rx.test(s);
}

function __isFunction(o: any) {
    return __classof(o) === "function";
}

function __isString(o: any) {
    return (typeof o === "string");
}

function __isObject(o: any) {
    return (typeof o === "object");
}

function __isGuid(value: any) {
    return (typeof value === "string") && /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/.test(value);
}

function __isDuration(value: any) {
    return (typeof value === "string") && /^(-|)?P[T]?[\d\.,\-]+[YMDTHS]/.test(value);
}

function __isEmpty(obj: any) {
    if (obj === null || obj === undefined) {
        return true;
    }
    for (var key in obj) {
        if (__hasOwnProperty(obj, key)) {
            return false;
        }
    }
    return true;
}

function __isNumeric(n: any) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// returns true for booleans, numbers, strings and dates
// false for null, and non-date objects, functions, and arrays
function __isPrimitive(obj: any) {
    if (obj == null) return false;
    // true for numbers, strings, booleans and null, false for objects
    if (obj != Object(obj)) return true;
    return __isDate(obj);
}

// end of is Functions

// string functions

function __stringStartsWith(str: string, prefix: string) {
    // returns true for empty string or null prefix
    if ((!str)) return false;
    if (prefix == "" || prefix == null) return true;
    return str.indexOf(prefix, 0) === 0;
}

function __stringEndsWith(str: string, suffix: string) {
    // returns true for empty string or null suffix
    if ((!str)) return false;
    if (suffix == "" || suffix == null) return true;
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// Based on fragment from Dean Edwards' Base 2 library
// format("a %1 and a %2", "cat", "dog") -> "a cat and a dog"
export function __formatString(string: string, ...params: any[]) {
    var args = arguments;
    var pattern = RegExp("%([1-" + (arguments.length - 1) + "])", "g");
    return string.replace(pattern, function (match, index) {
        return args[index];
    });
}

// Change text to title case with spaces, e.g. 'myPropertyName12' to 'My Property Name 12'
// See http://stackoverflow.com/questions/7225407/convert-camelcasetext-to-camel-case-text
var __camelEdges = /([A-Z](?=[A-Z][a-z])|[^A-Z](?=[A-Z])|[a-zA-Z](?=[^a-zA-Z]))/g;
function __titleCaseSpace(text: string) {
    text = text.replace(__camelEdges, '$1 ');
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return text;
}

// end of string functions

// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
function uncurry(f: any) {
    var call = Function.call;
    return function () {
        return call.apply(f, arguments);
    };
}

// shims

if (!Object.create) {
    Object.create = function (parent: any) {
        var F = <any>function() {
        };
        F.prototype = parent;
        return new F();
    };
}

export var core = <any>{};

// not all methods above are exported
core.__isES5Supported = __isES5Supported;

core.objectForEach = __objectForEach;

core.extend = __extend;
core.propEq = __propEq;
core.pluck = __pluck;

core.arrayEquals = __arrayEquals;
core.arrayFirst = __arrayFirst;
core.arrayIndexOf = __arrayIndexOf;
core.arrayRemoveItem = __arrayRemoveItem;
core.arrayZip = __arrayZip;

core.requireLib = __requireLib;
core.using = __using;

core.memoize = __memoize;
core.getUuid = __getUuid;
core.durationToSeconds = __durationToSeconds;

core.isDate = __isDate;
core.isGuid = __isGuid;
core.isDuration = __isDuration;
core.isFunction = __isFunction;
core.isEmpty = __isEmpty;
core.isNumeric = __isNumeric;

core.stringStartsWith = __stringStartsWith;
core.stringEndsWith = __stringEndsWith;
core.formatString = __formatString;
core.titleCase = __titleCaseSpace;

core.getPropertyDescriptor = __getPropDescriptor;

core.toJSONSafe = __toJSONSafe;

var breeze: any = breeze || {};
core.parent = breeze;
breeze.core = core;

