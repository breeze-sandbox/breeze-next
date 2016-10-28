"use strict";
var config_1 = require('../src/config');
// declare let console: any;
describe("Config", function () {
    it("should support both new and old ctor mechs", function () {
        config_1.config.initializeAdapterInstances({
            modelLibrary: undefined
        });
    });
});
//# sourceMappingURL=config.spec.js.map