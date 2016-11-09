
import { EntityAction } from '../src/entity-action';


describe("EntityAction", function () {

  beforeEach(function () {

  });

  it("should have static members", function () {
    expect(EntityAction.instance.contains(EntityAction.Attach));
    expect(EntityAction.instance.name).toBe("EntityAction");
    expect(EntityAction.Attach.name).toBe("Attach");
    expect(EntityAction.Attach.parentEnum).toBe(EntityAction.instance);
    expect(EntityAction.Attach.isAttach()).toBe(true);
    expect(EntityAction.Attach.isDetach()).toBe(false);
    expect(EntityAction.Detach.isAttach()).toBe(false);
    expect(EntityAction.Detach.isDetach()).toBe(true);
  });
});