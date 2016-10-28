"use strict";
var core_fns_1 = require('../src/core-fns');
// declare let console: any;
describe("Core", function () {
    it("should support strong typing at top level", function () {
        var fn1 = core_fns_1.breeze.core.arrayFirst;
        var fn2 = core_fns_1.core.arrayFirst;
        expect(fn1).not.toBe(null);
        expect(fn1).toEqual(fn2);
    });
});
//# sourceMappingURL=core.spec.js.map