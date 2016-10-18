"use strict";
var predicate_1 = require('../src/predicate');
describe("Predicate", function () {
    it("should support both new and old ctor mechs", function () {
        var p1 = new predicate_1.Predicate("CompanyName", "StartsWith", "B");
        var p2 = predicate_1.Predicate("CompanyName", "StartsWith", "B"); // calling without ctor
        var p3 = predicate_1.Predicate.create("CompanyName", "startsWith", "B");
        var p4 = predicate_1.Predicate.create(["CompanyName", "StartsWith", "B"]);
        var p5 = predicate_1.Predicate.create({ CompanyName: { startsWith: "B" } });
        var p6 = predicate_1.Predicate({ CompanyName: { StartsWith: "B" } }); // calling without ctor
        expect(p1.toString()).toEqual(p2.toString());
        expect(p1.toString()).toEqual(p3.toString());
        expect(p1.toString()).toEqual(p4.toString());
        expect(p1.toString()).toEqual(p5.toString());
        expect(p1.toString()).toEqual(p6.toString());
    });
    it("should support toJson", function () {
        var p1 = new predicate_1.Predicate("CompanyName", "StartsWith", "B");
        var json = p1.toJSON();
        var s = JSON.stringify(json);
        console.log('\ntest');
        console.log(s);
    });
});
//# sourceMappingURL=predicate.spec.js.map