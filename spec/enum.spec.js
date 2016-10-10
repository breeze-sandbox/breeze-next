"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var enum_1 = require('../src/enum');
var DayOfWeekSymbol = (function (_super) {
    __extends(DayOfWeekSymbol, _super);
    function DayOfWeekSymbol() {
        _super.apply(this, arguments);
    }
    DayOfWeekSymbol.prototype.nextDay = function () {
        var nextIndex = (this.dayIndex + 1) % 7;
        return DayOfWeek.getSymbols()[nextIndex];
    };
    return DayOfWeekSymbol;
}(enum_1.EnumSymbol));
var DayOfWeekEnum = (function (_super) {
    __extends(DayOfWeekEnum, _super);
    function DayOfWeekEnum() {
        _super.call(this, "DayOfWeek", DayOfWeekSymbol);
        this.Monday = this.addSymbol({ dayIndex: 0 });
        this.Tuesday = this.addSymbol({ dayIndex: 1 });
        this.Wednesday = this.addSymbol({ dayIndex: 2 });
        this.Thursday = this.addSymbol({ dayIndex: 3 });
        this.Friday = this.addSymbol({ dayIndex: 4 });
        this.Saturday = this.addSymbol({ dayIndex: 5, isWeekend: true });
        this.Sunday = this.addSymbol({ dayIndex: 6, isWeekend: true });
    }
    return DayOfWeekEnum;
}(enum_1.TypedEnum));
var DayOfWeek = new DayOfWeekEnum();
describe("DayOfWeek", function () {
    it("should support full enum capabilities", function () {
        // // custom methods
        expect(DayOfWeek.Monday.nextDay()).toBe(DayOfWeek.Tuesday);
        expect(DayOfWeek.Sunday.nextDay()).toBe(DayOfWeek.Monday);
        // // custom properties
        expect(DayOfWeek.Tuesday.isWeekend).toBe(undefined);
        expect(DayOfWeek.Saturday.isWeekend).toBe(true);
        // // Standard enum capabilities
        expect(DayOfWeek instanceof enum_1.Enum).toBe(true);
        expect(enum_1.Enum.isSymbol(DayOfWeek.Wednesday)).toBe(true);
        expect(DayOfWeek.contains(DayOfWeek.Thursday)).toBe(true);
        expect(DayOfWeek.Tuesday.parentEnum).toBe(DayOfWeek);
        expect(DayOfWeek.getSymbols().length).toBe(7);
        expect(DayOfWeek.Friday.toString()).toBe("Friday");
    });
});
//# sourceMappingURL=enum.spec.js.map