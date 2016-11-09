import { Enum, EnumSymbol, TypedEnum } from '../src/enum';

class DayOfWeekSymbol extends EnumSymbol {
    dayIndex: number;
    isWeekend?: boolean;
    nextDay() {
        let nextIndex = (this.dayIndex + 1) % 7;
        return DayOfWeek.instance.getSymbols()[nextIndex];
    }
}

class DayOfWeek extends TypedEnum<DayOfWeekSymbol> {
  static instance = new DayOfWeek();
  constructor() {
    super("DayOfWeek", DayOfWeekSymbol);
  }
  static Monday = DayOfWeek.instance.addSymbol( { dayIndex: 0});
  static Tuesday = DayOfWeek.instance.addSymbol( { dayIndex: 1 });
  static Wednesday = DayOfWeek.instance.addSymbol( { dayIndex: 2 });
  static Thursday = DayOfWeek.instance.addSymbol( { dayIndex: 3 });
  static Friday = DayOfWeek.instance.addSymbol( { dayIndex: 4 });
  static Saturday = DayOfWeek.instance.addSymbol( { dayIndex: 5, isWeekend: true });
  static Sunday = DayOfWeek.instance.addSymbol( { dayIndex: 6, isWeekend: true });
}


describe("DayOfWeek", () => {

   it("should support full enum capabilities", function() {
    // // custom methods
      expect(DayOfWeek.Monday.nextDay()).toBe(DayOfWeek.Tuesday);
      expect(DayOfWeek.Sunday.nextDay()).toBe(DayOfWeek.Monday);
    // // custom properties
      expect(DayOfWeek.Tuesday.isWeekend).toBe(undefined);
      expect(DayOfWeek.Saturday.isWeekend).toBe(true);
    // // Standard enum capabilities
      expect(DayOfWeek.instance instanceof Enum).toBe(true);
      expect(Enum.isSymbol(DayOfWeek.Wednesday)).toBe(true);
      expect(DayOfWeek.Wednesday instanceof DayOfWeekSymbol).toBe(true);
      expect(DayOfWeek.instance.contains(DayOfWeek.Thursday)).toBe(true);
      expect(DayOfWeek.Tuesday.parentEnum).toBe(DayOfWeek.instance);
      expect(DayOfWeek.instance.getSymbols().length).toBe(7);

      expect(DayOfWeek.Friday.toString()).toBe("Friday");
    });

});