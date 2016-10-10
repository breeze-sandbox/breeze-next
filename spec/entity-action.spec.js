"use strict";
var entity_action_1 = require('../src/entity-action');
// import jasmine from 'jasmine';
describe("EntityAction", function () {
    // var EntityAction = require('../src/entity-action.js').EntityAction;
    beforeEach(function () {
    });
    it("should have static members", function () {
        expect(entity_action_1.EntityAction.contains(entity_action_1.EntityAction.Attach));
        expect(entity_action_1.EntityAction.name).toBe("EntityAction");
        expect(entity_action_1.EntityAction.Attach.name).toBe("Attach");
        expect(entity_action_1.EntityAction.Attach.parentEnum).toBe(entity_action_1.EntityAction);
        expect(entity_action_1.EntityAction.Attach.isAttach()).toBe(true);
        expect(entity_action_1.EntityAction.Attach.isDetach()).toBe(false);
        expect(entity_action_1.EntityAction.Detach.isAttach()).toBe(false);
        expect(entity_action_1.EntityAction.Detach.isDetach()).toBe(true);
    });
});
//# sourceMappingURL=entity-action.spec.js.map