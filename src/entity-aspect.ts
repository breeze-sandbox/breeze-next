import { breeze, core } from './core-fns';
import { config  } from './config';
import { BreezeEvent } from './event';
import { assertParam } from './assert-param';
import { EntityState, EntityStateSymbol } from './entity-state';
import { EntityAction } from './entity-action';
import { EntityType, ComplexType, DataProperty, NavigationProperty, EntityProperty } from './entity-metadata';
import { EntityKey } from './entity-key';
import { EntityGroup } from './entity-group';
import { EntityManager, IQueryResult, QueryErrorCallback, QuerySuccessCallback } from './entity-manager';
import { Validator, ValidationError } from './validate';
import { EntityQuery } from './entity-query';

export interface IEntity {
  entityAspect: EntityAspect;
  entityType: EntityType;
  getProperty(prop: string): any;
  setProperty(prop: any, value: any): void;
  prototype: { _$typeName: string };
  _$entityType: EntityType;
}

export interface IComplexObject {
  complexAspect: ComplexAspect;
  complexType: ComplexType;
  getProperty(prop: string): any;
  setProperty(prop: any, value: any): void;
  prototype: { _$typeName: string };
}

export type IStructuralObject = IEntity | IComplexObject;

/**
  An EntityAspect instance is associated with every attached entity and is accessed via the entity's 'entityAspect' property.

  The EntityAspect itself provides properties to determine and modify the EntityState of the entity and has methods
  that provide a variety of services including validation and change tracking.

  An EntityAspect will almost never need to be constructed directly. You will usually get an EntityAspect by accessing
  an entities 'entityAspect' property.  This property will be automatically attached when an entity is created via either
  a query, import or EntityManager.createEntity call.
  @example
      // assume order is an order entity attached to an EntityManager.
      var aspect = order.entityAspect;
      var currentState = aspect.entityState;
  @class EntityAspect
  **/
export class EntityAspect {
  entity?: IEntity;
  entityManager?: EntityManager;
  entityGroup?: EntityGroup;
  entityState: EntityStateSymbol;
  isBeingSaved: boolean;
  originalValues: {};
  hasValidationErrors: boolean;
  hasTempKey: boolean;
  _validationErrors: { [index: string]: ValidationError };
  _pendingValidationResult: any;
  _entityKey: EntityKey;
  _loadedNps: any[];
  _initialized?: boolean;
  wasLoaded?: boolean;
  validationErrorsChanged: BreezeEvent;
  propertyChanged: BreezeEvent;
  extraMetadata?: any;
  _inProcessEntity?: IEntity; // used in EntityManager

  static _nullInstance = new EntityAspect(); // TODO: determine if this works

  constructor(entity?: IEntity) {

    // if called without new
    // if (!(this instanceof EntityAspect)) {
    //   return new EntityAspect(entity);
    // }

    this.entity = entity;
    // TODO: keep public or not?
    this.entityGroup = undefined;
    this.entityManager = undefined;
    this.entityState = EntityState.Detached;
    this.isBeingSaved = false;
    this.originalValues = {};
    this.hasValidationErrors = false;
    this._validationErrors = {};

    // Uncomment when we implement entityAspect.isNavigationPropertyLoaded method
    // this._loadedNavPropMap = {};

    this.validationErrorsChanged = new BreezeEvent("validationErrorsChanged", this);
    this.propertyChanged = new BreezeEvent("propertyChanged", this);
    // in case this is the NULL entityAspect. - used with ComplexAspects that have no parent.

    if (entity != null) {
      entity.entityAspect = this;
      // entityType should already be on the entity from 'watch'
      let entityType = entity.entityType || entity._$entityType;
      if (!entityType) {
        let typeName = entity.prototype._$typeName;
        if (!typeName) {
          throw new Error("This entity is not registered as a valid EntityType");
        } else {
          throw new Error("Metadata for this entityType has not yet been resolved: " + typeName);
        }
      }
      let entityCtor = entityType.getEntityCtor();
      config.interfaceRegistry.modelLibrary.getDefaultInstance().startTracking(entity, entityCtor.prototype);
    }
  };

  // type-guard
  static isEntity(obj: IStructuralObject): obj is IEntity {
    return (obj as any).entityAspect != null;
  }

  static createFrom(entity: IEntity): EntityAspect {
    if (entity == null) {
      return EntityAspect._nullInstance;
    } else if (entity.entityAspect) {
      return entity.entityAspect;
    }

    return new EntityAspect(entity);

  }

  // used by EntityQuery and Predicate
  static getPropertyPathValue(obj: IEntity, propertyPath: string | string[]) {
  let properties = Array.isArray(propertyPath) ? propertyPath : propertyPath.split(".");
  if (properties.length === 1) {
    return obj.getProperty(propertyPath as string);
  } else {
    let nextValue = obj;
    // hack use of some to perform mapFirst operation.
    properties.some((prop) => {
      nextValue = nextValue.getProperty(prop);
      return nextValue == null;
    });
    return nextValue;
  }
}

  /**
  The Entity that this aspect is associated with.

  __readOnly__
  @property entity {Entity}
  **/

  /**
  The {{#crossLink "EntityManager"}}{{/crossLink}} that contains this entity.

  __readOnly__
  @property entityManager {EntityManager}
  **/

  /**
  The {{#crossLink "EntityState"}}{{/crossLink}} of this entity.

  __readOnly__
  @property entityState {EntityState}
  **/

  /**
  Extra metadata about this entity such as the entity's etag.
  You may extend this object with your own metadata information.
  Breeze (de)serializes this object when importing/exporting the entity.

  @property extraMetadata {Object}
  **/

  /**
  Whether this entity is in the process of being saved.

  __readOnly__
  @property isBeingSaved {Boolean}
  **/

  /**
  Whether this entity has any validation errors.

  __readOnly__
  @property hasValidationErrors {Boolean}
  **/

  /**
  The 'original values' of this entity where they are different from the 'current values'.
  This is a map where the key is a property name and the value is the 'original value' of the property.

  __readOnly__
  @property originalValues {Object}
  **/

  /**
  An {{#crossLink "Event"}}{{/crossLink}} that fires whenever a value of one of this entity's properties change.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.propertyChanged.subscribe(
      function (propertyChangedArgs) {
          // this code will be executed anytime a property value changes on the 'order' entity.
          var entity = propertyChangedArgs.entity; // Note: entity === order
          var propertyNameChanged = propertyChangedArgs.propertyName;
          var oldValue = propertyChangedArgs.oldValue;
          var newValue = propertyChangedArgs.newValue;
      });
  @event propertyChanged
  @param entity {Entity} The entity whose property has changed.
  @param property {DataProperty} The DataProperty that changed.
  @param propertyName {String} The name of the property that changed. This value will be 'null' for operations that replace the entire entity.  This includes
  queries, imports and saves that require a merge. The remaining parameters will not exist in this case either. This will actually be a "property path"
  for any properties of a complex type.
  @param oldValue {Object} The old value of this property before the change.
  @param newValue {Object} The new value of this property after the change.
  @param parent {Object} The immediate parent object for the changed property.  This will be different from the 'entity' for any complex type or nested complex type properties.
  @readOnly
  **/

  /**
  An {{#crossLink "Event"}}{{/crossLink}} that fires whenever any of the validation errors on this entity change.
  Note that this might be the removal of an error when some data on the entity is fixed.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.validationErrorsChanged.subscribe(
      function (validationChangeArgs) {
          // this code will be executed anytime a property value changes on the 'order' entity.
          var entity == validationChangeArgs.entity; // Note: entity === order
          var errorsAdded = validationChangeArgs.added;
          var errorsCleared = validationChangeArgs.removed;
      });
  @event validationErrorsChanged
  @param entity {Entity} The entity on which the validation errors are being added or removed.
  @param added {Array of ValidationError} An array containing any newly added {{#crossLink "ValidationError"}}{{/crossLink}}s
  @param removed {Array of ValidationError} An array containing any newly removed {{#crossLink "ValidationError"}}{{/crossLink}}s. This is those
  errors that have been 'fixed'
  @readOnly
  **/

  /**
  Returns the {{#crossLink "EntityKey"}}{{/crossLink}} for this Entity.
  @example
      // assume order is an order entity attached to an EntityManager.
      var entityKey = order.entityAspect.getKey();
  @method getKey
  @param [forceRefresh=false] {Boolean} Forces the recalculation of the key.  This should normally be unnecessary.
  @return {EntityKey} The {{#crossLink "EntityKey"}}{{/crossLink}} associated with this Entity.
  **/
  getKey(forceRefresh: boolean = false) {
    forceRefresh = assertParam(forceRefresh, "forceRefresh").isBoolean().isOptional().check(false);
    if (forceRefresh || !this._entityKey) {
      let entityType = this.entity!.entityType;
      let keyProps = entityType.keyProperties;
      let values = keyProps.map(function (p) {
        return this.entity.getProperty(p.name);
      }, this);
      this._entityKey = new EntityKey(entityType, values);
    }
    return this._entityKey;
  };

  /**
  Returns the entity to an {{#crossLink "EntityState"}}{{/crossLink}} of 'Unchanged' by committing all changes made since the entity was last queried
  had 'acceptChanges' called on it.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.acceptChanges();
      // The 'order' entity will now be in an 'Unchanged' state with any changes committed.
  @method acceptChanges
  **/
  acceptChanges() {
    if (!this.entity) return;
    this._checkOperation("acceptChanges");
    let em = this.entityManager!;
    if (this.entityState.isDeleted()) {
      em.detachEntity(this.entity);
    } else {
      this.setUnchanged();
    }
    em.entityChanged.publish({ entityAction: EntityAction.AcceptChanges, entity: this.entity });
  };

  /**
  Returns the entity to an EntityState of 'Unchanged' by rejecting all changes made to it since the entity was last queried
  had 'rejectChanges' called on it.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.rejectChanges();
      // The 'order' entity will now be in an 'Unchanged' state with any changes rejected.
  @method rejectChanges
  **/
  rejectChanges() {
    this._checkOperation("rejectChanges");
    let entity = this.entity!;
    let entityManager = this.entityManager!;
    // we do not want PropertyChange or EntityChange events to occur here
    core.using(entityManager, "isRejectingChanges", true, function () {
      rejectChangesCore(entity);
    });
    if (this.entityState.isAdded()) {
      // next line is needed because the following line will cause this.entityManager -> null;
      entityManager.detachEntity(entity);
      // need to tell em that an entity that needed to be saved no longer does.
      entityManager._notifyStateChange(entity, false);
    } else {
      if (this.entityState.isDeleted()) {
        entityManager._linkRelatedEntities(entity);
      }
      this.setUnchanged();
      // propertyChanged propertyName is null because more than one property may have changed.
      this.propertyChanged.publish({ entity: entity, propertyName: null });
      entityManager.entityChanged.publish({ entityAction: EntityAction.RejectChanges, entity: entity });
    }
  };


  getPropertyPath(propName: string) {
    return propName;
  }


  /**
  Sets the entity to an EntityState of 'Added'.  This is NOT the equivalent of calling {{#crossLink "EntityManager/addEntity"}}{{/crossLink}}
  because no key generation will occur for autogenerated keys as a result of this operation. As a result this operation can be problematic
  unless you are certain that the entity being marked 'Added' does not already exist in the database and does not have an autogenerated key.
  The same operation can be performed by calling  {{#crossLink "EntityAspect/setEntityState"}}{{/crossLink}}.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setAdded();
      // The 'order' entity will now be in an 'Added' state.
  @method setAdded
  **/
  setAdded() {
    return this.setEntityState(EntityState.Added);
  }

  /**
  Sets the entity to an EntityState of 'Unchanged'.  This is also the equivalent of calling {{#crossLink "EntityAspect/acceptChanges"}}{{/crossLink}}.
  The same operation can be performed by calling  {{#crossLink "EntityAspect/setEntityState"}}{{/crossLink}}.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setUnchanged();
      // The 'order' entity will now be in an 'Unchanged' state with any changes committed.
  @method setUnchanged
  **/
  setUnchanged = function () {
    return this.setEntityState(EntityState.Unchanged);
  };


  /**
  Sets the entity to an EntityState of 'Modified'.  This can also be achieved by changing the value of any property on an 'Unchanged' entity.
  The same operation can be performed by calling  {{#crossLink "EntityAspect/setEntityState"}}{{/crossLink}}.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setModified();
      // The 'order' entity will now be in a 'Modified' state.
  @method setModified
  **/
  setModified = function () {
    return this.setEntityState(EntityState.Modified);
  };

  /**
  Sets the entity to an EntityState of 'Deleted'.  This both marks the entity as being scheduled for deletion during the next 'Save' call
  but also removes the entity from all of its related entities.
  The same operation can be performed by calling  {{#crossLink "EntityAspect/setEntityState"}}{{/crossLink}}.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setDeleted();
      // The 'order' entity will now be in a 'Deleted' state and it will no longer have any 'related' entities.
  @method setDeleted
  **/
  setDeleted = function () {
    return this.setEntityState(EntityState.Deleted);
  };

  /**
  Sets the entity to an EntityState of 'Detached'.  This removes the entity from all of its related entities, but does NOT change the EntityState of any existing entities.
  The same operation can be performed by calling  {{#crossLink "EntityAspect/setEntityState"}}{{/crossLink}}.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setDetached();
      // The 'order' entity will now be in a 'Detached' state and it will no longer have any 'related' entities.
  @method setDetached
  **/
  setDetached = function () {
    return this.setEntityState(EntityState.Detached);
  };

  /**
  Sets the entity to the specified EntityState. See also 'setUnchanged', 'setModified', 'setDetached', etc.
  @example
      // assume order is an order entity attached to an EntityManager.
      order.entityAspect.setEntityState(EntityState.Unchanged);
      // The 'order' entity will now be in a 'Unchanged' state.
  @method setEntityState
  **/
  setEntityState(entityState: EntityStateSymbol) {
    if (this.entityState === entityState) return false;
    this._checkOperation("setEntityState");
    if (this.entityState.isDetached()) {
      throw new Error("You cannot set the 'entityState' of an entity when it is detached - except by first attaching it to an EntityManager");
    }
    let entity = this.entity!;
    let em = this.entityManager!;
    let needsSave = true;
    if (entityState === EntityState.Unchanged) {
      clearOriginalValues(entity);
      delete this.hasTempKey;
      needsSave = false;
    } else if (entityState === EntityState.Added) {
      clearOriginalValues(entity);
      // TODO: more to do here... like regenerating key ???
    } else if (entityState === EntityState.Deleted) {
      if (this.entityState.isAdded()) {
        // turn it into a detach and exit early
        this.setEntityState(EntityState.Detached);
        return true;
      } else {
        // TODO: think about cascade deletes
        // entityState needs to be set it early in this one case to insure that fk's are not cleared.
        this.entityState = EntityState.Deleted;
        removeFromRelations(entity, EntityState.Deleted);
      }
    } else if (entityState === EntityState.Modified) {
      // nothing extra needed
    } else if (entityState === EntityState.Detached) {
      let group = this.entityGroup;
      // no group === already detached.
      if (!group) return false;
      group.detachEntity(entity);
      // needs to occur early here - so this IS deliberately redundent with the same code later in this method.
      this.entityState = entityState;
      removeFromRelations(entity, EntityState.Detached);
      this._detach();
      em.entityChanged.publish({ entityAction: EntityAction.Detach, entity: entity });
      needsSave = false;
    }
    this.entityState = entityState;
    em._notifyStateChange(entity, needsSave);
    return true;
  }



  /**
  Performs a query for the value of a specified {{#crossLink "NavigationProperty"}}{{/crossLink}}.
  @example
      emp.entityAspect.loadNavigationProperty("Orders").then(function (data) {
          var orders = data.results;
      }).fail(function (exception) {
          // handle exception here;
      });
  @method loadNavigationProperty
  @async
  @param navigationProperty {NavigationProperty|String} The NavigationProperty or the name of the NavigationProperty to 'load'.
  @param [callback] {Function} Function to call on success.
  @param [errorCallback] {Function} Function to call on failure.
  @return {Promise}
    - properties of success promise
      - results {Array of Entity}
      - query {EntityQuery} The original query
      - httpResponse {httpResponse} The HttpResponse returned from the server.
  **/
  loadNavigationProperty(navigationProperty: string, callback?: QuerySuccessCallback, errorCallback?: QueryErrorCallback): Promise<IQueryResult>
  loadNavigationProperty(navigationProperty: NavigationProperty, callback?: QuerySuccessCallback, errorCallback?: QueryErrorCallback): Promise<IQueryResult>;
  loadNavigationProperty(navigationProperty: NavigationProperty | string, callback: QuerySuccessCallback, errorCallback: QueryErrorCallback) {
    if (!this.entity || this.entity.entityAspect || this.entity.entityAspect!.entityManager) return;
    let entity = this.entity;
    let navProperty = entity.entityType._checkNavProperty(navigationProperty);
    let query = EntityQuery.fromEntityNavigation(entity, navProperty);
    // return entity.entityAspect.entityManager.executeQuery(query, callback, errorCallback);
    let promise = entity.entityAspect.entityManager!.executeQuery(query);
    let that = this;
    return promise.then(function (data) {
      that._markAsLoaded(navProperty.name);
      if (callback) callback(data);
      return Promise.resolve(data);
    }, function (error) {
      if (errorCallback) errorCallback(error);
      return Promise.reject(error);
    });

  };

  /**
  Marks this navigationProperty on this entity as already having been loaded.
  @example
      emp.entityAspect.markNavigationPropertyAsLoaded("Orders");

  @method markAsLoaded
  @async
  @param navigationProperty {NavigationProperty|String} The NavigationProperty or name of NavigationProperty to 'load'.
  **/
  markNavigationPropertyAsLoaded(navigationProperty: NavigationProperty | string) {
    if (!this.entity) return;
    let navProperty = this.entity.entityType._checkNavProperty(navigationProperty);
    this._markAsLoaded(navProperty.name);
  }

  /**
  Determines whether a navigationProperty on this entity has already been loaded.

  @example
      A navigation property is considered loaded when any of the following three conditions applies:

      1) It was fetched from the backend server.
      a) This can be the result of an expand query or a call to the EntityAspect.loadNavigationProperty method.
      b) Note that even if the fetch returns nothing the property is still marked as loaded in this case.
      2) The property is scalar and has been set to a nonnull value.
      3) The EntityAspect.markNavigationPropertyAsLoaded was called.

  @example
      var wasLoaded = emp.entityAspect.isNavigationPropertyLoaded("Orders");

  @method isNavigationPropertyLoaded
  @param navigationProperty {NavigationProperty|String} The NavigationProperty or name of NavigationProperty to 'load'.
  **/
  isNavigationPropertyLoaded(navigationProperty: string): boolean;
  isNavigationPropertyLoaded(navigationProperty: NavigationProperty): boolean;
  isNavigationPropertyLoaded(navigationProperty: NavigationProperty | string) {
    if (!this.entity) return;
    let navProperty = this.entity.entityType._checkNavProperty(navigationProperty);
    if (navProperty.isScalar && this.entity.getProperty(navProperty.name) != null) {
      return true;
    }
    return this._loadedNps && this._loadedNps.indexOf(navProperty.name) >= 0;
  }

  _markAsLoaded(navPropName: string) {
    this._loadedNps = this._loadedNps || [];
    core.arrayAddItemUnique(this._loadedNps, navPropName);
  }


  /**
  Performs validation on the entity, any errors encountered during the validation are available via the
  {{#crossLink "EntityAspect.getValidationErrors"}}{{/crossLink}} method. Validating an entity means executing
  all of the validators on both the entity itself as well as those on each of its properties.
  @example
      // assume order is an order entity attached to an EntityManager.
      var isOk = order.entityAspect.validateEntity();
      // isOk will be 'true' if there are no errors on the entity.
      if (!isOk) {
          var errors = order.entityAspect.getValidationErrors();
      }
  @method validateEntity
  @return {Boolean} Whether the entity passed validation.
  **/
  validateEntity() {
    let ok = true;
    this._processValidationOpAndPublish(function (that: any) {
      ok = validateTarget(that.entity);
    });
    return ok;
  };

  /**
  Performs validation on a specific property of this entity, any errors encountered during the validation are available via the
  {{#crossLink "EntityAspect.getValidationErrors"}}{{/crossLink}} method. Validating a property means executing
  all of the validators on the specified property.  This call is also made automatically anytime a property
  of an entity is changed.
  @example
      // assume order is an order entity attached to an EntityManager.
      var isOk = order.entityAspect.validateProperty("Order");
  or
  @example
      var orderDateProperty = order.entityType.getProperty("OrderDate");
      var isOk = order.entityAspect.validateProperty(OrderDateProperty);
  @method validateProperty
  @param property {DataProperty|NavigationProperty|String} The {{#crossLink "DataProperty"}}{{/crossLink}} or
  {{#crossLink "NavigationProperty"}}{{/crossLink}} to validate or a string with the name of the property or a property path with
  the path to a property of a complex object.
  @param [context] {Object} A context object used to pass additional information to each  {{#crossLink "Validator"}}{{/crossLink}}
  @return {Boolean} Whether the entity passed validation.
  **/
  validateProperty(property: string, context?: any): boolean;
  validateProperty(property: DataProperty, context?: any): boolean;
  validateProperty(property: NavigationProperty, context?: any): boolean;
  validateProperty(property: EntityProperty | string, context: any) {
    let value = this.getPropertyValue(property); // performs validations
    if (value && value.complexAspect) {
      return validateTarget(value);
    }
    context = context || {};
    context.entity = this.entity;
    if (typeof property === "string") {
      context.property = this.entity!.entityType.getProperty(property, true);
      context.propertyName = property;
    } else {
      context.property = property;
      context.propertyName = property.name;
    }

    return this._validateProperty(value, context);
  };

  /**
  Returns the validation errors associated with either the entire entity or any specified property.
  @example
  This method can return all of the errors for an Entity
  @example
      // assume order is an order entity attached to an EntityManager.
      var valErrors = order.entityAspect.getValidationErrors();
  as well as those for just a specific property.
  @example
      // assume order is an order entity attached to an EntityManager.
      var orderDateErrors = order.entityAspect.getValidationErrors("OrderDate");
  which can also be expressed as
  @example
      // assume order is an order entity attached to an EntityManager.
      var orderDateProperty = order.entityType.getProperty("OrderDate");
      var orderDateErrors = order.entityAspect.getValidationErrors(orderDateProperty);
  @method getValidationErrors
  @param [property] {DataProperty|NavigationProperty} The property for which validation errors should be retrieved.
  If omitted, all of the validation errors for this entity will be returned.
  @return {Array of ValidationError}
  **/
  getValidationErrors(): ValidationError[];
  getValidationErrors(property: string): ValidationError[];
  getValidationErrors(property: EntityProperty): ValidationError[];
  getValidationErrors(property?: DataProperty | NavigationProperty | string) {
    assertParam(property, "property").isOptional().isEntityProperty().or().isString().check();
    let result = core.getOwnPropertyValues(this._validationErrors);
    if (property) {
      let propertyName = typeof (property) === 'string' ? property : property.name;
      result = result.filter(function (ve: ValidationError) {
        return ve.property && (ve.property.name === propertyName || (propertyName.indexOf(".") !== -1 && ve.propertyName === propertyName));
      });
    }
    return result;
  };

  /**
  Adds a validation error.
  @method addValidationError
  @param validationError {ValidationError}
  **/
  addValidationError(validationError: ValidationError) {
    assertParam(validationError, "validationError").isInstanceOf(ValidationError).check();
    this._processValidationOpAndPublish(function (that: any) {
      that._addValidationError(validationError);
    });
  };

  /**
  Removes a validation error.
  @method removeValidationError
  @param validationErrorOrKey {ValidationError|String} Either a ValidationError or a ValidationError 'key' value
  **/
  removeValidationError(validationError: ValidationError): void;
  removeValidationError(validationKey: string): void;
  removeValidationError(validationErrorOrKey: ValidationError | string) {
    assertParam(validationErrorOrKey, "validationErrorOrKey").isString().or().isInstanceOf(ValidationError).or().isInstanceOf(Validator).check();

    let key = (typeof (validationErrorOrKey) === "string") ? validationErrorOrKey : validationErrorOrKey.key;
    this._processValidationOpAndPublish(function (that: any) {
      that._removeValidationError(key);
    });
  };

  /**
  Removes all of the validation errors for a specified entity
  @method clearValidationErrors
  **/
  clearValidationErrors() {
    this._processValidationOpAndPublish(function (that: any) {
      core.objectForEach(that._validationErrors, function (key: string, valError: ValidationError) {
        if (valError) {
          delete that._validationErrors[key];
          that._pendingValidationResult.removed.push(valError);
        }
      });
      that.hasValidationErrors = !core.isEmpty(that._validationErrors);
    });
  };


  // returns null for np's that do not have a parentKey
  getParentKey(navigationProperty: NavigationProperty) {
    if (!this.entity) return null;
    // NavigationProperty doesn't yet exist
    // assertParam(navigationProperty, "navigationProperty").isInstanceOf(NavigationProperty).check();
    let fkNames = navigationProperty.foreignKeyNames;
    if (fkNames.length === 0) return null;
    let that = this;
    let fkValues = fkNames.map(function (fkn) {
      return that.entity!.getProperty(fkn);
    });
    return new EntityKey(navigationProperty.entityType, fkValues);
  };

  getPropertyValue(property: string | DataProperty | NavigationProperty) {
    assertParam(property, "property").isString().or().isEntityProperty().check();
    let value: any;
    if (typeof (property) === 'string') {
      let propNames = property.trim().split(".");
      let propName = propNames.shift();
      value = this.entity;
      value = value.getProperty(propName);
      while (propNames.length > 0) {
        propName = propNames.shift();
        value = value.getProperty(propName);
      }
    } else {
      if (!(property.parentType instanceof EntityType)) {
        throw new Error("The validateProperty method does not accept a 'property' parameter whose parentType is a ComplexType; " +
          "Pass a 'property path' string as the 'property' parameter instead ");
      }
      value = this.entity!.getProperty(property.name);
    }
    return value;
  };

  // internal methods

  _checkOperation(operationName: string) {
    if (this.isBeingSaved) {
      throw new Error("Cannot perform a '" + operationName + "' on an entity that is in the process of being saved");
    }
    // allows chaining
    return this;
  }

  _detach() {
    this.entityGroup = undefined;
    this.entityManager = undefined;
    this.entityState = EntityState.Detached;
    this.originalValues = {};
    this._validationErrors = {};
    this.hasValidationErrors = false;
    this.validationErrorsChanged.clear();
    this.propertyChanged.clear();
  };


  // called from defaultInterceptor.
  _validateProperty(value: any, context: any) {
    let ok = true;
    this._processValidationOpAndPublish(function (that: any) {
      context.property.getAllValidators().forEach(function (validator: Validator) {
        ok = validate(that, validator, value, context) && ok;
      });
    });
    return ok;
  };

  _processValidationOpAndPublish(validationFn: any) {
    if (this._pendingValidationResult) {
      // only top level processValidations call publishes
      validationFn(this);
    } else {
      try {
        this._pendingValidationResult = { entity: this.entity, added: [], removed: [] };
        validationFn(this);
        if (this._pendingValidationResult.added.length > 0 || this._pendingValidationResult.removed.length > 0) {
          this.validationErrorsChanged.publish(this._pendingValidationResult);
          // this might be a detached entity hence the guard below.
          this.entityManager && this.entityManager.validationErrorsChanged.publish(this._pendingValidationResult);

        }
      } finally {
        this._pendingValidationResult = undefined;
      }
    }
  };

  // TODO: add/use a ValidationError type
  _addValidationError(validationError: any) {
    this._validationErrors[validationError.key] = validationError;
    this.hasValidationErrors = true;
    this._pendingValidationResult.added.push(validationError);
  };

  _removeValidationError(key: string) {
    let valError = this._validationErrors[key];
    if (valError) {
      delete this._validationErrors[key];
      this.hasValidationErrors = !core.isEmpty(this._validationErrors);
      this._pendingValidationResult.removed.push(valError);
    }
  };

}

BreezeEvent.bubbleEvent(EntityAspect.prototype, function () {
  return this.entityManager;
});

function rejectChangesCore(target: any) {
  let aspect = target.entityAspect || target.complexAspect;
  let stype = target.entityType || target.complexType;
  let originalValues = aspect.originalValues;
  for (let propName in originalValues) {
    target.setProperty(propName, originalValues[propName]);
  }
  stype.complexProperties.forEach(function (cp: any) {
    let cos = target.getProperty(cp.name);
    if (cp.isScalar) {
      rejectChangesCore(cos);
    } else {
      cos._rejectChanges();
      cos.forEach(rejectChangesCore);
    }
  });
}

function removeFromRelations(entity: IEntity, entityState: EntityStateSymbol) {
  // remove this entity from any collections.
  // mark the entity deleted or detached

  let isDeleted = entityState.isDeleted();
  if (isDeleted) {
    removeFromRelationsCore(entity);
  } else {
    core.using(entity.entityAspect.entityManager!, "isLoading", true, function () {
      removeFromRelationsCore(entity);
    });
  }
}

function removeFromRelationsCore(entity: IEntity) {
  entity.entityType.navigationProperties.forEach(function (np) {
    let inverseNp = np.inverse;
    let npValue = entity.getProperty(np.name);
    if (np.isScalar) {
      if (npValue) {
        if (inverseNp) {
          if (inverseNp.isScalar) {
            npValue.setProperty(inverseNp.name, null);
          } else {
            let collection = npValue.getProperty(inverseNp.name);
            if (collection.length) {
              core.arrayRemoveItem(collection, entity);
            }
          }
        }
        entity.setProperty(np.name, null);
      }
    } else {
      if (inverseNp != null) {
        // npValue is a live list so we need to copy it first.
        npValue.slice(0).forEach( (v: any) => {
          if (inverseNp!.isScalar) {
            v.setProperty(inverseNp!.name, null);
          } else {
            // TODO: many to many - not yet handled.
          }
        });
      }
      // now clear it.
      npValue.length = 0;
    }
  });

};

// note entityAspect only - ( no complex aspect allowed on the call).
function validate(entityAspect: EntityAspect, validator: Validator, value: any, context?: any) {
  let ve = validator.validate(value, context);
  if (ve) {
    entityAspect._addValidationError(ve);
    return false;
  } else {
    let key = ValidationError.getKey(validator, context ? context.propertyName : null);
    entityAspect._removeValidationError(key);
    return true;
  }
}

// coIndex is only used where target is a complex object that is part of an array of complex objects
// in which case ctIndex is the index of the target within the array.
function validateTarget(target: any, coIndex?: number) {
  let ok = true;
  let stype = target.entityType || target.complexType;
  let aspect = target.entityAspect || target.complexAspect;
  let entityAspect = target.entityAspect || target.complexAspect.getEntityAspect();
  let context = <any> { entity: entityAspect.entity };
  if (coIndex !== undefined) {
    context.index = coIndex;
  }

  stype.getProperties().forEach(function (p: any) {
    let value = target.getProperty(p.name);
    let validators = p.getAllValidators();
    if (validators.length > 0) {
      context.property = p;
      context.propertyName = aspect.getPropertyPath(p.name);
      ok = entityAspect._validateProperty(value, context) && ok;
    }
    if (p.isComplexProperty) {
      if (p.isScalar) {
        ok = validateTarget(value) && ok;
      } else {
        ok = value.reduce(function (pv: any, cv: any, ix: number) {
          return validateTarget(cv, ix) && pv;
        }, ok);
      }
    }
  });


  // then target level
  stype.getAllValidators().forEach(function (validator: Validator) {
    ok = validate(entityAspect, validator, target) && ok;
  });
  return ok;
}

/**
  An ComplexAspect instance is associated with every complex object instance and is accessed via the complex object's 'complexAspect' property.

  The ComplexAspect itself provides properties to determine the parent object, parent property and original values for the complex object.

  A ComplexAspect will almost never need to be constructed directly. You will usually get an ComplexAspect by accessing
  an entities 'complexAspect' property.  This property will be automatically attached when an complex object is created as part of an
  entity via either a query, import or EntityManager.createEntity call.
  @example
      // assume address is a complex property on the 'Customer' type
      var aspect = aCustomer.address.complexAspect;
      // aCustomer === aspect.parent;
  @class ComplexAspect
  **/
export class ComplexAspect {
  complexObject: IComplexObject;
  originalValues: {};
  parent?: IStructuralObject;
  parentProperty?: DataProperty;
  extraMetadata?: any;

  constructor(complexObject: IComplexObject, parent: IStructuralObject, parentProperty: DataProperty) {
    if (!complexObject) {
      throw new Error("The  ComplexAspect ctor requires an entity as its only argument.");
    }
    if (complexObject.complexAspect) {
      return complexObject.complexAspect;
    }
    // if called without new
    if (!(this instanceof ComplexAspect)) {
      return new ComplexAspect(complexObject, parent, parentProperty);
    }

    // entityType should already be on the entity from 'watch'
    this.complexObject = complexObject;
    complexObject.complexAspect = this;

    // TODO: keep public or not?
    this.originalValues = {};

    // if a standalone complexObject
    if (parent != null) {
      this.parent = parent;
      this.parentProperty = parentProperty;
    }

    let complexType = complexObject.complexType;
    if (!complexType) {
      let typeName = complexObject.prototype._$typeName;
      if (!typeName) {
        throw new Error("This entity is not registered as a valid ComplexType");
      } else {
        throw new Error("Metadata for this complexType has not yet been resolved: " + typeName);
      }
    }
    let complexCtor = complexType.getCtor();
    config.interfaceRegistry.modelLibrary.getDefaultInstance().startTracking(complexObject, complexCtor.prototype);

  };



  /**
  The complex object that this aspect is associated with.

  __readOnly__
  @property complexObject {Entity}
  **/

  /**
  The parent object that to which this aspect belongs; this will either be an entity or another complex object.

  __readOnly__
  @property parent {Entity|IComplexObject}
  **/

  /**
  The {{#crossLink "DataProperty"}}{{/crossLink}} on the 'parent' that contains this complex object.

  __readOnly__
  @property parentProperty {DataProperty}
  **/

  /**
  The 'original values' of this complex object where they are different from the 'current values'.
  This is a map where the key is a property name and the value is the 'original value' of the property.

  __readOnly__
  @property originalValues {Object}
  **/

  /**
  Returns the EntityAspect for the top level entity tht contains this complex object.

  @method getEntityAspect
  @return  {String}
  **/
  getEntityAspect() {
    let parent = <any>this.parent;
    if (!parent) return new EntityAspect();
    let entityAspect = parent.entityAspect;
    while (parent && !entityAspect) {
      parent = parent.complexAspect && parent.complexAspect.parent;
      entityAspect = parent && parent.entityAspect;
    }
    return entityAspect || new EntityAspect();
  }

  /**
  Executes the specified query against this EntityManager's local cache.

  @method getPropertyPath
  @param propName {String}  The property name of a property on this complex aspect for which we want the full path.
  @return  {String}    The 'property path' from the top level entity that contains this complex object to this object.
  **/
  getPropertyPath(propName: string) {
    let parent = <any>this.parent;
    if (!parent) return null;
    let aspect = parent.complexAspect || parent.entityAspect;
    return aspect.getPropertyPath(this.parentProperty!.name + "." + propName);
  }

}

function clearOriginalValues(target: any) {
  let aspect = target.entityAspect || target.complexAspect;
  aspect.originalValues = {};
  let stype = target.entityType || target.complexType;
  stype.complexProperties.forEach(function (cp: any) {
    let cos = target.getProperty(cp.name);
    if (cp.isScalar) {
      clearOriginalValues(cos);
    } else {
      cos._acceptChanges();
      cos.forEach(clearOriginalValues);
    }
  });
}


breeze.EntityAspect = EntityAspect;
breeze.ComplexAspect = ComplexAspect;
