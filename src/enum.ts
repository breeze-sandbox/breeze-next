﻿import { __arrayFirst, __isFunction } from './core-fns';

  // TODO: think about CompositeEnum (flags impl).

  /**
  Base class for all Breeze enumerations, such as EntityState, DataType, FetchStrategy, MergeStrategy etc.
  A Breeze Enum is a namespaced set of constant values.  Each Enum consists of a group of related constants, called 'symbols'.
  Unlike enums in some other environments, each 'symbol' can have both methods and properties.

  @example
      // Example of creating a new Enum
      let prototype = {
          nextDay: function () {
              let nextIndex = (this.dayIndex+1) % 7;
              return DayOfWeek.getSymbols()[nextIndex];
          }
      };

      let DayOfWeek = new Enum("DayOfWeek", prototype);
      DayOfWeek.Monday    = DayOfWeek.addSymbol( { dayIndex: 0 });
      DayOfWeek.Tuesday   = DayOfWeek.addSymbol( { dayIndex: 1 });
      DayOfWeek.Wednesday = DayOfWeek.addSymbol( { dayIndex: 2 });
      DayOfWeek.Thursday  = DayOfWeek.addSymbol( { dayIndex: 3 });
      DayOfWeek.Friday    = DayOfWeek.addSymbol( { dayIndex: 4 });
      DayOfWeek.Saturday  = DayOfWeek.addSymbol( { dayIndex: 5, isWeekend: true });
      DayOfWeek.Sunday    = DayOfWeek.addSymbol( { dayIndex: 6, isWeekend: true });
      DayOfWeek.resolveSymbols();

      // custom methods
      ok(DayOfWeek.Monday.nextDay() === DayOfWeek.Tuesday);
      ok(DayOfWeek.Sunday.nextDay() === DayOfWeek.Monday);
      // custom properties
      ok(DayOfWeek.Tuesday.isWeekend === undefined);
      ok(DayOfWeek.Saturday.isWeekend == true);
      // Standard enum capabilities
      ok(DayOfWeek instanceof Enum);
      ok(Enum.isSymbol(DayOfWeek.Wednesday));
      ok(DayOfWeek.contains(DayOfWeek.Thursday));
      ok(DayOfWeek.Tuesday.parentEnum == DayOfWeek);
      ok(DayOfWeek.getSymbols().length === 7);
      ok(DayOfWeek.Friday.toString() === "Friday");


  @class Enum
  **/
export class Enum {
    name: string;
    _symbolPrototype: EnumSymbol;


    /**
    Enum constructor - may be used to create new Enums.
    @example
        let prototype = {
            nextDay: function () {
                let nextIndex = (this.dayIndex+1) % 7;
                return DayOfWeek.getSymbols()[nextIndex];
            }
        };

        let DayOfWeek = new Enum("DayOfWeek", prototype);
    @method <ctor> Enum
    @param name {String}
    @param [methodObj] {Object}
    **/
    constructor(name: string, methodObj: Object) {
        this.name = name;
        let prototype = new EnumSymbol(methodObj);
        prototype.parentEnum = this;
        this._symbolPrototype = prototype;
        if (methodObj) {
            Object.keys(methodObj).forEach(function (key) {
                prototype[key] = methodObj[key];
            });
        }
    }

    /**
    Checks if an object is an Enum 'symbol'.
    @example
        if (Enum.isSymbol(DayOfWeek.Wednesday)) {
        // do something ...
        };
    @method isSymbol
    @return {Boolean}
    @static
    **/
    static isSymbol(obj: any) {
        return obj instanceof EnumSymbol;
    };

    /**
    Returns an Enum symbol given its name.
    @example
        let dayOfWeek = DayOfWeek.from("Thursday");
        // nowdayOfWeek === DayOfWeek.Thursday
    @method fromName
    @param name {String} Name for which an enum symbol should be returned.
    @return {EnumSymbol} The symbol that matches the name or 'undefined' if not found.
    **/
    fromName(name: string) {
        return this[name];
    };

    /**
    Adds a new symbol to an Enum.
    @example
        let DayOfWeek = new Enum("DayOfWeek", prototype);
        DayOfWeek.Monday    = DayOfWeek.addSymbol( { dayIndex: 0 });
    @method addSymbol
    @param [propertiesObj] {Object} A collection of properties that should be added to the new symbol.
    In other words, the 'propertiesObj' is any state that should be held by the symbol.
    @return {EnumSymbol} The new symbol
    **/
    addSymbol(propertiesObj: Object) {
        // TODO: check if sealed.
        let newSymbol = Object.create(this._symbolPrototype);
        if (propertiesObj) {
            Object.keys(propertiesObj).forEach(function (key) {
                newSymbol[key] = propertiesObj[key];
            });
        }
        setTimeout(function () {
            newSymbol.getName();
        }, 0);
        return newSymbol;
    };

    /**
    Seals this enum so that no more symbols may be added to it. This should only be called after all symbols
    have already been added to the Enum.
    @example
        DayOfWeek.resolveSymbols();
    @method resolveSymbols
    **/
    resolveSymbols() {
        this.getSymbols().forEach(function (sym: EnumSymbol) {
            return sym.getName();
        });
    };

    /**
    Returns all of the symbols contained within this Enum.
    @example
        let symbols = DayOfWeek.getSymbols();
    @method getSymbols
    @return {Array of EnumSymbol} All of the symbols contained within this Enum.
    **/
    getSymbols() {
        return this.getNames().map(function (key: string) {
            return this[key];
        }, this);
    };

    /**
    Returns the names of all of the symbols contained within this Enum.
    @example
        let symbols = DayOfWeek.getNames();
    @method getNames
    @return {Array of String} All of the names of the symbols contained within this Enum.
    **/
    getNames() {
        let result: string[] = [];
        for (let key in this) {
            if (this.hasOwnProperty(key)) {
                if (key !== "name" && key.substr(0, 1) !== "_" && !__isFunction(this[key])) {
                    result.push(key);
                }
            }
        }
        return result;
    };

    /**
    Returns whether an Enum contains a specified symbol.
    @example
        let symbol = DayOfWeek.Friday;
        if (DayOfWeek.contains(symbol)) {
            // do something
        }
    @method contains
    @param {Object} Object or symbol to test.
    @return {Boolean} Whether this Enum contains the specified symbol.
    **/
    contains(sym: any) {
        if (!(sym instanceof EnumSymbol)) {
            return false;
        }
        return this[sym.getName()] === sym;
    };


}

/**
One of the constant values that is generated by the {{#crossLink "Enum"}}{{/crossLink}} "addSymbol" method.  EnumSymbols should ONLY be created via
the Enum.addSymbol method.
@example
    let DayOfWeek = new Enum("DayOfWeek");
    DayOfWeek.Monday    = DayOfWeek.addSymbol();
@class EnumSymbol
**/
class EnumSymbol {

    name: string;
    /**
    The {{#crossLink "Enum"}}{{/crossLink}} to which this symbol belongs.
    __readOnly__
    @property parentEnum {Enum}
    **/
    parentEnum: Enum;

    constructor(methodObj: Object) {
    }

    /**
    Returns the name of this symbol.
    @example
        let name = DayOfWeek.Monday.getName();
        // name === "Monday"
    @method getName
    **/
    getName() {
        if (!this.name) {
            let that = this;
            this.name = __arrayFirst(this.parentEnum.getNames(), function (name: string) {
                return that.parentEnum[name] === that;
            });
        }
        return this.name;
    };

    /**
    Same as the getName method. Returns the name of this symbol.
    @example
        let name = DayOfWeek.Monday.toString();
        // name === "Monday"
    @method toString
    **/
    toString() {
        return this.getName();
    };

    /** Return enum name and symbol name */
    toJSON() {
        return {
            _$typeName: this.parentEnum.name,
            name: this.name
        };
    };

}