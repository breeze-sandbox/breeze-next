"use strict";
var entity_manager_1 = require('../src/entity-manager');
// import jasmine from 'jasmine';
describe("EntityManager", function () {
    beforeEach(function () {
    });
    it("should be able to create", function () {
        var em = new entity_manager_1.EntityManager('test');
        var r = em.getChanges();
        expect(r.length).toBe(0);
    });
});
//# sourceMappingURL=entity-manager.spec.js.map