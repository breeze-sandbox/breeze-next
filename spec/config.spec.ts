import { config } from '../src/config';

// declare let console: any;

describe("Config", () => {

   it("should support both new and old ctor mechs", function() {
      config.initializeAdapterInstances( {
        modelLibrary: undefined
      } );


    });


});