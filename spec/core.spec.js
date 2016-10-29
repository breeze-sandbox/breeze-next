"use strict";
var breeze_1 = require('../src/breeze');
var core_1 = require('../src/core');
// declare let console: any;
describe("Core", function () {
    it("should support strong typing at top level", function () {
        var fn1 = breeze_1.breeze.core.arrayFirst;
        var fn2 = core_1.core.arrayFirst;
        expect(fn1).not.toBe(null);
        expect(fn1).toEqual(fn2);
    });
});
//# sourceMappingURL=core.spec.js.map