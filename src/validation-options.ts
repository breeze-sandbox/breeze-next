import { breeze, core  } from './core-fns';
import { assertConfig } from './assert-param';

export interface IValidationOptionsConfig {
  validateOnAttach: boolean;
  validateOnSave: boolean;
  validateOnQuery: boolean;
  validateOnPropertyChange: boolean;
}

export class ValidationOptions implements IValidationOptionsConfig {
  _$typeName = "ValidationOptions";
  validateOnAttach: boolean;
  validateOnSave: boolean;
  validateOnQuery: boolean;
  validateOnPropertyChange: boolean;

  /**
  A ValidationOptions instance is used to specify the conditions under which validation will be executed.

  @class ValidationOptions
  **/

  /**
  ValidationOptions constructor
  @example
      var newVo = new ValidationOptions( { validateOnSave: false, validateOnAttach: false });
      // assume em1 is a preexisting EntityManager
      em1.setProperties( { validationOptions: newVo });
  @method <ctor> ValidationOptions
  @param [config] {Object}
  @param [config.validateOnAttach=true] {Boolean}
  @param [config.validateOnSave=true] {Boolean}
  @param [config.validateOnQuery=false] {Boolean}
  @param [config.validateOnPropertyChange=true] {Boolean}
  **/
  constructor(config: IValidationOptionsConfig) {
    updateWithConfig(this, config);
  };

  /**
  Whether entity and property level validation should occur when entities are attached to the EntityManager other than via a query.

  __readOnly__
  @property validateOnAttach {Boolean}
  **/

  /**
  Whether entity and property level validation should occur before entities are saved. A failed validation will force the save to fail early.

  __readOnly__
  @property validateOnSave {Boolean}
  **/

  /**
  Whether entity and property level validation should occur after entities are queried from a remote server.

  __readOnly__
  @property validateOnQuery {Boolean}
  **/

  /**
  Whether property level validation should occur after entities are modified.

  __readOnly__
  @property validateOnPropertyChange {Boolean}
  **/

  /**
  Returns a copy of this ValidationOptions with changes to the specified config properties.
  @example
      var validationOptions = new ValidationOptions();
      var newOptions = validationOptions.using( { validateOnQuery: true, validateOnSave: false} );
  @method using
  @param config {Object} The object to apply to create a new QueryOptions.
  @param [config.validateOnAttach] {Boolean}
  @param [config.validateOnSave] {Boolean}
  @param [config.validateOnQuery] {Boolean}
  @param [config.validateOnPropertyChange] {Boolean}
  @return {ValidationOptions}
  @chainable
  **/
  using(config: IValidationOptionsConfig) {
    if (!config) return this;
    let result = new ValidationOptions(this);
    updateWithConfig(result, config);
    return result;
  };

  /**
  Sets the 'defaultInstance' by creating a copy of the current 'defaultInstance' and then applying all of the properties of the current instance.
  The current instance is returned unchanged.
  @example
      var validationOptions = new ValidationOptions()
      var newOptions = validationOptions.using( { validateOnQuery: true, validateOnSave: false} );
      var newOptions.setAsDefault();
  @method setAsDefault
  @chainable
  **/
  setAsDefault() {
    return core.setAsDefault(this, ValidationOptions);
  };

  /**
  The default value whenever ValidationOptions are not specified.
  @property defaultInstance {ValidationOptions}
  @static
  **/
  static defaultInstance = new ValidationOptions({
    validateOnAttach: true,
    validateOnSave: true,
    validateOnQuery: false,
    validateOnPropertyChange: true
  });
}

function updateWithConfig(options: ValidationOptions, config: IValidationOptionsConfig) {
  if (config) {
    assertConfig(config)
        .whereParam("validateOnAttach").isBoolean().isOptional()
        .whereParam("validateOnSave").isBoolean().isOptional()
        .whereParam("validateOnQuery").isBoolean().isOptional()
        .whereParam("validateOnPropertyChange").isBoolean().isOptional()
        .applyAll(options);
  }
  return options;
}

breeze.ValidationOptions = ValidationOptions;



