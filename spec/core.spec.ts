import { breeze, core } from '../src/core-fns';

// declare let console: any;

describe("Core", () => {

   it("should support strong typing at top level", function() {
     let fn1 = breeze.core.arrayFirst;
     let fn2 = core.arrayFirst;
     expect(fn1).not.toBe(null);
     expect(fn1).toEqual(fn2);

    });


});