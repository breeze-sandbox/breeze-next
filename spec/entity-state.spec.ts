import { EntityAction } from './../src/entity-action';
import { assertParam } from './../src/assert-param';

import { EntityState } from '../src/entity-state';

describe("EntityState", function () {
  beforeEach(function () {

  });

  it("should have static members", function () {
    expect(EntityState.instance.contains(EntityState.Modified));
    expect(EntityState.instance.name).toBe("EntityState");
    expect(EntityState.instance.fromName('Added')).toBe(EntityState.Added);
    let est = EntityState;
    let nm = est.Added.name;
    if (nm == null) {
      fail("should not get here");
    }
    expect(EntityState.Added.name).toBe("Added");
    expect(EntityState.Added.parentEnum).toBe(EntityState.instance);
    expect(EntityState.Added.parentEnum.constructor).toBe(EntityState);
    let es = EntityState.Detached;
    assertParam(es, "entityState").isEnumOf(EntityState).check();
    try {
      assertParam(es, "entityState").isEnumOf(EntityAction).check();
      fail("should not get here");
    } catch (e) {
      // should get here
    }
  });
});