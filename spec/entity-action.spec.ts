
import { EntityAction } from '../src/entity-action';
// import jasmine from 'jasmine';

describe("EntityAction", function() {
  // var EntityAction = require('../src/entity-action.js').EntityAction;

  beforeEach(function() {

  });

  it("should have static members", function() {
    expect(EntityAction.contains(EntityAction.Attach));
    expect(EntityAction.name).toBe("EntityAction");
    expect(EntityAction.Attach.name).toBe("Attach");
    expect(EntityAction.Attach.parentEnum).toBe(EntityAction);
    expect(EntityAction.Attach.isAttach()).toBe(true);
    expect(EntityAction.Attach.isDetach()).toBe(false);
    expect(EntityAction.Detach.isAttach()).toBe(false);
    expect(EntityAction.Detach.isDetach()).toBe(true);
  });
});