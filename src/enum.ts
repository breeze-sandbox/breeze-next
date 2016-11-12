/**
Base class for all Breeze enumerations, such as EntityState, DataType, FetchStrategy, MergeStrategy etc.
A Breeze Enum is a namespaced set of constant values.  Each Enum consists of a group of related constants, called 'symbols'.
Unlike enums in some other environments, each 'symbol' can have both methods and properties.

@example
    // Example of creating a new Enum
       class DayOfWeekSymbol extends EnumSymbol {
            dayIndex: number;
            isWeekend?: boolean;
            nextDay() {
                let nextIndex = (this.dayIndex + 1) % 7;
                return DayOfWeek.getSymbols()[nextIndex];
            }
        }

        class DayOfWeekEnum extends TypedEnum<DayOfWeekSymbol> {
            constructor() {
                super("DayOfWeek", DayOfWeekSymbol);
            }
            Monday = this.addSymbol( { dayIndex: 0});
            Tuesday = this.addSymbol( { dayIndex: 1 });
            Wednesday = this.addSymbol( { dayIndex: 2 });
            Thursday = this.addSymbol( { dayIndex: 3 });
            Friday = this.addSymbol( { dayIndex: 4 });
            Saturday = this.addSymbol( { dayIndex: 5, isWeekend: true });
            Sunday = this.addSymbol( { dayIndex: 6, isWeekend: true });
        }

        let DayOfWeek = new DayOfWeekEnum();

        describe("DayOfWeek", () => {

            it("should support full enum capabilities", function() {
                // // custom methods
                expect(DayOfWeek.Monday.nextDay()).toBe(DayOfWeek.Tuesday);
                expect(DayOfWeek.Sunday.nextDay()).toBe(DayOfWeek.Monday);
                // // custom properties
                expect(DayOfWeek.Tuesday.isWeekend).toBe(undefined);
                expect(DayOfWeek.Saturday.isWeekend).toBe(true);
                // // Standard enum capabilities
                expect(DayOfWeek instanceof Enum).toBe(true);
                expect(Enum.isSymbol(DayOfWeek.Wednesday)).toBe(true);
                expect(DayOfWeek.contains(DayOfWeek.Thursday)).toBe(true);
                expect(DayOfWeek.Tuesday.parentEnum).toBe(DayOfWeek);
                expect(DayOfWeek.getSymbols().length).toBe(7);
                expect(DayOfWeek.Friday.toString()).toBe("Friday");
                });

            });
        });            
*/
export class BreezeEnum {
  name: string;
  static _resolvedNamesAndSymbols: { name: string, symbol: BreezeEnum }[];

  constructor(propertiesObj?: Object) {
    if (propertiesObj) {
      Object.keys(propertiesObj).forEach((key) => this[key] = propertiesObj[key]);
    }
  }

  /**
  Returns all of the symbols contained within this Enum.
  @example
      let symbols = DayOfWeek.getSymbols();
  @method getSymbols
  @return {Array of EnumSymbol} All of the symbols contained within this Enum.
  **/
  static getSymbols() {
    return this.resolveSymbols().map(ks => ks.symbol);
  };

  /**
  Returns the names of all of the symbols contained within this Enum.
  @example
      let symbols = DayOfWeek.getNames();
  @method getNames
  @return {Array of String} All of the names of the symbols contained within this Enum.
  **/
  static getNames() {
    return this.resolveSymbols().map(ks => ks.name);
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
  static fromName(name: string) {
    return this[name];
  };

  /**
  Seals this enum so that no more symbols may be added to it. This should only be called after all symbols
  have already been added to the Enum.
  >       DayOfWeek.resolveSymbols();
  **/
  static resolveSymbols() {
    if (this._resolvedNamesAndSymbols) return this._resolvedNamesAndSymbols;
    let result: {name: string, symbol: BreezeEnum }[] = [];

    for (let key in this) {
      if (this.hasOwnProperty(key)) {
        let symb = this[key];
        if (symb instanceof BreezeEnum) {
          result.push( { name: key, symbol: symb });
          this[key] = symb;
          symb.name = key;
        }
      }
    }
    this._resolvedNamesAndSymbols = result;
    return result;
  }

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
  static contains(sym: BreezeEnum) {
    if (!(sym instanceof BreezeEnum)) {
      return false;
    }

    return this[sym.name] != null;
  };


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
    return obj instanceof BreezeEnum;
  };

  toString() {
    return this.name;
  };

  /** Return enum name and symbol name */
  toJSON() {
    return {
      _$typeName: (this.constructor as any).name,
      name: this.name
    };
  };

}

// // TODO: think about CompositeEnum (flags impl).

// /**
// Base class for all Breeze enumerations, such as EntityState, DataType, FetchStrategy, MergeStrategy etc.
// A Breeze Enum is a namespaced set of constant values.  Each Enum consists of a group of related constants, called 'symbols'.
// Unlike enums in some other environments, each 'symbol' can have both methods and properties.

// @example
//     // Example of creating a new Enum
//        class DayOfWeekSymbol extends EnumSymbol {
//             dayIndex: number;
//             isWeekend?: boolean;
//             nextDay() {
//                 let nextIndex = (this.dayIndex + 1) % 7;
//                 return DayOfWeek.getSymbols()[nextIndex];
//             }
//         }

//         class DayOfWeekEnum extends TypedEnum<DayOfWeekSymbol> {
//             constructor() {
//                 super("DayOfWeek", DayOfWeekSymbol);
//             }
//             Monday = this.addSymbol( { dayIndex: 0});
//             Tuesday = this.addSymbol( { dayIndex: 1 });
//             Wednesday = this.addSymbol( { dayIndex: 2 });
//             Thursday = this.addSymbol( { dayIndex: 3 });
//             Friday = this.addSymbol( { dayIndex: 4 });
//             Saturday = this.addSymbol( { dayIndex: 5, isWeekend: true });
//             Sunday = this.addSymbol( { dayIndex: 6, isWeekend: true });
//         }

//         let DayOfWeek = new DayOfWeekEnum();

//         describe("DayOfWeek", () => {

//             it("should support full enum capabilities", function() {
//                 // // custom methods
//                 expect(DayOfWeek.Monday.nextDay()).toBe(DayOfWeek.Tuesday);
//                 expect(DayOfWeek.Sunday.nextDay()).toBe(DayOfWeek.Monday);
//                 // // custom properties
//                 expect(DayOfWeek.Tuesday.isWeekend).toBe(undefined);
//                 expect(DayOfWeek.Saturday.isWeekend).toBe(true);
//                 // // Standard enum capabilities
//                 expect(DayOfWeek instanceof Enum).toBe(true);
//                 expect(Enum.isSymbol(DayOfWeek.Wednesday)).toBe(true);
//                 expect(DayOfWeek.contains(DayOfWeek.Thursday)).toBe(true);
//                 expect(DayOfWeek.Tuesday.parentEnum).toBe(DayOfWeek);
//                 expect(DayOfWeek.getSymbols().length).toBe(7);
//                 expect(DayOfWeek.Friday.toString()).toBe("Friday");
//                 });

//             });
//         });            


// @class Enum
// **/
// export class Enum {
//   name: string;
//   _symbolPrototype: EnumSymbol;
//   _resolvedNamesAndSymbols: { name: string, symbol: EnumSymbol }[];

//   /**
//   Enum constructor - may be used to create new Enums.
//   @example
//       let prototype = {
//           nextDay: function () {
//               let nextIndex = (this.dayIndex+1) % 7;
//               return DayOfWeek.getSymbols()[nextIndex];
//           }
//       };

//       let DayOfWeek = new Enum("DayOfWeek", prototype);
//   @method <ctor> Enum
//   @param name {String}
//   @param [methodObj] {Object}
//   **/
//   constructor(name: string, methodObj?: Object) {
//     this.name = name;
//     let prototype: EnumSymbol;
//     if (methodObj instanceof EnumSymbol) {
//       prototype = methodObj;
//     } else {
//       prototype = new EnumSymbol();
//       if (methodObj) {
//         Object.keys(methodObj).forEach(function (key) {
//           prototype[key] = methodObj[key];
//         });
//       }
//     }

//     prototype.parentEnum = this;
//     this._symbolPrototype = prototype;

//   }

//   /**
//   Checks if an object is an Enum 'symbol'.
//   @example
//       if (Enum.isSymbol(DayOfWeek.Wednesday)) {
//       // do something ...
//       };
//   @method isSymbol
//   @return {Boolean}
//   @static
//   **/
//   static isSymbol(obj: any) {
//     return obj instanceof EnumSymbol;
//   };

//   /**
//   Returns an Enum symbol given its name.
//   @example
//       let dayOfWeek = DayOfWeek.from("Thursday");
//       // nowdayOfWeek === DayOfWeek.Thursday
//   @method fromName
//   @param name {String} Name for which an enum symbol should be returned.
//   @return {EnumSymbol} The symbol that matches the name or 'undefined' if not found.
//   **/
//   fromName(name: string) {
//     return this[name];
//   };


//   /**
//   Adds a new symbol to an Enum.
//   @example
//       let DayOfWeek = new Enum("DayOfWeek", prototype);
//       DayOfWeek.Monday    = DayOfWeek.addSymbol( { dayIndex: 0 });
//   @method addSymbol
//   @param [propertiesObj] {Object} A collection of properties that should be added to the new symbol.
//   In other words, the 'propertiesObj' is any state that should be held by the symbol.
//   @return {EnumSymbol} The new symbol
//   **/
//   addSymbol(propertiesObj?: Object) {
//     // TODO: check if sealed.
//     let newSymbol = Object.create(this._symbolPrototype);
//     if (propertiesObj) {
//       Object.keys(propertiesObj).forEach(function (key) {
//         newSymbol[key] = propertiesObj[key];
//       });
//     }
//     return newSymbol;
//   };




//   /**
//   Returns all of the symbols contained within this Enum.
//   @example
//       let symbols = DayOfWeek.getSymbols();
//   @method getSymbols
//   @return {Array of EnumSymbol} All of the symbols contained within this Enum.
//   **/
//   getSymbols() {
//     return this.resolveSymbols().map(ks => ks.symbol);
//   };

//   /**
//   Returns the names of all of the symbols contained within this Enum.
//   @example
//       let symbols = DayOfWeek.getNames();
//   @method getNames
//   @return {Array of String} All of the names of the symbols contained within this Enum.
//   **/
//   getNames() {
//     return this.resolveSymbols().map(ks => ks.name);
//   };

//   /**
//   Seals this enum so that no more symbols may be added to it. This should only be called after all symbols
//   have already been added to the Enum.
//   >       DayOfWeek.resolveSymbols();
//   **/
//   resolveSymbols() {
//     if (this._resolvedNamesAndSymbols) return this._resolvedNamesAndSymbols;
//     let result: {name: string, symbol: EnumSymbol }[] = [];
//     let enumType = Object.getPrototypeOf(this);
//     let ctor = enumType.constructor;
//     for (let key in ctor) {
//       if (ctor.hasOwnProperty(key)) {
//         let symb = ctor[key];
//         if (symb instanceof EnumSymbol) {
//           result.push( { name: key, symbol: symb });
//           this[key] = symb;
//           symb.name = key;
//         }
//       }
//     }
//     this._resolvedNamesAndSymbols = result;
//     return result;
//   }

//   /**
//   Returns whether an Enum contains a specified symbol.
//   @example
//       let symbol = DayOfWeek.Friday;
//       if (DayOfWeek.contains(symbol)) {
//           // do something
//       }
//   @method contains
//   @param {Object} Object or symbol to test.
//   @return {Boolean} Whether this Enum contains the specified symbol.
//   **/
//   contains(sym: EnumSymbol) {
//     if (!(sym instanceof EnumSymbol)) {
//       return false;
//     }
//     let enumType = Object.getPrototypeOf(this);
//     let ctor = enumType.constructor;
//     return ctor[sym.name] != null;
//   };


// }

// /**
// One of the constant values that is generated by the {{#crossLink "Enum"}}{{/crossLink}} "addSymbol" method.  EnumSymbols should ONLY be created via
// the Enum.addSymbol method.
// @example
//     let DayOfWeek = new Enum("DayOfWeek");
//     DayOfWeek.Monday    = DayOfWeek.addSymbol();
// @class EnumSymbol
// **/
// export class EnumSymbol {

//   name: string;
//   /**
//   The {{#crossLink "Enum"}}{{/crossLink}} to which this symbol belongs.
//   __readOnly__
//   @property parentEnum {Enum}
//   **/
//   parentEnum: Enum;

//   constructor() {
//   }

//   /**
//   Returns the name of this symbol.
//   @example
//       let name = DayOfWeek.Monday.getName();
//       // name === "Monday"
//   @method getName
//   **/
//   getName() {
//     if (!this.name) {
//       let ns = core.arrayFirst(this.parentEnum.resolveSymbols(), (ns) => ns.symbol === this);
//       this.name = ns ? ns.name : '';
//     }
//     return this.name;
//   };

//   /**
//   Same as the getName method. Returns the name of this symbol.
//   @example
//       let name = DayOfWeek.Monday.toString();
//       // name === "Monday"
//   @method toString
//   **/
//   toString() {
//     return this.getName();
//   };

//   /** Return enum name and symbol name */
//   toJSON() {
//     return {
//       _$typeName: this.parentEnum.name,
//       name: this.name
//     };
//   };

// }

// export class TypedEnum<T extends EnumSymbol> extends Enum {

//   constructor(name: string, c: { new (...args: any[]): T }) {
//     super(name, new c());
//   }

//   addSymbol(propertiesObj?: Object) {
//     return <T>super.addSymbol(propertiesObj);
//   }

//   getSymbols() {
//     return <T[]> super.getSymbols();
//   }
// }

// for legacy support.
// (core as any).Enum = BreezeEnum;