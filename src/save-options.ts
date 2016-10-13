import { breeze, core } from './core-fns';
import { Enum, EnumSymbol, TypedEnum } from './enum';
import { config } from './config';
import { assertConfig } from './assert-param';
import { DataService } from './data-service';

export class SaveOptionsConfig {
  resourceName?: string;
  dataService?: DataService;
  allowConcurrentSaves?: boolean;
  tag?: any;
}

/**
  A SaveOptions instance is used to specify the 'options' under which a save will occur.

  @class SaveOptions
  **/
export class SaveOptions {
  _$typeName = "SaveOptions";

  resourceName: string;
  dataService: DataService;
  allowConcurrentSaves: boolean;
  tag: any;

  static defaultInstance = new SaveOptions({ allowConcurrentSaves: false});

  /**
  @method <ctor> SaveOptions
  @param config {Object}
  @param [config.allowConcurrentSaves] {Boolean} Whether multiple saves can be in-flight at the same time. The default is false.
  @param [config.resourceName] {String} Resource name to be used during the save - this defaults to "SaveChanges"
  @param [config.dataService] {DataService} The DataService to be used for this save.
  @param [config.tag] {Object} Free form value that will be sent to the server during the save.
  **/
  constructor(config: SaveOptionsConfig) {
    SaveOptions._updateWithConfig(this, config);
  };


  /**
  Sets the 'defaultInstance' by creating a copy of the current 'defaultInstance' and then applying all of the properties of the current instance.
  The current instance is returned unchanged.
  @method setAsDefault
  @chainable
  **/
  setAsDefault() {
    return core.setAsDefault(this, SaveOptions);
  };

  /**
  Whether another save can be occuring at the same time as this one - default is false.

  __readOnly__
  @property allowConcurrentSaves {Boolean}
  **/

  /**
  A {{#crossLink "DataService"}}{{/crossLink}}.
  __readOnly__
  @property dataService {DataService}
  **/

  /**
  The resource name to call to perform the save.
  __readOnly__
  @property resourceName {String}
  **/

  /**
  A free form value that will be sent to the server.

  __readOnly__
  @property tag {Object}
  **/

  /**
  The default value whenever SaveOptions are not specified.
  @property defaultInstance {SaveOptions}
  @static
  **/

  /**
  Returns a copy of this SaveOptions with the specified config options applied.
  @example
      var saveOptions = em1.saveOptions.using( {resourceName: "anotherResource" });

  @method using
  @param config {Configuration Object|} The object to apply to create a new SaveOptions.
  @param [config.allowConcurrentSaves] {Boolean} Whether multiple saves can be in-flight at the same time. The default is false.
  @param [config.resourceName] {String} Resource name to be used during the save - this defaults to "SaveChanges"
  @param [config.dataService] {DataService} The DataService to be used for this save.
  @param [config.tag] {Object} Free form value that will be sent to the server during the save.
  @chainable
  **/
  using(config: SaveOptionsConfig) {
    return SaveOptions._updateWithConfig(this, config);
  };

  private static _updateWithConfig(obj: SaveOptions, config: SaveOptionsConfig) {
    if (config) {
      assertConfig(config)
          .whereParam("resourceName").isOptional().isString()
          .whereParam("dataService").isOptional().isInstanceOf(DataService)
          .whereParam("allowConcurrentSaves").isBoolean().isOptional()
          .whereParam("tag").isOptional()
          .applyAll(obj);
    }
    return obj;
  }

}

breeze.SaveOptions = SaveOptions;


