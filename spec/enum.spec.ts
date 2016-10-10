import { Enum, EnumSymbol, TypedEnum } from '../src/enum';

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