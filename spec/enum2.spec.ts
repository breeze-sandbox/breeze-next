import { BreezeEnum } from '../src/enum';
// class BreezeEnumx {
//   name: string;
//   static _resolvedNamesAndSymbols: { name: string, symbol: BreezeEnum }[];

//   constructor(propertiesObj?: Object) {
//     if (propertiesObj) {
//       Object.keys(propertiesObj).forEach((key) => this[key] = propertiesObj[key]);
//     }
//   }

//   /**
//   Returns all of the symbols contained within this Enum.
//   @example
//       let symbols = DayOfWeek.getSymbols();
//   @method getSymbols
//   @return {Array of EnumSymbol} All of the symbols contained within this Enum.
//   **/
//   static getSymbols() {
//     return this.resolveSymbols().map(ks => ks.symbol);
//   };

//   /**
//   Returns the names of all of the symbols contained within this Enum.
//   @example
//       let symbols = DayOfWeek.getNames();
//   @method getNames
//   @return {Array of String} All of the names of the symbols contained within this Enum.
//   **/
//   static getNames() {
//     return this.resolveSymbols().map(ks => ks.name);
//   };

//   /**
//   Seals this enum so that no more symbols may be added to it. This should only be called after all symbols
//   have already been added to the Enum.
//   >       DayOfWeek.resolveSymbols();
//   **/
//   // resolveSymbols() {
//   //   if (this._resolvedNamesAndSymbols) return this._resolvedNamesAndSymbols;
//   //   let result: {name: string, symbol: Enum2 }[] = [];
//   //   let enumType = Object.getPrototypeOf(this);
//   //   let ctor = enumType.constructor;
//   //   for (let key in ctor) {
//   //     if (ctor.hasOwnProperty(key)) {
//   //       let symb = ctor[key];
//   //       if (symb instanceof Enum2) {
//   //         result.push( { name: key, symbol: symb });
//   //         this[key] = symb;
//   //         symb.name = key;
//   //       }
//   //     }
//   //   }
//   //   this._resolvedNamesAndSymbols = result;
//   //   return result;
//   // }

//   static resolveSymbols() {
//     if (this._resolvedNamesAndSymbols) return this._resolvedNamesAndSymbols;
//     let result: {name: string, symbol: BreezeEnum }[] = [];

//     for (let key in this) {
//       if (this.hasOwnProperty(key)) {
//         let symb = this[key];
//         if (symb instanceof BreezeEnum) {
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
//   static contains(sym: BreezeEnum) {
//     if (!(sym instanceof BreezeEnum)) {
//       return false;
//     }

//     return this[sym.name] != null;
//   };


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
//     return obj instanceof BreezeEnum;
//   };

//   toString() {
//     return this.name;
//   };

//   /** Return enum name and symbol name */
//   toJSON() {
//     return {
//       _$typeName: (this.constructor as any).name,
//       name: this.name
//     };
//   };

// }


class DayOfWeek extends BreezeEnum {
  dayIndex: number;
  isWeekend?: boolean;
  nextDay() {
      let nextIndex = (this.dayIndex + 1) % 7;
      return DayOfWeek.getSymbols()[nextIndex];
  }

  static Monday = new DayOfWeek( { dayIndex: 0});
  static Tuesday = new DayOfWeek( { dayIndex: 1 });
  static Wednesday = new DayOfWeek( { dayIndex: 2 });
  static Thursday = new DayOfWeek( { dayIndex: 3 });
  static Friday = new DayOfWeek( { dayIndex: 4 });
  static Saturday = new DayOfWeek( { dayIndex: 5, isWeekend: true });
  static Sunday = new DayOfWeek( { dayIndex: 6, isWeekend: true });

}

class EntityState extends BreezeEnum {
  isGood: boolean;
  static Added = new EntityState({ isGood: true });
  static Modified = new EntityState({ isGood: true });
  static Deleted = new EntityState({ isGood: false });
}


describe("DayOfWeek2", () => {

   it("should support full enum capabilities", function() {
    // // custom methods
      let dowSymbols = DayOfWeek.getSymbols();
      let esSymbols = EntityState.getSymbols();
      expect(dowSymbols.length).toBe(7);
      expect(esSymbols.length).toBe(3);
      expect(DayOfWeek.Monday.nextDay()).toBe(DayOfWeek.Tuesday);
      expect(DayOfWeek.Sunday.nextDay()).toBe(DayOfWeek.Monday);
    // // custom properties
      expect(DayOfWeek.Tuesday.isWeekend).toBe(undefined);
      expect(DayOfWeek.Saturday.isWeekend).toBe(true);
    // // Standard enum capabilities
      expect(DayOfWeek.Thursday instanceof DayOfWeek).toBe(true);
      expect(BreezeEnum.isSymbol(DayOfWeek.Wednesday)).toBe(true);
      expect(DayOfWeek.contains(DayOfWeek.Thursday)).toBe(true);
      let json = DayOfWeek.Wednesday.toJSON();
      expect(json._$typeName).toBe('DayOfWeek');

      expect(DayOfWeek.Friday.toString()).toBe("Friday");
    });

});