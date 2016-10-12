import {  EntityQuery, EntityManager, EntityKey, NamingConvention, LocalQueryComparisonOptions, DataService } from '../typings/breeze1x'; // TODO: replace later

import { breeze, core, ErrorCallback } from './core-fns';
import { config, modelLibraryDef } from './config';
import { BreezeEvent } from './event';
import { assertParam, assertConfig, Param } from './assert-param';
import { EntityState, EntityStateSymbol } from './entity-state';
import { EntityAction } from './entity-action';
import { EntityAspect } from './entity-aspect';
import { Validator, ValidationError } from './validate';
import { Enum, EnumSymbol, TypedEnum } from './enum';


// Get the promises library called Q
// define a quick failing version if not found.
let Q = core.requireLib("Q;q");


if (!Q) {
  // No Q.js! Substitute a placeholder Q which always fails
  // Should be replaced by the app via breeze.config.setQ
  // For example, see Breeze Labs "breeze.angular"
  Q = function () {
    let eMsg = 'Q is undefined. Are you missing Q.js? See https://github.com/kriskowal/q';
    throw new Error(eMsg);
  };

  // all Q methods called by Breeze should fail
  Q.defer = Q.resolve = Q.reject = Q;
}

/**
 (Re)set Q with a promises implementation suitable for Breeze internal use.  Note: This API is likely to change.
 @method setQ
 @param q {Object} - a  "thenable" promises implementation like Q.js with the API that Breeze requires internally.
 @param [q.defer] {Function} A function returning a deferred.
 @param [q.resolve] {Function} A function returning a resolved promise.
 @param [q.reject] {Function} A function returning a rejected promise.
 **/
breeze.config.setQ = function (q: any) {
  breeze.Q = Q = q;
};
breeze.Q = Q; // Todo: consider a "safer" way for apps to get breeze's Q. 

export interface MetadataStoreConfig {
  namingConvention?: NamingConvention;
  localQueryComparisonOptions?: LocalQueryComparisonOptions;
  serializerFn?: () => {};
}
/**
An instance of the MetadataStore contains all of the metadata about a collection of {{#crossLink "EntityType"}}{{/crossLink}}'s.
MetadataStores may be shared across {{#crossLink "EntityManager"}}{{/crossLink}}'s.  If an EntityManager is created without an
explicit MetadataStore, the MetadataStore from the MetadataStore.defaultInstance property will be used.
@class MetadataStore
**/
export class MetadataStore {
  _$typeName = "MetadataStore";

  static __id = 0;
  static ANONTYPE_PREFIX = "_IB_";

  name: string;
  dataServices: DataService[];
  namingConvention: NamingConvention;
  localQueryComparisonOptions: LocalQueryComparisonOptions;
  serializerFn?: () => {};
  metadataFetched: BreezeEvent;

  _resourceEntityTypeMap: {};
  _entityTypeResourceMap: {};
  _structuralTypeMap: {}; // key is qualified structuraltype name - value is structuralType. ( structural = entityType or complexType).
  _shortNameMap: {}; // key is shortName, value is qualified name - does not need to be serialized.
  _ctorRegistry: {}; // key is either short or qual type name - value is ctor;
  _incompleteTypeMap: {}; // key is entityTypeName; value is array of nav props
  _incompleteComplexTypeMap: {}; //
  _deferredTypes: {};
  _id: number;

  /**
  Constructs a new MetadataStore.
  @example
      let ms = new MetadataStore();
  The store can then be associated with an EntityManager
  @example
      let entityManager = new EntityManager( {
          serviceName: "breeze/NorthwindIBModel", 
          metadataStore: ms 
      });
  or for an existing EntityManager
  @example
      // Assume em1 is an existing EntityManager
      em1.setProperties( { metadataStore: ms });
  @method <ctor> MetadataStore
  @param [config] {Object} Configuration settings .
  @param [config.namingConvention=NamingConvention.defaultInstance] {NamingConvention} NamingConvention to be used in mapping property names
  between client and server. Uses the NamingConvention.defaultInstance if not specified.
  @param [config.localQueryComparisonOptions=LocalQueryComparisonOptions.defaultInstance] {LocalQueryComparisonOptions} The LocalQueryComparisonOptions to be
  used when performing "local queries" in order to match the semantics of queries against a remote service.
  @param [config.serializerFn] A function that is used to mediate the serialization of instances of this type.
  **/
  constructor(config?: MetadataStoreConfig) {
    config = config || {};
    assertConfig(config)
      .whereParam("namingConvention").isOptional().isInstanceOf(NamingConvention).withDefault(NamingConvention.defaultInstance)
      .whereParam("localQueryComparisonOptions").isOptional().isInstanceOf(LocalQueryComparisonOptions).withDefault(LocalQueryComparisonOptions.defaultInstance)
      .whereParam("serializerFn").isOptional().isFunction()
      .applyAll(this);
    this.dataServices = []; // array of dataServices;
    this._resourceEntityTypeMap = {}; // key is resource name - value is qualified entityType name
    this._structuralTypeMap = {}; // key is qualified structuraltype name - value is structuralType. ( structural = entityType or complexType).
    this._shortNameMap = {}; // key is shortName, value is qualified name - does not need to be serialized.
    this._ctorRegistry = {}; // key is either short or qual type name - value is ctor;

    this._incompleteTypeMap = {}; // key is entityTypeName; value is array of nav props
    this._incompleteComplexTypeMap = {}; // key is complexTypeName; value is array of complexType props
    this._id = MetadataStore.__id++;
    this.metadataFetched = new BreezeEvent("metadataFetched", this);

  };

  // BreezeEvent.bubbleEvent(MetadataStore.prototype, null);


  // needs to be made avail to breeze.dataService.xxx files
  static normalizeTypeName = core.memoize(function (rawTypeName: string) {
    return rawTypeName && parseTypeName(rawTypeName)!.typeName;
  });
  // for debugging use the line below instead.
  //ctor.normalizeTypeName = function (rawTypeName) { return parseTypeName(rawTypeName).typeName; };

  /**
  An {{#crossLink "Event"}}{{/crossLink}} that fires after a MetadataStore has completed fetching metadata from a remote service.

  @example
      let ms = myEntityManager.metadataStore;
      ms.metadataFetched.subscribe(function(args) {
              let metadataStore = args.metadataStore;
              let dataService = args.dataService;
          });
      });

  @event metadataFetched
  @param metadataStore {MetadataStore} The MetadataStore into which the metadata was fetched.
  @param dataService {DataService} The DataService that metadata was fetched from.
  @param rawMetadata {Object} The raw metadata returned from the service. (It will have already been processed by this point).
  @readOnly
  **/

  /**
  General purpose property set method
  @example
      // assume em1 is an EntityManager containing a number of existing entities.

      em1.metadataStore.setProperties( {
          version: "6.1.3",
          serializerFn: function(prop, value) {
          return (prop.isUnmapped) ? undefined : value;
          }
      )};
  @method setProperties
  @param config [object]
  @param [config.name] {String} A name for the collection of metadata in this store.
  @param [config.serializerFn] A function that is used to mediate the serialization of instances of this type.
  **/
  setProperties(config: MetadataStoreConfig) {
    assertConfig(config)
      .whereParam("name").isString().isOptional()
      .whereParam("serializerFn").isFunction().isOptional()
      .applyAll(this);
  };

  /**
  Adds a DataService to this MetadataStore. If a DataService with the same serviceName is already
  in the MetadataStore an exception will be thrown.
  @method addDataService
  @param dataService {DataService} The DataService to add
  @param [shouldOverwrite=false] {Boolean} Permit overwrite of existing DataService rather than throw exception
  **/
  addDataService(dataService: DataService, shouldOverwrite: boolean) {
    assertParam(dataService, "dataService").isInstanceOf(DataService).check();
    assertParam(shouldOverwrite, "shouldOverwrite").isBoolean().isOptional().check();
    let ix = this._getDataServiceIndex(dataService.serviceName);
    if (ix >= 0) {
      if (!!shouldOverwrite) {
        this.dataServices[ix] = dataService;
      } else {
        throw new Error("A dataService with this name '" + dataService.serviceName + "' already exists in this MetadataStore");
      }
    } else {
      this.dataServices.push(dataService);
    }
  };

  _getDataServiceIndex(serviceName: string) {
    return core.arrayIndexOf(this.dataServices, function (ds) {
      return ds.serviceName === serviceName;
    });
  };

  /**
  Adds an EntityType to this MetadataStore.  No additional properties may be added to the EntityType after its has
  been added to the MetadataStore.
  @method addEntityType
  @param structuralType {EntityType|ComplexType} The EntityType or ComplexType to add
  **/
  addEntityType(stype: EntityType | ComplexType | EntityTypeConfig | ComplexTypeConfig) {
    let structuralType: EntityType | ComplexType;
    if (!(stype instanceof EntityType || stype instanceof ComplexType)) {
      structuralType = (stype as any).isComplexType ? new ComplexType(stype) : new EntityType(stype);
    } else {
      structuralType = stype;
    }
    // if (!structuralType.isComplexType) { // same as below but isn't a 'type guard'
    if (isEntityType(structuralType)) {
      if (structuralType.baseTypeName && !structuralType.baseEntityType) {
        let baseEntityType = this._getEntityType(structuralType.baseTypeName, true);
        structuralType._updateFromBase(baseEntityType);
      }
      if (structuralType.keyProperties.length === 0 && !structuralType.isAbstract) {
        throw new Error("Unable to add " + structuralType.name +
          " to this MetadataStore.  An EntityType must have at least one property designated as a key property - See the 'DataProperty.isPartOfKey' property.");
      }
    }

    structuralType.metadataStore = this;
    // don't register anon types
    if (!(structuralType as any).isAnonymous) {
      if (this._structuralTypeMap[structuralType.name]) {
        throw new Error("Type " + structuralType.name + " already exists in this MetadataStore.");
      }

      this._structuralTypeMap[structuralType.name] = structuralType;
      this._shortNameMap[structuralType.shortName] = structuralType.name;
    }

    structuralType.getProperties().forEach( (p: IStructuralProperty) => {
      structuralType._updateNames(p);
      if (!p.isUnmapped) {
        structuralType._mappedPropertiesCount++;
      }
    });

    structuralType._updateCps();

    if (isEntityType(structuralType)) {
      structuralType._updateNps();
      // give the type it's base's resource name if it doesn't have its own.
      let defResourceName = structuralType.defaultResourceName || (structuralType.baseEntityType && structuralType.baseEntityType.defaultResourceName);
      if (defResourceName && !this.getEntityTypeNameForResourceName(defResourceName)) {
        this.setEntityTypeForResourceName(defResourceName, structuralType.name);
      }
      structuralType.defaultResourceName = defResourceName;
      // check if this structural type's name, short version or qualified version has a registered ctor.
      structuralType.getEntityCtor();
    }

  };

  /**
  The  {{#crossLink "NamingConvention"}}{{/crossLink}} associated with this MetadataStore.

  __readOnly__
  @property namingConvention {NamingConvention}
  **/

  /**
  Exports this MetadataStore to a serialized string appropriate for local storage.   This operation is also called
  internally when exporting an EntityManager.
  @example
      // assume ms is a previously created MetadataStore
      let metadataAsString = ms.exportMetadata();
      window.localStorage.setItem("metadata", metadataAsString);
      // and later, usually in a different session imported
      let metadataFromStorage = window.localStorage.getItem("metadata");
      let newMetadataStore = new MetadataStore();
      newMetadataStore.importMetadata(metadataFromStorage);
  @method exportMetadata
  @return {String} A serialized version of this MetadataStore that may be stored locally and later restored.
  **/
  exportMetadata() {
    let result = JSON.stringify({
      "metadataVersion": breeze.metadataVersion,
      "name": this.name,
      "namingConvention": this.namingConvention.name,
      "localQueryComparisonOptions": this.localQueryComparisonOptions.name,
      "dataServices": this.dataServices,
      "structuralTypes": core.objectMap(this._structuralTypeMap),
      "resourceEntityTypeMap": this._resourceEntityTypeMap
    }, null, config.stringifyPad);
    return result;
  };

  /**
  Imports a previously exported serialized MetadataStore into this MetadataStore.
  @example
      // assume ms is a previously created MetadataStore
      let metadataAsString = ms.exportMetadata();
      window.localStorage.setItem("metadata", metadataAsString);
      // and later, usually in a different session
      let metadataFromStorage = window.localStorage.getItem("metadata");
      let newMetadataStore = new MetadataStore();
      newMetadataStore.importMetadata(metadataFromStorage);
  @method importMetadata
  @param exportedMetadata {String|JSON Object} A previously exported MetadataStore.
  @param [allowMerge] {Boolean} Allows custom metadata to be merged into existing metadata types.
  @return {MetadataStore} This MetadataStore.
  @chainable
  **/
  importMetadata(exportedMetadata: string | Object, allowMerge: boolean = false) {
    assertParam(allowMerge, "allowMerge").isOptional().isBoolean().check();
    this._deferredTypes = {};
    let json = (typeof (exportedMetadata) === "string") ? JSON.parse(exportedMetadata) : exportedMetadata;

    if (json.schema) {
      return CsdlMetadataParser.parse(this, json.schema, json.altMetadata);
    }

    if (json.metadataVersion && json.metadataVersion !== breeze.metadataVersion) {
      let msg = core.formatString("Cannot import metadata with a different 'metadataVersion' (%1) than the current 'breeze.metadataVersion' (%2) ",
        json.metadataVersion, breeze.metadataVersion);
      throw new Error(msg);
    }

    let ncName = json.namingConvention;
    let lqcoName = json.localQueryComparisonOptions;
    if (this.isEmpty()) {
      this.namingConvention = config._fetchObject(NamingConvention, ncName) || this.namingConvention;
      this.localQueryComparisonOptions = config._fetchObject(LocalQueryComparisonOptions, lqcoName) || this.localQueryComparisonOptions;
    } else {
      if (ncName && this.namingConvention.name !== ncName) {
        throw new Error("Cannot import metadata with a different 'namingConvention' from the current MetadataStore");
      }
      if (lqcoName && this.localQueryComparisonOptions.name !== lqcoName) {
        throw new Error("Cannot import metadata with different 'localQueryComparisonOptions' from the current MetadataStore");
      }
    }

    let that = this;

    //noinspection JSHint
    json.dataServices && json.dataServices.forEach(function (ds: Object) {
      let realDs = DataService.fromJSON(ds);
      that.addDataService(realDs, true);
    });
    let structuralTypeMap = this._structuralTypeMap;

    json.structuralTypes && json.structuralTypes.forEach(function (stype: any) {
      structuralTypeFromJson(that, stype, allowMerge);
    });
    core.extend(this._resourceEntityTypeMap, json.resourceEntityTypeMap);
    core.extend(this._incompleteTypeMap, json.incompleteTypeMap);

    return this;
  };

  /**
  Creates a new MetadataStore from a previously exported serialized MetadataStore
  @example
      // assume ms is a previously created MetadataStore
      let metadataAsString = ms.exportMetadata();
      window.localStorage.setItem("metadata", metadataAsString);
      // and later, usually in a different session
      let metadataFromStorage = window.localStorage.getItem("metadata");
      let newMetadataStore = MetadataStore.importMetadata(metadataFromStorage);
  @method importMetadata
  @static
  @param exportedString {String} A previously exported MetadataStore.
  @return {MetadataStore} A new MetadataStore.

  **/
  static importMetadata(exportedString: string) {
    let ms = new MetadataStore();
    ms.importMetadata(exportedString);
    return ms;
  };

  /**
  Returns whether Metadata has been retrieved for a specified service name.
  @example
      // Assume em1 is an existing EntityManager.
      if (!em1.metadataStore.hasMetadataFor("breeze/NorthwindIBModel"))) {
          // do something interesting
      }
  @method hasMetadataFor
  @param serviceName {String} The service name.
  @return {Boolean}
  **/
  hasMetadataFor(serviceName: string) {
    return !!this.getDataService(serviceName);
  };

  /**
  Returns the DataService for a specified service name
  @example
      // Assume em1 is an existing EntityManager.
      let ds = em1.metadataStore.getDataService("breeze/NorthwindIBModel");
      let adapterName = ds.adapterName; // may be null

  @method getDataService
  @param serviceName {String} The service name.
  @return {DataService}
  **/
  getDataService(serviceName: string) {
    assertParam(serviceName, "serviceName").isString().check();

    serviceName = DataService._normalizeServiceName(serviceName);
    return core.arrayFirst(this.dataServices, function (ds: DataService) {
      return ds.serviceName === serviceName;
    });
  };

  /**
  Fetches the metadata for a specified 'service'. This method is automatically called
  internally by an EntityManager before its first query against a new service.

  @example
  Usually you will not actually process the results of a fetchMetadata call directly, but will instead
  ask for the metadata from the EntityManager after the fetchMetadata call returns.
  @example
      let ms = new MetadataStore();
      // or more commonly
      // let ms = anEntityManager.metadataStore;
      ms.fetchMetadata("breeze/NorthwindIBModel").then(function(rawMetadata) {
            // do something with the metadata
      }).fail(function(exception) {
          // handle exception here
      });
  @method fetchMetadata
  @async
  @param dataService {DataService|String}  Either a DataService or just the name of the DataService to fetch metadata for.

  @param [callback] {Function} Function called on success.

  successFunction([data])
  @param [callback.data] {rawMetadata}

  @param [errorCallback] {Function} Function called on failure.

  failureFunction([error])
  @param [errorCallback.error] {Error} Any error that occured wrapped into an Error object.

  @return {Promise} Promise
  **/
  fetchMetadata(dataService: DataService, callback?: (schema: any) => void, errorCallback?: ErrorCallback) {
    try {
      assertParam(dataService, "dataService").isString().or().isInstanceOf(DataService).check();
      assertParam(callback, "callback").isFunction().isOptional().check();
      assertParam(errorCallback, "errorCallback").isFunction().isOptional().check();

      if (typeof dataService === "string") {
        // use the dataService with a matching name or create a new one.
        dataService = this.getDataService(dataService) || new DataService({ serviceName: dataService });
      }

      dataService = DataService.resolve([dataService]);


      if (this.hasMetadataFor(dataService.serviceName)) {
        throw new Error("Metadata for a specific serviceName may only be fetched once per MetadataStore. ServiceName: " + dataService.serviceName);
      }
      let that = this;
      return dataService.adapterInstance.fetchMetadata(this, dataService).then(function (rawMetadata) {
        that.metadataFetched.publish({ metadataStore: that, dataService: dataService, rawMetadata: rawMetadata });
        if (callback) callback(rawMetadata);
        return Q.resolve(rawMetadata);
      }, function (error) {
        if (errorCallback) errorCallback(error);
        return Q.reject(error);
      });
    } catch (e) {
      return Q.reject(e);
    }
  };


  /**
  Used to register a constructor for an EntityType that is not known via standard Metadata discovery;
  i.e. an unmapped type.

  @method trackUnmappedType
  @param entityCtor {Function} The constructor for the 'unmapped' type.
  @param [interceptor] {Function} A function
  **/
  trackUnmappedType = function (entityCtor: any, interceptor: any) {
    assertParam(entityCtor, "entityCtor").isFunction().check();
    assertParam(interceptor, "interceptor").isFunction().isOptional().check();
    // TODO: think about adding this to the MetadataStore.
    let entityType = new EntityType(this);
    entityType._setCtor(entityCtor, interceptor);
  };

  /**
  Provides a mechanism to register a 'custom' constructor to be used when creating new instances
  of the specified entity type.  If this call is not made, a default constructor is created for
  the entity as needed.
  This call may be made before or after the corresponding EntityType has been discovered via
  Metadata discovery.
  @example
      let Customer = function () {
              this.miscData = "asdf";
          };
      Customer.prototype.doFoo() {
              ...
          }
      // assume em1 is a preexisting EntityManager;
      em1.metadataStore.registerEntityTypeCtor("Customer", Customer);
      // any queries or EntityType.create calls from this point on will call the Customer constructor
      // registered above.
  @method registerEntityTypeCtor
  @param structuralTypeName {String} The name of the EntityType or ComplexType.
  @param aCtor {Function}  The constructor for this EntityType or ComplexType; may be null if all you want to do is set the next parameter.
  @param [initFn] {Function} A function or the name of a function on the entity that is to be executed immediately after the entity has been created
  and populated with any initial values.
  initFn(entity)
  @param initFn.entity {Entity} The entity being created or materialized.
  @param [noTrackingFn] {Function} A function that is executed immediately after a noTracking entity has been created and whose return
  value will be used in place of the noTracking entity.
  @param noTrackingFn.entity {Object}
  @param noTrackingFn.entityType {EntityType} The entityType that the 'entity' parameter would be if we were tracking
  **/
  registerEntityTypeCtor(structuralTypeName: string, aCtor: any, initFn: Function, noTrackingFn: Function) {
    assertParam(structuralTypeName, "structuralTypeName").isString().check();
    assertParam(aCtor, "aCtor").isFunction().isOptional().check();
    assertParam(initFn, "initFn").isOptional().isFunction().or().isString().check();
    assertParam(noTrackingFn, "noTrackingFn").isOptional().isFunction().check();

    let qualifiedTypeName = getQualifiedTypeName(this, structuralTypeName, false);
    let typeName = qualifiedTypeName || structuralTypeName;

    if (aCtor) {
      if (aCtor._$typeName && aCtor._$typeName !== typeName) {
        console.warn("Registering a constructor for " + typeName + " that is already used for " + aCtor._$typeName + ".");
      }
      aCtor._$typeName = typeName;
    }

    this._ctorRegistry[typeName] = { ctor: aCtor, initFn: initFn, noTrackingFn: noTrackingFn };
    if (qualifiedTypeName) {
      let stype = this._structuralTypeMap[qualifiedTypeName];
      stype && stype.getCtor(true); // this will complete the registration if avail now.
    }

  };

  /**
  Returns whether this MetadataStore contains any metadata yet.
  @example
      // assume em1 is a preexisting EntityManager;
      if (em1.metadataStore.isEmpty()) {
          // do something interesting
      }
  @method isEmpty
  @return {Boolean}
  **/
  isEmpty() {
    return core.isEmpty(this._structuralTypeMap);
  };

  /**
  Returns an  {{#crossLink "EntityType"}}{{/crossLink}} or a {{#crossLink "ComplexType"}}{{/crossLink}} given its name.
  @example
      // assume em1 is a preexisting EntityManager
      let odType = em1.metadataStore.getEntityType("OrderDetail");
  or to throw an error if the type is not found
  @example
      let badType = em1.metadataStore.getEntityType("Foo", false);
      // badType will not get set and an exception will be thrown.
  @method getEntityType
  @param structuralTypeName {String}  Either the fully qualified name or a short name may be used. If a short name is specified and multiple types share
  that same short name an exception will be thrown.
  @param [okIfNotFound=false] {Boolean} Whether to throw an error if the specified EntityType is not found.
  @return {EntityType|ComplexType} The EntityType. ComplexType or 'undefined' if not not found.
  **/
  getEntityType(structuralTypeName: string, okIfNotFound: boolean = false) {
    assertParam(structuralTypeName, "structuralTypeName").isString().check();
    assertParam(okIfNotFound, "okIfNotFound").isBoolean().isOptional().check(false);
    return this._getEntityType(structuralTypeName, okIfNotFound);
  };

  _getEntityType(typeName: string, okIfNotFound: boolean = false) {
    let qualTypeName = getQualifiedTypeName(this, typeName, false);
    let type = this._structuralTypeMap[qualTypeName];
    if (!type) {
      if (okIfNotFound) return null;
      let msg = core.formatString("Unable to locate a 'Type' by the name: '%1'. Be sure to execute a query or call fetchMetadata first.", typeName);
      throw new Error(msg);
    }
    if (type.length) {
      let typeNames = type.join(",");
      throw new Error("There are multiple types with this 'shortName': " + typeNames);
    }
    return type;
  };

  /**
  Returns an array containing all of the  {{#crossLink "EntityType"}}{{/crossLink}}s or {{#crossLink "ComplexType"}}{{/crossLink}}s in this MetadataStore.
  @example
      // assume em1 is a preexisting EntityManager
      let allTypes = em1.metadataStore.getEntityTypes();
  @method getEntityTypes
  @return {Array of EntityType|ComplexType}
  **/
  getEntityTypes() {
    return getTypesFromMap(this._structuralTypeMap);
  };

  getIncompleteNavigationProperties() {
    return core.objectMap(this._incompleteTypeMap, function (key, value) {
      return value;
    });
  };

  /**
  Returns a fully qualified entityTypeName for a specified resource name.  The reverse of this operation
  can be obtained via the  {{#crossLink "EntityType"}}{{/crossLink}} 'defaultResourceName' property
  @method getEntityTypeNameForResourceName
  @param resourceName {String}
  **/
  getEntityTypeNameForResourceName(resourceName: string) {
    assertParam(resourceName, "resourceName").isString().check();
    return this._resourceEntityTypeMap[resourceName];
  };

  /**
  Associates a resourceName with an entityType.

  This method is only needed in those cases where multiple resources return the same
  entityType.  In this case Metadata discovery will only determine a single resource name for
  each entityType.
  @method setEntityTypeForResourceName
  @param resourceName {String}
  @param entityTypeOrName {EntityType|String} If passing a string either the fully qualified name or a short name may be used. If a short name is specified and multiple types share
  that same short name an exception will be thrown. If the entityType has not yet been discovered then a fully qualified name must be used.
  **/
  setEntityTypeForResourceName(resourceName: string, entityTypeOrName: EntityType | string) {
    assertParam(resourceName, "resourceName").isString().check();
    assertParam(entityTypeOrName, "entityTypeOrName").isInstanceOf(EntityType).or().isString().check();

    let entityTypeName: string;
    if (entityTypeOrName instanceof EntityType) {
      entityTypeName = entityTypeOrName.name;
    } else {
      entityTypeName = getQualifiedTypeName(this, entityTypeOrName, true);
    }

    this._resourceEntityTypeMap[resourceName] = entityTypeName;
    let entityType = this._getEntityType(entityTypeName, true);
    if (entityType && !entityType.defaultResourceName) {
      entityType.defaultResourceName = resourceName;
    }
  };


  // protected methods

  _checkEntityType(entity: Entity) {
    if (entity.entityType) return;
    let typeName = entity.prototype._$typeName;
    if (!typeName) {
      throw new Error("This entity has not been registered. See the MetadataStore.registerEntityTypeCtor method");
    }
    let entityType = this._getEntityType(typeName);
    if (entityType) {
      entity.entityType = entityType;
    }
  };


}

BreezeEvent.bubbleEvent(MetadataStore.prototype, null);

function getTypesFromMap(typeMap: Object) {
  let types: any[] = [];
  for (let key in typeMap) {
    let value = typeMap[key];
    // skip 'shortName' entries
    if (key === value.name) {
      types.push(typeMap[key]);
    }
  }
  return types;
}

function structuralTypeFromJson(metadataStore: MetadataStore, json: any, allowMerge: boolean) {
  let typeName = qualifyTypeName(json.shortName, json.namespace);
  let stype = metadataStore._getEntityType(typeName, true);
  if (stype) {
    if (allowMerge) {
      return mergeStructuralType(stype, json);
    } else {
      // allow it but don't replace anything.
      return stype;
    }
  }
  let config = {
    shortName: json.shortName,
    namespace: json.namespace,
    isAbstract: json.isAbstract,
    autoGeneratedKeyType: AutoGeneratedKeyType.fromName(json.autoGeneratedKeyType),
    defaultResourceName: json.defaultResourceName,
    custom: json.custom
  };

  stype = json.isComplexType ? new ComplexType(config) : new EntityType(config);

  // baseType may not have been imported yet so we need to defer handling this type until later.
  if (json.baseTypeName) {
    stype.baseTypeName = json.baseTypeName;
    let baseEntityType = metadataStore._getEntityType(json.baseTypeName, true);
    if (baseEntityType) {
      completeStructuralTypeFromJson(metadataStore, json, stype, baseEntityType);
    } else {
      core.getArray(metadataStore._deferredTypes, json.baseTypeName).push({ json: json, stype: stype });

    }
  } else {
    completeStructuralTypeFromJson(metadataStore, json, stype);
  }

  // stype may or may not have been added to the metadataStore at this point.
  return stype;
}

function mergeStructuralType(stype: IStructuralType, json: any) {
  if (json.custom) {
    stype.custom = json.custom;
  }

  mergeProps(stype, json.dataProperties);
  mergeProps(stype, json.navigationProperties);
  return stype;
}

function mergeProps(stype: IStructuralType, jsonProps: any[]) {
  if (!jsonProps) return;
  jsonProps.forEach(function (jsonProp) {
    let propName = jsonProp.name;
    if (!propName) {
      if (jsonProp.nameOnServer) {
        propName = stype.metadataStore.namingConvention.serverPropertyNameToClient(jsonProp.nameOnServer, {});
      } else {
        throw new Error("Unable to complete 'importMetadata' - cannot locate a 'name' or 'nameOnServer' for one of the imported property nodes");
      }
    }
    if (jsonProp.custom) {
      let prop = stype.getProperty(propName, true);
      prop.custom = jsonProp.custom;
    }
  });
}

function completeStructuralTypeFromJson(metadataStore: MetadataStore, json: any, stype: any) {

  // validators from baseType work because validation walks thru base types
  // so no need to copy down.
  if (json.validators) {
    stype.validators = json.validators.map(Validator.fromJSON);
  }


  json.dataProperties.forEach(function (dp: Object) {
    stype._addPropertyCore(DataProperty.fromJSON(dp));
  });


  let isEntityType = !json.isComplexType;
  if (isEntityType) {
    //noinspection JSHint
    json.navigationProperties && json.navigationProperties.forEach(function (np: Object) {
      stype._addPropertyCore(NavigationProperty.fromJSON(np));
    });
  }

  metadataStore.addEntityType(stype);

  let deferredTypes = metadataStore._deferredTypes;
  let deferrals = deferredTypes[stype.name];
  if (deferrals) {
    deferrals.forEach(function (d: any) {
      completeStructuralTypeFromJson(metadataStore, d.json, d.stype);
    });
    delete deferredTypes[stype.name];
  }
}

function getQualifiedTypeName(metadataStore: MetadataStore, structTypeName: string, throwIfNotFound?: boolean) {
  if (isQualifiedTypeName(structTypeName)) return structTypeName;
  let result = metadataStore._shortNameMap[structTypeName];
  if (!result && throwIfNotFound) {
    throw new Error("Unable to locate 'entityTypeName' of: " + structTypeName);
  }
  return result;
}

interface IStructuralType {
  metadataStore: MetadataStore;
  isComplexType: boolean;
  complexProperties: DataProperty[];
  dataProperties: DataProperty[];
  name: string;
  namespace: string;
  shortName: string;
  unmappedProperties: DataProperty[];
  validators: Validator[];
  custom?: Object;
  getProperty(propName: string, throwIfNotFound?: boolean): IStructuralProperty;
}

interface IStructuralProperty {
    name: string;
    nameOnServer: string;
    displayName: string;
    parentType: IStructuralType;
    validators: Validator[];
    isDataProperty: boolean;
    isNavigationProperty: boolean;
    isUnmapped: boolean;
    custom?: Object;
}

export interface EntityTypeConfig {
  shortName?: string;
  namespace?: string;
  baseTypeName?: string;
  isAbstract?: boolean;
  autoGeneratedKeyType?: AutoGeneratedKeyTypeSymbol;
  defaultResourceName?: string;
  dataProperties?: DataProperty[];
  navigationProperties?: NavigationProperty[];
  serializerFn?: any;
  custom?: Object;
}

export interface EntityTypeSetConfig {
  autoGeneratedKeyType?: AutoGeneratedKeyTypeSymbol;
  defaultResourceName?: string;
  serializerFn?: any;
  custom?: Object;
}

/**
  Container for all of the metadata about a specific type of Entity.
  @class EntityType
  **/
class EntityType implements IStructuralType {
  _$typeName = "EntityType";
  isComplexType = false;

  static __nextAnonIx = 0;

  metadataStore: MetadataStore;

  complexProperties: DataProperty[];
  dataProperties: DataProperty[];
  name: string;
  shortName: string;
  namespace: string;
  baseTypeName: string;
  isAbstract: boolean;
  autoGeneratedKeyType: AutoGeneratedKeyTypeSymbol;
  defaultResourceName: string;

  serializerFn?: any;
  custom?: Object;
  unmappedProperties: DataProperty[];
  validators: Validator[];

  navigationProperties: NavigationProperty[];
  keyProperties: DataProperty[];
  foreignKeyProperties: DataProperty[];
  inverseForeignKeyProperties: DataProperty[];
  concurrencyProperties: DataProperty[];

  warnings: any[];
  _mappedPropertiesCount: number;
  subtypes: EntityType[];
  baseEntityType: EntityType;

  isAnonymous: boolean;
  isFrozen: boolean;
  _extra: any;
  _ctor: Function;
  initFn: Function;
  noTrackingFn: Function;

  parseRawValue = DataType.parseRawValue;
  getEntityCtor = this.getCtor;

  static qualifyTypeName = qualifyTypeName;

  /**
  @example
      let entityType = new EntityType( {
          shortName: "person",
          namespace: "myAppNamespace"
      });
  @method <ctor> EntityType
  @param config {Object|MetadataStore} Configuration settings or a MetadataStore.  If this parameter is just a MetadataStore
  then what will be created is an 'anonymous' type that will never be communicated to or from the server. It is purely for
  client side use and will be given an automatically generated name. Normally, however, you will use a configuration object.
  @param config.shortName {String}
  @param [config.namespace=""] {String}
  @param [config.baseTypeName] {String}
  @param [config.isAbstract=false] {Boolean}
  @param [config.autoGeneratedKeyType] {AutoGeneratedKeyType}
  @param [config.defaultResourceName] {String}
  @param [config.dataProperties] {Array of DataProperties}
  @param [config.navigationProperties] {Array of NavigationProperties}
  @param [config.serializerFn] A function that is used to mediate the serialization of instances of this type.
  @param [config.custom] {Object}
  **/
  constructor(config: MetadataStore | EntityTypeConfig) {
    if (arguments.length > 1) {
      throw new Error("The EntityType ctor has a single argument that is either a 'MetadataStore' or a configuration object.");
    }
    let etConfig: EntityTypeConfig | null;
    if ((config as any)._$typeName === "MetadataStore") {
      this.metadataStore = config as MetadataStore;
      this.shortName = "Anon_" + (++EntityType.__nextAnonIx);
      this.namespace = "";
      this.isAnonymous = true;
      etConfig = null;
    } else {
      etConfig = config as EntityTypeConfig;
      assertConfig(config)
        .whereParam("shortName").isNonEmptyString()
        .whereParam("namespace").isString().isOptional().withDefault("")
        .whereParam("baseTypeName").isString().isOptional()
        .whereParam("isAbstract").isBoolean().isOptional().withDefault(false)
        .whereParam("autoGeneratedKeyType").isEnumOf(AutoGeneratedKeyType).isOptional().withDefault(AutoGeneratedKeyType.None)
        .whereParam("defaultResourceName").isNonEmptyString().isOptional().withDefault(null)
        .whereParam("dataProperties").isOptional()
        .whereParam("navigationProperties").isOptional()
        .whereParam("serializerFn").isOptional().isFunction()
        .whereParam("custom").isOptional()
        .applyAll(this);
    }

    this.name = qualifyTypeName(this.shortName, this.namespace);

    // the defaultResourceName may also be set up either via metadata lookup or first query or via the 'setProperties' method
    this.dataProperties = [];
    this.navigationProperties = [];
    this.complexProperties = [];
    this.keyProperties = [];
    this.foreignKeyProperties = [];
    this.inverseForeignKeyProperties = [];
    this.concurrencyProperties = [];
    this.unmappedProperties = []; // will be updated later.
    this.validators = [];
    this.warnings = [];
    this._mappedPropertiesCount = 0;
    this.subtypes = [];
    // now process any data/nav props
    if (etConfig) {
      addProperties(this, etConfig.dataProperties, DataProperty);
      addProperties(this, etConfig.navigationProperties, NavigationProperty);
    }
  };


  /**
  The {{#crossLink "MetadataStore"}}{{/crossLink}} that contains this EntityType

  __readOnly__
  @property metadataStore {MetadataStore}
  **/

  /**
  The DataProperties (see {{#crossLink "DataProperty"}}{{/crossLink}}) associated with this EntityType.

  __readOnly__
  @property dataProperties {Array of DataProperty}
  **/

  /**
  The NavigationProperties  (see {{#crossLink "NavigationProperty"}}{{/crossLink}}) associated with this EntityType.

  __readOnly__
  @property navigationProperties {Array of NavigationProperty}
  **/

  /**
  The DataProperties for this EntityType that contain instances of a ComplexType (see {{#crossLink "ComplexType"}}{{/crossLink}}).

  __readOnly__
  @property complexProperties {Array of DataProperty}
  **/

  /**
  The DataProperties associated with this EntityType that make up it's {{#crossLink "EntityKey"}}{{/crossLink}}.

  __readOnly__
  @property keyProperties {Array of DataProperty}
  **/

  /**
  The DataProperties associated with this EntityType that are foreign key properties.

  __readOnly__
  @property foreignKeyProperties {Array of DataProperty}
  **/

  /**
  The DataProperties associated with this EntityType that are concurrency properties.

  __readOnly__
  @property concurrencyProperties {Array of DataProperty}
  **/

  /**
  The DataProperties associated with this EntityType that are not mapped to any backend datastore. These are effectively free standing
  properties.

  __readOnly__
  @property unmappedProperties {Array of DataProperty}
  **/

  /**
  The default resource name associated with this EntityType.  An EntityType may be queried via a variety of 'resource names' but this one
  is used as the default when no resource name is provided.  This will occur when calling {{#crossLink "EntityAspect/loadNavigationProperty"}}{{/crossLink}}
  or when executing any {{#crossLink "EntityQuery"}}{{/crossLink}} that was created via an {{#crossLink "EntityKey"}}{{/crossLink}}.

  __readOnly__
  @property defaultResourceName {String}
  **/

  /**
  The fully qualified name of this EntityType.

  __readOnly__
  @property name {String}
  **/

  /**
  The short, unqualified, name for this EntityType.

  __readOnly__
  @property shortName {String}
  **/

  /**
  The namespace for this EntityType.

  __readOnly__
  @property namespace {String}
  **/

  /**
  The base EntityType (if any) for this EntityType.

  __readOnly__
  @property baseEntityType {EntityType}
  **/

  /**
  Whether this EntityType is abstract.

  __readOnly__
  @property isAbstract {boolean}
  **/

  /**
  The {{#crossLink "AutoGeneratedKeyType"}}{{/crossLink}} for this EntityType.

  __readOnly__
  @property autoGeneratedKeyType {AutoGeneratedKeyType}
  @default AutoGeneratedKeyType.None
  **/

  /**
  The entity level validators associated with this EntityType. Validators can be added and
  removed from this collection.

  __readOnly__
  @property validators {Array of Validator}
  **/

  /**
  A free form object that can be used to define any custom metadata for this EntityType.

  __readOnly__
  @property custom {Object}
  **/

  /**
  General purpose property set method
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      custType.setProperties( {
          autoGeneratedKeyType: AutoGeneratedKeyType.Identity;
          defaultResourceName: "CustomersAndIncludedOrders"
      )};
  @method setProperties
  @param config [object]
  @param [config.autogeneratedKeyType] {AutoGeneratedKeyType}
  @param [config.defaultResourceName] {String}
  @param [config.serializerFn] A function that is used to mediate the serialization of instances of this type.
  @param [config.custom] {Object}
  **/
  setProperties(config: EntityTypeSetConfig) {
    assertConfig(config)
      .whereParam("autoGeneratedKeyType").isEnumOf(AutoGeneratedKeyType).isOptional()
      .whereParam("defaultResourceName").isString().isOptional()
      .whereParam("serializerFn").isFunction().isOptional()
      .whereParam("custom").isOptional()
      .applyAll(this);
    if (config.defaultResourceName) {
      this.defaultResourceName = config.defaultResourceName;
    }
  };

  /**
  Returns whether this type is a subtype of a specified type.

  @method isSubtypeOf
  @param entityType [EntityType]
  **/
  isSubtypeOf(entityType: EntityType) {
    assertParam(entityType, "entityType").isInstanceOf(EntityType).check();
    let baseType = this;
    do {
      if (baseType === entityType) return true;
      baseType = baseType.baseEntityType;
    } while (baseType);
    return false;
  };

  /**
  Returns an array containing this type and any/all subtypes of this type down thru the hierarchy.

  @method getSelfAndSubtypes
  **/
  getSelfAndSubtypes() {
    let result = [this];
    this.subtypes.forEach(function (st) {
      let subtypes = st.getSelfAndSubtypes();
      result.push.apply(result, subtypes);
    });
    return result;
  };

  getAllValidators() {
    let result = this.validators.slice(0);
    let bt = this.baseEntityType;
    while (bt) {
      result.push.apply(result, bt.validators);
      bt = bt.baseEntityType;
    }
    return result;
  }

  /**
  Adds a  {{#crossLink "DataProperty"}}{{/crossLink}} or a {{#crossLink "NavigationProperty"}}{{/crossLink}} to this EntityType.
  @example
      // assume myEntityType is a newly constructed EntityType.
      myEntityType.addProperty(dataProperty1);
      myEntityType.addProperty(dataProperty2);
      myEntityType.addProperty(navigationProperty1);
  @method addProperty
  @param property {DataProperty|NavigationProperty}
  **/
  addProperty(property: DataProperty | NavigationProperty) {
    assertParam(property, "property").isInstanceOf(DataProperty).or().isInstanceOf(NavigationProperty).check();

    // true is 2nd arg to force resolve of any navigation properties.
    let newprop = this._addPropertyCore(property, true);

    if (this.subtypes && this.subtypes.length) {
      let stype = this;
      stype.getSelfAndSubtypes().forEach(function (st) {
        if (st !== stype) {
          if (property.isNavigationProperty) {
            st._addPropertyCore(new NavigationProperty(property), true);
          } else {
            st._addPropertyCore(new DataProperty(property), true);
          }
        }
      });
    }
    return newprop;
  };

  _updateFromBase(baseEntityType: EntityType) {
    this.baseEntityType = baseEntityType;
    if (this.autoGeneratedKeyType === AutoGeneratedKeyType.None) {
      this.autoGeneratedKeyType = baseEntityType.autoGeneratedKeyType;
    }

    baseEntityType.dataProperties.forEach(function (dp) {
      let newDp = new DataProperty(dp);
      // don't need to copy validators becaue we will walk the hierarchy to find them
      newDp.validators = [];
      newDp.baseProperty = dp;
      this._addPropertyCore(newDp);
    }, this);
    baseEntityType.navigationProperties.forEach(function (np) {
      let newNp = new NavigationProperty(np);
      // don't need to copy validators becaue we will walk the hierarchy to find them
      newNp.validators = [];
      newNp.baseProperty = np;
      this._addPropertyCore(newNp);
    }, this);
    baseEntityType.subtypes.push(this);
  }

  _addPropertyCore(property: IStructuralProperty, shouldResolve: boolean = false) {
    if (this.isFrozen) {
      throw new Error("The '" + this.name + "' EntityType/ComplexType has been frozen. You can only add properties to an EntityType/ComplexType before any instances of that type have been created and attached to an entityManager.");
    }
    let parentType = property.parentType;
    if (parentType) {
      if (parentType !== this) {
        throw new Error("This property: " + property.name + " has already been added to " + property.parentType.name);
      } else {
        // adding the same property more than once to the same entityType is just ignored.
        return this;
      }
    }
    property.parentType = this;
    let ms = this.metadataStore;
    if (property.isDataProperty) {
      this._addDataProperty(property as DataProperty);
    } else {
      this._addNavigationProperty(property as NavigationProperty);
      // metadataStore can be undefined if this entityType has not yet been added to a MetadataStore.
      if (shouldResolve && ms) {
        tryResolveNp(property, ms);
      }
    }
    // unmapped properties can be added AFTER entityType has already resolved all property names.
    if (ms && !(property.name && property.nameOnServer)) {
      updateClientServerNames(ms.namingConvention, property, "name");
    }
    // props can be added after entity prototype has already been wrapped.
    if (ms && this._extra) {
      if (this._extra.alreadyWrappedProps) {
        let proto = this._ctor.prototype;
        modelLibraryDef.getDefaultInstance().initializeEntityPrototype(proto);
      }
    }
    return this;
  };

  /**
  Create a new entity of this type.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let cust1 = custType.createEntity();
      em1.addEntity(cust1);
  @method createEntity
  @param [initialValues] {Config object} - Configuration object of the properties to set immediately after creation.
  @return {Entity} The new entity.
  **/
  createEntity(initialValues: any) {
    // ignore the _$eref once the entity is attached to an entityManager.
    if (initialValues && initialValues._$eref && !initialValues._$eref.entityAspect.entityManager) return initialValues._$eref;

    let instance = this._createInstanceCore();

    if (initialValues) {
      // only assign an _eref if the object is fully "keyed"
      if (this.keyProperties.every(function (kp) {
        return initialValues[kp.name] != null;
      })) {
        initialValues._$eref = instance;
      }
      ;

      this._updateTargetFromRaw(instance, initialValues, getRawValueFromConfig);

      this.navigationProperties.forEach(function (np) {
        let relatedEntity;
        let val = initialValues[np.name];
        if (val != undefined) {
          let navEntityType = np.entityType;
          if (np.isScalar) {
            relatedEntity = val.entityAspect ? val : navEntityType.createEntity(val);
            instance.setProperty(np.name, relatedEntity);
          } else {
            let relatedEntities = instance.getProperty(np.name);
            val.forEach(function (v) {
              relatedEntity = v.entityAspect ? v : navEntityType.createEntity(v);
              relatedEntities.push(relatedEntity);
            });
          }
        }
      });
    }

    this._initializeInstance(instance);
    return instance;
  };

  _createInstanceCore() {
    let aCtor = this.getEntityCtor();
    let instance = new aCtor();
    new EntityAspect(instance);
    return instance;
  };

  _initializeInstance(instance: any) {
    if (this.baseEntityType) {
      this.baseEntityType._initializeInstance(instance);
    }
    let initFn = this.initFn;
    if (initFn) {
      if (typeof initFn === "string") {
        initFn = instance[initFn];
      }
      initFn(instance);
    }
    this.complexProperties && this.complexProperties.forEach(function (cp) {
      let ctInstance = instance.getProperty(cp.name);
      if (Array.isArray(ctInstance)) {
        ctInstance.forEach(function (ctInst) {
          cp.dataType._initializeInstance(ctInst);
        });
      } else {
        cp.dataType._initializeInstance(ctInstance);
      }
    });
    // not needed for complexObjects
    if (instance.entityAspect) {
      instance.entityAspect._initialized = true;
    }
  };



  /**
  Returns the constructor for this EntityType.
  @method getCtor ( or obsolete getEntityCtor)
  @return {Function} The constructor for this EntityType.
  **/
  getCtor(forceRefresh: boolean = false) {
    if (this._ctor && !forceRefresh) return this._ctor;

    let ctorRegistry = this.metadataStore._ctorRegistry;
    let r = ctorRegistry[this.name] || ctorRegistry[this.shortName] || {};
    let aCtor = r.ctor || this._ctor;

    let ctorType = aCtor && aCtor.prototype && (aCtor.prototype.entityType || aCtor.prototype.complexType);
    if (ctorType && ctorType.metadataStore !== this.metadataStore) {
      // We can't risk a mismatch between the ctor and the type info in a specific metadatastore
      // because modelLibraries rely on type info to intercept ctor properties
      throw new Error("Cannot register the same constructor for " + this.name + " in different metadata stores.  Please define a separate constructor for each metadata store.");
    }


    if (r.ctor && forceRefresh) {
      this._extra = undefined;
    }

    if (!aCtor) {
      let createCtor = modelLibraryDef.getDefaultInstance().createCtor;
      aCtor = createCtor ? createCtor(this) : createEmptyCtor(this);
    }

    this.initFn = r.initFn;
    this.noTrackingFn = r.noTrackingFn;

    aCtor.prototype._$typeName = this.name;
    this._setCtor(aCtor);
    return aCtor;
  };



  // May make public later.
  _setCtor(aCtor: FunctionConstructor, interceptor?: any) {

    let instanceProto = aCtor.prototype;

    // place for extra breeze related data
    this._extra = this._extra || {};

    let instance = new aCtor();
    calcUnmappedProperties(this, instance);

    if (this._$typeName === "EntityType") {
      // insure that all of the properties are on the 'template' instance before watching the class.
      instanceProto.entityType = this;
    } else {
      instanceProto.complexType = this;
    }

    // defaultPropertyInterceptor is a 'global' (but internal to breeze) function;
    (instanceProto as any)._$interceptor = interceptor || defaultPropertyInterceptor;
    modelLibraryDef.getDefaultInstance().initializeEntityPrototype(instanceProto);
    this._ctor = aCtor;
  };

  /**
  Adds either an entity or property level validator to this EntityType.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let countryProp = custType.getProperty("Country");
      let valFn = function (v) {
              if (v == null) return true;
              return (core.stringStartsWith(v, "US"));
          };
      let countryValidator = new Validator("countryIsUS", valFn,
      { displayName: "Country", messageTemplate: "'%displayName%' must start with 'US'" });
      custType.addValidator(countryValidator, countryProp);
  This is the same as adding an entity level validator via the 'validators' property of DataProperty or NavigationProperty
  @example
      countryProp.validators.push(countryValidator);
  Entity level validators can also be added by omitting the 'property' parameter.
  @example
      custType.addValidator(someEntityLevelValidator);
  or
  @example
      custType.validators.push(someEntityLevelValidator);
  @method addValidator
  @param validator {Validator} Validator to add.
  @param [property] Property to add this validator to.  If omitted, the validator is assumed to be an
  entity level validator and is added to the EntityType's 'validators'.
  **/
  addValidator = function (validator: Validator, property?: DataProperty | NavigationProperty) {
    assertParam(validator, "validator").isInstanceOf(Validator).check();
    assertParam(property, "property").isOptional().isString().or().isEntityProperty().check();
    if (property != null) {
      if (typeof property === 'string') {
        property = this.getProperty(property, true);
      }
      property.validators.push(validator);
    } else {
      this.validators.push(validator);
    }
  };

  /**
  Returns all of the properties ( dataProperties and navigationProperties) for this EntityType.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let arrayOfProps = custType.getProperties();
  @method getProperties
  @return {Array of DataProperty|NavigationProperty} Array of Data and Navigation properties.
  **/
  getProperties(): IStructuralProperty[] {
    return (this.dataProperties as IStructuralProperty[]).concat(this.navigationProperties);
  };

  /**
  Returns all of the property names ( for both dataProperties and navigationProperties) for this EntityType.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let arrayOfPropNames = custType.getPropertyNames();
  @method getPropertyNames
  @return {Array of String}
  **/
  getPropertyNames() {
    return this.getProperties().map(core.pluck('name'));
  };

  /**
  Returns a data property with the specified name or null.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let customerNameDataProp = custType.getDataProperty("CustomerName");
  @method getDataProperty
  @param propertyName {String}
  @return {DataProperty} Will be null if not found.
  **/
  getDataProperty(propertyName: string) {
    return core.arrayFirst(this.dataProperties, core.propEq('name', propertyName));
  };

  /**
  Returns a navigation property with the specified name or null.
  @example
      // assume em1 is an EntityManager containing a number of existing entities.
      let custType = em1.metadataStore.getEntityType("Customer");
      let customerOrdersNavProp = custType.getDataProperty("Orders");
  @method getNavigationProperty
  @param propertyName {String}
  @return {NavigationProperty} Will be null if not found.
  **/
  getNavigationProperty(propertyName: string) {
    return core.arrayFirst(this.navigationProperties, core.propEq('name', propertyName));
  };

  /**
  Returns either a DataProperty or a NavigationProperty with the specified name or null.
  
  This method also accepts a '.' delimited property path and will return the 'property' at the
  end of the path.
  @example
      let custType = em1.metadataStore.getEntityType("Customer");
      let companyNameProp = custType.getProperty("CompanyName");
  This method can also walk a property path to return a property
  @example
      let orderDetailType = em1.metadataStore.getEntityType("OrderDetail");
      let companyNameProp2 = orderDetailType.getProperty("Order.Customer.CompanyName");
      // companyNameProp === companyNameProp2
  @method getProperty
  @param propertyPath {String}
  @param [throwIfNotFound=false] {Boolean} Whether to throw an exception if not found.
  @return {DataProperty|NavigationProperty} Will be null if not found.
  **/
  getProperty(propertyPath: string, throwIfNotFound: boolean = false) {
    let props = this.getPropertiesOnPath(propertyPath, false, throwIfNotFound);
    return (props && props.length > 0) ? props[props.length - 1] : null;
  };

  // TODO: have this return empty array instead of null and fix consumers.
  getPropertiesOnPath(propertyPath: string, useServerName: boolean, throwIfNotFound: boolean = false) {
    let propertyNames = (Array.isArray(propertyPath)) ? propertyPath : propertyPath.trim().split('.');

    let ok = true;
    let parentType = this;
    let key = useServerName ? "nameOnServer" : "name";
    let props = propertyNames.map(function (propName) {
      let prop = core.arrayFirst(parentType.getProperties(), core.propEq(key, propName));
      if (prop) {
        parentType = prop.isNavigationProperty ? prop.entityType : prop.dataType;
      } else if (throwIfNotFound) {
        throw new Error("unable to locate property: " + propName + " on entityType: " + parentType.name);
      } else {
        ok = false;
      }
      return prop;
    });
    return ok ? props : null;
  }

  clientPropertyPathToServer(propertyPath: string, delimiter: string = '.') {
    let propNames: string[];
    if (this.isAnonymous) {
      let fn = this.metadataStore.namingConvention.clientPropertyNameToServer;
      propNames = propertyPath.split(".").map(function (propName) {
        return fn(propName);
      });
    } else {
      let props = this.getPropertiesOnPath(propertyPath, false, true);
      propNames = props!.map((prop) => prop.nameOnServer);
    }
    return propNames.join(delimiter);
  }

  getEntityKeyFromRawEntity = function (rawEntity: any, rawValueFn: Function) {
    let keyValues = this.keyProperties.map(function (dp) {
      let val = rawValueFn(rawEntity, dp);
      return parseRawValue(val, dp.dataType);
    });
    return new EntityKey(this, keyValues);
  };

  _updateTargetFromRaw(target: any, raw: any, rawValueFn: Function) {
    // called recursively for complex properties
    this.dataProperties.forEach(function (dp) {
      if (!dp.isSettable) return;
      let rawVal = rawValueFn(raw, dp);
      if (rawVal === undefined) return;
      let dataType = dp.dataType; // this will be a complexType when dp is a complexProperty
      let oldVal: any;
      if (dp.isComplexProperty) {
        if (rawVal === null) return; // rawVal may be null in nosql dbs where it was never defined for the given row.
        oldVal = target.getProperty(dp.name);
        if (dp.isScalar) {
          dataType._updateTargetFromRaw(oldVal, rawVal, rawValueFn);
        } else {
          if (Array.isArray(rawVal)) {
            let newVal = rawVal.map(function (rawCo) {
              let newCo = dataType._createInstanceCore(target, dp);
              dataType._updateTargetFromRaw(newCo, rawCo, rawValueFn);
              dataType._initializeInstance(newCo);
              return newCo;
            });
            if (!core.arrayEquals(oldVal, newVal, coEquals)) {
              // clear the old array and push new objects into it.
              oldVal.length = 0;
              newVal.forEach(function (nv) {
                oldVal.push(nv);
              });
            }
          } else {
            oldVal.length = 0;
          }
        }
      } else {
        let val: any;
        if (dp.isScalar) {
          let newVal = parseRawValue(rawVal, dataType);
          target.setProperty(dp.name, newVal);
        } else {
          oldVal = target.getProperty(dp.name);
          if (Array.isArray(rawVal)) {
            // need to compare values
            let newVal = rawVal.map(function (rv) {
              return parseRawValue(rv, dataType);
            });
            if (!core.arrayEquals(oldVal, newVal)) {
              // clear the old array and push new objects into it.
              oldVal.length = 0;
              newVal.forEach(function (nv) {
                oldVal.push(nv);
              });
            }
          } else {
            oldVal.length = 0;
          }

        }
      }
    });

    // if merging from an import then raw will have an entityAspect or a complexAspect
    let rawAspect = raw.entityAspect || raw.complexAspect;
    if (rawAspect) {
      let targetAspect = target.entityAspect || target.complexAspect;
      if (rawAspect.originalValuesMap) {
        targetAspect.originalValues = rawAspect.originalValuesMap;
      }
      if (rawAspect.extraMetadata) {
        targetAspect.extraMetadata = rawAspect.extraMetadata;
      }
    }
  }



  /**
  Returns a string representation of this EntityType.
  @method toString
  @return {String}
  **/
  toString() {
    return this.name;
  };

  toJSON() {
    return core.toJson(this, {
      shortName: null,
      namespace: null,
      baseTypeName: null,
      isAbstract: false,
      autoGeneratedKeyType: null, // do not suppress default value
      defaultResourceName: null,
      dataProperties: localPropsOnly,
      navigationProperties: localPropsOnly,
      validators: null,
      custom: null
    });
  };

  _updateNames(property: IStructuralProperty) {
    let nc = this.metadataStore.namingConvention;
    updateClientServerNames(nc, property, "name");

    if (property.isNavigationProperty) {
      updateClientServerNames(nc, property, "foreignKeyNames");
      updateClientServerNames(nc, property, "invForeignKeyNames");

      // these will get set later via _updateNps
      // this.inverse
      // this.entityType
      // this.relatedDataProperties
      //    dataProperty.relatedNavigationProperty
      //    dataProperty.inverseNavigationProperty
    }
  };




  _checkNavProperty(navigationProperty: NavigationProperty) {
    if (navigationProperty.isNavigationProperty) {
      if (navigationProperty.parentType !== this) {
        throw new Error(core.formatString("The navigationProperty '%1' is not a property of entity type '%2'",
          navigationProperty.name, this.name));
      }
      return navigationProperty;
    }

    if (typeof (navigationProperty) === 'string') {
      let np = this.getProperty(navigationProperty);
      if (np && np.isNavigationProperty) return np;
    }
    throw new Error("The 'navigationProperty' parameter must either be a NavigationProperty or the name of a NavigationProperty");
  };

  _addDataProperty(dp: DataProperty) {

    this.dataProperties.push(dp);

    if (dp.isPartOfKey) {
      this.keyProperties.push(dp);
    }

    if (dp.isComplexProperty) {
      this.complexProperties.push(dp);
    }

    if (dp.concurrencyMode && dp.concurrencyMode !== "None") {
      this.concurrencyProperties.push(dp);
    }

    if (dp.isUnmapped) {
      this.unmappedProperties.push(dp);
    }

  };

  _addNavigationProperty(np: NavigationProperty) {

    this.navigationProperties.push(np);

    if (!isQualifiedTypeName(np.entityTypeName)) {
      np.entityTypeName = qualifyTypeName(np.entityTypeName, this.namespace);
    }
  };

  _updateCps() {
    let metadataStore = this.metadataStore;
    let incompleteTypeMap = metadataStore._incompleteComplexTypeMap;
    this.complexProperties.forEach(function (cp) {
      if (cp.complexType) return;
      if (!resolveCp(cp, metadataStore)) {
        core.getArray(incompleteTypeMap, cp.complexTypeName).push(cp);
      }
    });

    if (this.isComplexType) {
      (incompleteTypeMap[this.name] || []).forEach(function (cp) {
        resolveCp(cp, metadataStore);
      });
      delete incompleteTypeMap[this.name];
    }
  };



  _updateNps() {
    let metadataStore = this.metadataStore;

    // resolve all navProps for this entityType
    this.navigationProperties.forEach(function (np) {
      tryResolveNp(np, metadataStore);
    });
    let incompleteTypeMap = metadataStore._incompleteTypeMap;
    // next resolve all navProp that point to this entityType.
    (incompleteTypeMap[this.name] || []).forEach(function (np) {
      tryResolveNp(np, metadataStore);
    });
    // every navProp that pointed to this type should now be resolved
    delete incompleteTypeMap[this.name];
  };


}

function getRawValueFromConfig(rawEntity: any, dp: DataProperty) {
  // 'true' fork can happen if an initializer contains an actaul instance of an already created complex object.
  return (rawEntity.entityAspect || rawEntity.complexAspect) ? rawEntity.getProperty(dp.name) : rawEntity[dp.name];
}

function updateClientServerNames(nc, parent, clientPropName) {
  let serverPropName = clientPropName + "OnServer";
  let clientName = parent[clientPropName];
  if (clientName && clientName.length) {
    // if (parent.isUnmapped) return;
    let serverNames = __toArray(clientName).map(function (cName) {
      let sName = nc.clientPropertyNameToServer(cName, parent);
      let testName = nc.serverPropertyNameToClient(sName, parent);
      if (cName !== testName) {
        throw new Error("NamingConvention for this client property name does not roundtrip properly:" + cName + "-->" + testName);
      }
      return sName;
    });
    parent[serverPropName] = Array.isArray(clientName) ? serverNames : serverNames[0];
  } else {
    let serverName = parent[serverPropName];
    if ((!serverName) || serverName.length === 0) return;
    let clientNames = __toArray(serverName).map(function (sName) {
      let cName = nc.serverPropertyNameToClient(sName, parent);
      let testName = nc.clientPropertyNameToServer(cName, parent);
      if (sName !== testName) {
        throw new Error("NamingConvention for this server property name does not roundtrip properly:" + sName + "-->" + testName);
      }
      return cName;
    });
    parent[clientPropName] = Array.isArray(serverName) ? clientNames : clientNames[0];
  }
}

function createEmptyCtor(type) {
  let name = type.name.replace(/\W/g, '_');
  return Function('return function ' + name + '(){}')();
}

function coEquals(co1, co2) {
  let dataProps = co1.complexAspect.parentProperty.dataType.dataProperties;
  let areEqual = dataProps.every(function (dp) {
    if (!dp.isSettable) return true;
    let v1 = co1.getProperty(dp.name);
    let v2 = co2.getProperty(dp.name);
    if (dp.isComplexProperty) {
      return coEquals(v1, v2);
    } else {
      let dataType = dp.dataType; // this will be a complexType when dp is a complexProperty
      return (v1 === v2 || (dataType && dataType.normalize && v1 && v2 && dataType.normalize(v1) === dataType.normalize(v2)));
    }
  });
  return areEqual;
}

function localPropsOnly(props) {
  return props.filter(function (prop) {
    return prop.baseProperty == null;
  });
}


function resolveCp(cp, metadataStore) {
  let complexType = metadataStore._getEntityType(cp.complexTypeName, true);
  if (!complexType) return false;
  if (!(complexType instanceof ComplexType)) {
    throw new Error("Unable to resolve ComplexType with the name: " + cp.complexTypeName + " for the property: " + property.name);
  }
  cp.dataType = complexType;
  cp.defaultValue = null;
  return true;
}

function tryResolveNp(np, metadataStore) {
  if (np.entityType) return true;

  let entityType = metadataStore._getEntityType(np.entityTypeName, true);
  if (entityType) {
    np.entityType = entityType;
    np._resolveNp();
    // don't bother removing - _updateNps will do it later.
    // __arrayRemoveItem(incompleteNps, np, false);
  } else {
    let incompleteNps = __getArray(metadataStore._incompleteTypeMap, np.entityTypeName);
    __arrayAddItemUnique(incompleteNps, np);
  }
  return !!entityType;
}

function calcUnmappedProperties(stype, instance) {
  let metadataPropNames = stype.getPropertyNames();
  let modelLib = __modelLibraryDef.getDefaultInstance();
  let trackablePropNames = modelLib.getTrackablePropertyNames(instance);
  trackablePropNames.forEach(function (pn) {
    if (metadataPropNames.indexOf(pn) === -1) {
      let val = instance[pn];
      try {
        if (typeof val == "function") val = val();
      } catch (e) {
      }
      let dt = DataType.fromValue(val);
      let newProp = new DataProperty({
        name: pn,
        dataType: dt,
        isNullable: true,
        isUnmapped: true
      });
      newProp.isSettable = __isSettable(instance, pn);
      if (stype.subtypes && stype.subtypes.length) {
        stype.getSelfAndSubtypes().forEach(function (st) {
          st._addPropertyCore(new DataProperty(newProp));
        });
      } else {
        stype._addPropertyCore(newProp);
      }
    }
  });
}

interface ComplexTypeConfig {
  shortName?: string;
  namespace?: string;
  dataProperties?: DataProperty[];
  isComplexType?: boolean;  // needed because this ctor can get called from the addEntityType method which needs the isComplexType prop
  custom?: Object;
}

/**
  Container for all of the metadata about a specific type of Complex object.
  @class ComplexType
  **/

/**
@example
    let complexType = new ComplexType( {
        shortName: "address",
        namespace: "myAppNamespace"
    });
@method <ctor> ComplexType
@param config {Object} Configuration settings
@param config.shortName {String}
@param [config.namespace=""] {String}
@param [config.dataProperties] {Array of DataProperties}
@param [config.custom] {Object}
**/
class ComplexType implements IStructuralType {
  _$typeName = "ComplexType";
  isComplexType = true;

  metadataStore: MetadataStore;
  name: string;
  shortName: string;
  namespace: string;
  dataProperties: DataProperty[];
  complexProperties: DataProperty[];
  validators: Validator[];
  concurrencyProperties: DataProperty[];
  unmappedProperties: DataProperty[];
  _mappedPropertiesCount: number;
  // navigationProperties: DataProperty[]; // not yet supported
  // keyProperties: DataPoperty[] // may be used later to enforce uniqueness on arrays of complextypes.

  // copy entityType methods onto complexType
  getCtor = EntityType.prototype.getCtor;
  addValidator = EntityType.prototype.addValidator;
  getProperty = EntityType.prototype.getProperty;
  getPropertiesOnPath = EntityType.prototype.getPropertiesOnPath;
  getPropertyNames = EntityType.prototype.getPropertyNames;
  _addPropertyCore = EntityType.prototype._addPropertyCore;
  _addDataProperty = EntityType.prototype._addDataProperty;
  _updateNames = EntityType.prototype._updateNames;
  _updateCps = EntityType.prototype._updateCps;
  _initializeInstance = EntityType.prototype._initializeInstance;
  _updateTargetFromRaw = EntityType.prototype._updateTargetFromRaw;
  _setCtor = EntityType.prototype._setCtor;
  // note the name change.
  createInstance = EntityType.prototype.createEntity;  // name change


  constructor(config: ComplexTypeConfig) {
    if (arguments.length > 1) {
      throw new Error("The ComplexType ctor has a single argument that is a configuration object.");
    }

    assertConfig(config)
      .whereParam("shortName").isNonEmptyString()
      .whereParam("namespace").isString().isOptional().withDefault("")
      .whereParam("dataProperties").isOptional()
      .whereParam("isComplexType").isOptional().isBoolean()   // needed because this ctor can get called from the addEntityType method which needs the isComplexType prop
      .whereParam("custom").isOptional()
      .applyAll(this);

    this.name = qualifyTypeName(this.shortName, this.namespace);
    this.isComplexType = true;
    this.dataProperties = [];
    this.complexProperties = [];
    this.validators = [];
    this.concurrencyProperties = [];
    this.unmappedProperties = [];
    this._mappedPropertiesCount = 0;
    // this.navigationProperties = []; // not yet supported
    // this.keyProperties = []; // may be used later to enforce uniqueness on arrays of complextypes.
    if (config.dataProperties) {
      addProperties(this, config.dataProperties, DataProperty);
    }
  };

  /**
  The DataProperties (see {{#crossLink "DataProperty"}}{{/crossLink}}) associated with this ComplexType.

  __readOnly__
  @property dataProperties {Array of DataProperty}
  **/

  /**
  The DataProperties for this ComplexType that contain instances of a ComplexType (see {{#crossLink "ComplexType"}}{{/crossLink}}).

  __readOnly__
  @property complexProperties {Array of DataProperty}
  **/

  /**
  The DataProperties associated with this ComplexType that are not mapped to any backend datastore. These are effectively free standing
  properties.

  __readOnly__
  @property unmappedProperties {Array of DataProperty}
  **/

  /**
  The fully qualifed name of this ComplexType.

  __readOnly__
  @property name {String}
  **/

  /**
  The short, unqualified, name for this ComplexType.

  __readOnly__
  @property shortName {String}
  **/

  /**
  The namespace for this ComplexType.

  __readOnly__
  @property namespace {String}
  **/

  /**
  The entity level validators associated with this ComplexType. Validators can be added and
  removed from this collection.

  __readOnly__
  @property validators {Array of Validator}
  **/

  /**
  A free form object that can be used to define any custom metadata for this ComplexType.

  __readOnly__
  @property custom {Object}
  **/

  /**
  General purpose property set method
  @example
      // assume em1 is an EntityManager
      let addresstType = em1.metadataStore.getEntityType("Address");
      addressType.setProperties( {
          custom: { foo: 7, bar: "test" }
      });
  @method setProperties
  @param config [object]
  @param [config.custom] {Object}
  **/
  setProperties(config: { custom: Object }) {
    assertConfig(config)
      .whereParam("custom").isOptional()
      .applyAll(this);
  };

  getAllValidators() {
    // ComplexType inheritance is not YET supported.
    return this.validators;
  }

  /**
  Creates a new non-attached instance of this ComplexType.
  @method createInstance
  @param initialValues {Object} Configuration object containing initial values for the instance.
  **/
  // This method is actually the EntityType.createEntity method renamed 
  _createInstanceCore(parent, parentProperty) {
    let aCtor = this.getCtor();
    let instance = new aCtor();
    new ComplexAspect(instance, parent, parentProperty);
    // initialization occurs during either attach or in createInstance call.
    return instance;
  };


  addProperty(dataProperty: DataProperty) {
    assertParam(dataProperty, "dataProperty").isInstanceOf(DataProperty).check();
    return this._addPropertyCore(dataProperty);
  };

  getProperties() {
    return this.dataProperties;
  };

  /**
  See  {{#crossLink "EntityType.addValidator"}}{{/crossLink}}
  @method addValidator
  @param validator {Validator} Validator to add.
  @param [property] Property to add this validator to.  If omitted, the validator is assumed to be an
  entity level validator and is added to the EntityType's 'validators'.
  **/

  /**
  See  {{#crossLink "EntityType.getProperty"}}{{/crossLink}}
  @method getProperty
  **/

  /**
  See  {{#crossLink "EntityType.getPropertyNames"}}{{/crossLink}}
  @method getPropertyNames
  **/

  /**
  See  {{#crossLink "EntityType.getEntityCtor"}}{{/crossLink}}
  @method getCtor
  **/

  toJSON() {
    return core.toJson(this, {
      shortName: null,
      namespace: null,
      isComplexType: null,
      dataProperties: null,
      validators: null,
      custom: null
    });
  };

}

interface DataPropertyConfig {
  name?: string;
  nameOnServer?: string;
  dataType?: DataTypeSymbol | string | ComplexType;
  complexTypeName?: string;
  isNullable?: boolean;
  isScalar?: boolean; // will be false for some NoSQL databases.
  defaultValue?: any;
  isPartOfKey?: boolean;
  isUnmapped?: boolean;
  isSettable?: boolean;
  concurrencyMode?: string;
  maxLength?: number;
  validators?: Validator[];
  displayName?: string;
  enumType?: any;
  rawTypeName?: string;  // occurs with undefined datatypes
  custom?: Object;
}

/**
A DataProperty describes the metadata for a single property of an  {{#crossLink "EntityType"}}{{/crossLink}} that contains simple data.

Instances of the DataProperty class are constructed automatically during Metadata retrieval. However it is also possible to construct them
directly via the constructor.
@class DataProperty
**/
export class DataProperty implements IStructuralProperty {
  _$typeName = "DataProperty";
  isDataProperty = true;
  isNavigationProperty = false;

  name: string;
  nameOnServer: string;
  dataType?: DataTypeSymbol | string | ComplexType;
  complexTypeName: string;
  isComplexProperty: boolean;
  isNullable: boolean;
  isScalar: boolean; // will be false for some NoSQL databases.
  defaultValue: any;
  isPartOfKey: boolean;
  isUnmapped: boolean;
  isSettable: boolean;
  concurrencyMode: string;
  maxLength?: number;
  validators: Validator[];
  displayName: string;
  enumType?: any;
  rawTypeName?: string;  // occurs with undefined datatypes
  custom?: Object;

  parentType: EntityType | ComplexType;
  baseProperty: DataProperty;

  /**
    @example
        let lastNameProp = new DataProperty( {
            name: "lastName",
            dataType: DataType.String,
            isNullable: true,
            maxLength: 20
        });
        // assuming personEntityType is a newly constructed EntityType
        personEntityType.addProperty(lastNameProperty);
    @method <ctor> DataProperty
    @param config {configuration Object}
    @param [config.name] {String}  The name of this property.
    @param [config.nameOnServer] {String} Same as above but the name is that defined on the server.
    Either this or the 'name' above must be specified. Whichever one is specified the other will be computed using
    the NamingConvention on the MetadataStore associated with the EntityType to which this will be added.
    @param [config.dataType=DataType.String] {DataType}
    @param [config.complexTypeName] {String}
    @param [config.isNullable=true] {Boolean}
    @param [config.isScalar=true] {Boolean}
    @param [config.defaultValue] {Any}
    @param [config.isPartOfKey=false] {Boolean}
    @param [config.isUnmapped=false] {Boolean}
    @param [config.concurrencyMode] {String}
    @param [config.maxLength] {Integer} Only meaningfull for DataType.String
    @param [config.validators] {Array of Validator}
    @param [config.custom] {Object}
    **/
  constructor(config: DataPropertyConfig) {
    assertConfig(config)
      .whereParam("name").isString().isOptional()
      .whereParam("nameOnServer").isString().isOptional()
      .whereParam("dataType").isEnumOf(DataType).isOptional().or().isString().or().isInstanceOf(ComplexType)
      .whereParam("complexTypeName").isOptional()
      .whereParam("isNullable").isBoolean().isOptional().withDefault(true)
      .whereParam("isScalar").isOptional().withDefault(true)// will be false for some NoSQL databases.
      .whereParam("defaultValue").isOptional()
      .whereParam("isPartOfKey").isBoolean().isOptional()
      .whereParam("isUnmapped").isBoolean().isOptional()
      .whereParam("isSettable").isBoolean().isOptional().withDefault(true)
      .whereParam("concurrencyMode").isString().isOptional()
      .whereParam("maxLength").isNumber().isOptional()
      .whereParam("validators").isInstanceOf(Validator).isArray().isOptional().withDefault([])
      .whereParam("displayName").isOptional()
      .whereParam("enumType").isOptional()
      .whereParam("rawTypeName").isOptional() // occurs with undefined datatypes
      .whereParam("custom").isOptional()
      .applyAll(this);
    let hasName = !!(this.name || this.nameOnServer);
    if (!hasName) {
      throw new Error("A DataProperty must be instantiated with either a 'name' or a 'nameOnServer' property");
    }
    // name/nameOnServer is resolved later when a metadataStore is available.

    if (this.complexTypeName) {
      this.isComplexProperty = true;
      this.dataType = null;
    } else if (typeof (this.dataType) === "string") {
      let dt = DataType.fromName(this.dataType);
      if (!dt) {
        throw new Error("Unable to find a DataType enumeration by the name of: " + this.dataType);
      }
      this.dataType = dt;
    } else if (!this.dataType) {
      this.dataType = DataType.String;
    }

    // == as opposed to === is deliberate here.
    if (this.defaultValue == null) {
      if (this.isNullable) {
        this.defaultValue = null;
      } else {
        if (this.isComplexProperty) {
          // what to do? - shouldn't happen from EF - but otherwise ???
        } else if (this.dataType === DataType.Binary) {
          this.defaultValue = "AAAAAAAAJ3U="; // hack for all binary fields but value is specifically valid for timestamp fields - arbitrary valid 8 byte base64 value.
        } else {
          this.defaultValue = this.dataType.defaultValue;
          if (this.defaultValue == null) {
            throw new Error("A nonnullable DataProperty cannot have a null defaultValue. Name: " + (this.name || this.nameOnServer));
          }
        }
      }
    } else if (this.dataType.isNumeric) {
      // in case the defaultValue comes in as a string ( which it does in EF6).
      if (typeof (this.defaultValue) === "string") {
        this.defaultValue = parseFloat(this.defaultValue);
      }
    }

    if (this.isComplexProperty) {
      this.isScalar = this.isScalar == null || this.isScalar === true;
    }

  };

  static getRawValueFromServer(rawEntity: Object, dp: DataProperty) {
    if (dp.isUnmapped) {
      return rawEntity[dp.nameOnServer || dp.name];
    } else {
      let val = rawEntity[dp.nameOnServer];
      return val !== undefined ? val : dp.defaultValue;
    }
  }

  static getRawValueFromClient(rawEntity: Object, dp: DataProperty) {
    let val = rawEntity[dp.name];
    return val !== undefined ? val : dp.defaultValue;
  }


  /**
  The name of this property
  
  __readOnly__
  @property name {String}
  **/

  /**
  The display name of this property
  
  __readOnly__
  @property displayName {String} 
  **/

  /**
  The name of this property on the server
  
  __readOnly__
  @property nameOnServer {String} 
  **/

  /**
  The parent type that this property belongs to - will be either a {{#crossLink "EntityType"}}{{/crossLink}} or a {{#crossLink "ComplexType"}}{{/crossLink}}.
  
  __readOnly__
  @property parentType {EntityType|ComplexType}
  **/

  /**
  The {{#crossLink "DataType"}}{{/crossLink}} of this property.
  
  __readOnly__
  @property dataType {DataType}
  **/

  /**
  The name of the {{#crossLink "ComplexType"}}{{/crossLink}} associated with this property; may be null.
  
  __readOnly__
  @property complexTypeName {String}
  **/

  /**
  Whether the contents of this property is an instance of a {{#crossLink "ComplexType"}}{{/crossLink}}.
  
  __readOnly__
  @property isComplexProperty {bool}
  **/

  /**
  Whether this property is nullable.
  
  __readOnly__
  @property isNullable {Boolean}
  **/

  /**
  Whether this property is scalar (i.e., returns a single value).
  
  __readOnly__
  @property isScalar {Boolean}
  **/

  /**
  Property on the base type that this property is inherited from. Will be null if the property is not on the base type.
  
  __readOnly__
  @property baseProperty {DataProperty}
  **/

  /**
  Whether this property is a 'key' property.
  
  __readOnly__
  @property isPartOfKey {Boolean}
  **/

  /**
  Whether this property is an 'unmapped' property.
  
  __readOnly__
  @property isUnmapped {Boolean}
  **/

  /**
  __Describe this__
  
  __readOnly__
  @property concurrencyMode {String}
  **/

  /**
  The maximum length for the value of this property.
  
  __readOnly__
  @property maxLength {Number}
  **/

  /**
  The {{#crossLink "Validator"}}{{/crossLink}}s that are associated with this property. Validators can be added and
  removed from this collection.
  
  __readOnly__
  @property validators {Array of Validator}
  **/

  /**
  The default value for this property.
  
  __readOnly__
  @property defaultValue {any}
  **/

  /**
  The navigation property related to this property.  Will only be set if this is a foreign key property.
  
  __readOnly__
  @property relatedNavigationProperty {NavigationProperty}
  **/

  /**
  A free form object that can be used to define any custom metadata for this DataProperty.
  
  __readOnly__
  @property custom {Object}
  **/

  /**
  Is this a DataProperty? - always true here
  Allows polymorphic treatment of DataProperties and NavigationProperties.
  
  __readOnly__
  @property isDataProperty {Boolean}
  **/

  /**
  Is this a NavigationProperty? - always false here
  Allows polymorphic treatment of DataProperties and NavigationProperties.
  
  __readOnly__
  @property isNavigationProperty {Boolean}
  **/

  resolveProperty(propName: string) {
    let result = this[propName];
    let baseProp = this.baseProperty;
    while (result == undefined && baseProp != null) {
      result = baseProp[propName];
      baseProp = baseProp.baseProperty;
    }
    return result;
  }

  formatName() {
    return this.parentType.name + "--" + this.name;
  }


  /**
  General purpose property set method
  @example
      // assume em1 is an EntityManager
      let prop = myEntityType.getProperty("myProperty");
      prop.setProperties( {
          custom: { foo: 7, bar: "test" }
      });
  @method setProperties
  @param config [object]
  @param [config.custom] {Object}
  **/
  setProperties(config: { displayName?: string, custom?: Object }) {
    assertConfig(config)
      .whereParam("displayName").isOptional()
      .whereParam("custom").isOptional()
      .applyAll(this);
  }

  getAllValidators() {
    let validators = this.validators.slice(0);
    let baseProp = this.baseProperty;
    while (baseProp) {
      validators.push.apply(validators, baseProp.validators);
      baseProp = baseProp.baseProperty;
    }
    return validators;
  }

  toJSON() {
    // do not serialize dataTypes that are complexTypes
    return core.toJson(this, {
      name: null,
      dataType: function (v: any) {
        return (v && v.parentEnum) ? v.name : undefined;
      }, // do not serialize dataTypes that are complexTypes
      complexTypeName: null,
      isNullable: true,
      defaultValue: null,
      isPartOfKey: false,
      isUnmapped: false,
      isSettable: true,
      concurrencyMode: null,
      maxLength: null,
      validators: null,
      displayName: null,
      enumType: null,
      rawTypeName: null,
      isScalar: true,
      custom: null
    });
  };

  static fromJSON(json: any) {
    json.dataType = DataType.fromName(json.dataType);
    // Parse default value into correct data type. (dateTime instances require extra work to deserialize properly.)
    if (json.defaultValue && json.dataType && json.dataType.parse) {
      json.defaultValue = json.dataType.parse(json.defaultValue, typeof json.defaultValue);
    }

    if (json.validators) {
      json.validators = json.validators.map(Validator.fromJSON);
    }

    return new DataProperty(json);
  };

}

export interface NavigationPropertyConfig {
  name?: string;
  nameOnServer?: string;
  entityTypeName?: string;
  isScalar?: boolean;
  associationName?: string;
  foreignKeyNames?: string[];
  foreignKeyNamesOnServer?: string[];
  invForeignKeyNames?: string[];
  invForeignKeyNamesOnServer?: string[];
  validators?: Validator[];
  displayName?: string;
  custom?: Object;
}

/**
  A NavigationProperty describes the metadata for a single property of an  {{#crossLink "EntityType"}}{{/crossLink}} that return instances of other EntityTypes.

  Instances of the NavigationProperty class are constructed automatically during Metadata retrieval.   However it is also possible to construct them
  directly via the constructor.
  @class NavigationProperty
  **/
export class NavigationProperty implements IStructuralProperty {
  _$typeName = "NavigationProperty";
  isDataProperty = false;
  isNavigationProperty = true;

  formatName = DataProperty.prototype.formatName;
  getAllValidators = DataProperty.prototype.getAllValidators;
  resolveProperty = DataProperty.prototype.resolveProperty;

  entityType: EntityType;
  parentType: EntityType; // ?? same as entityType
  parentEntityType: EntityType; // ?? same as above
  inverse: NavigationProperty;
  name: string;
  nameOnServer: string;
  entityTypeName: string;
  isScalar: boolean;
  associationName: string;
  foreignKeyNames: string[];
  foreignKeyNamesOnServer: string[];
  invForeignKeyNames: string[];
  invForeignKeyNamesOnServer: string[];
  relatedDataProperties: DataProperty[];
  validators: Validator[];
  displayName: string;
  isUnmapped: boolean;
  custom: Object;

  /**
  @example
      let homeAddressProp = new NavigationProperty( {
          name: "homeAddress",
          entityTypeName: "Address:#myNamespace",
          isScalar: true,
          associationName: "address_person",
          foreignKeyNames: ["homeAddressId"]
      });
      let homeAddressIdProp = new DataProperty( {
          name: "homeAddressId"
          dataType: DataType.Integer
      });
      // assuming personEntityType is a newly constructed EntityType
      personEntityType.addProperty(homeAddressProp);
      personEntityType.addProperty(homeAddressIdProp);
  @method <ctor> NavigationProperty
  @param config {configuration Object}
  @param [config.name] {String}  The name of this property.
  @param [config.nameOnServer] {String} Same as above but the name is that defined on the server.
  Either this or the 'name' above must be specified. Whichever one is specified the other will be computed using
  the NamingConvention on the MetadataStore associated with the EntityType to which this will be added.
  @param config.entityTypeName {String} The fully qualified name of the type of entity that this property will return.  This type
  need not yet have been created, but it will need to get added to the relevant MetadataStore before this EntityType will be 'complete'.
  The entityType name is constructed as: {shortName} + ":#" + {namespace}
  @param [config.isScalar=true] {Boolean}
  @param [config.associationName] {String} A name that will be used to connect the two sides of a navigation. May be omitted for unidirectional navigations.
  @param [config.foreignKeyNames] {Array of String} An array of foreign key names. The array is needed to support the possibility of multipart foreign keys.
  Most of the time this will be a single foreignKeyName in an array.
  @param [config.foreignKeyNamesOnServer] {Array of String} Same as above but the names are those defined on the server. Either this or 'foreignKeyNames' must
  be specified, if there are foreignKeys. Whichever one is specified the other will be computed using
  the NamingConvention on the MetadataStore associated with the EntityType to which this will be added.
  @param [config.validators] {Array of Validator}
  **/
  constructor(config: NavigationPropertyConfig) {
    assertConfig(config)
      .whereParam("name").isString().isOptional()
      .whereParam("nameOnServer").isString().isOptional()
      .whereParam("entityTypeName").isString()
      .whereParam("isScalar").isBoolean().isOptional().withDefault(true)
      .whereParam("associationName").isString().isOptional()
      .whereParam("foreignKeyNames").isArray().isString().isOptional().withDefault([])
      .whereParam("foreignKeyNamesOnServer").isArray().isString().isOptional().withDefault([])
      .whereParam("invForeignKeyNames").isArray().isString().isOptional().withDefault([])
      .whereParam("invForeignKeyNamesOnServer").isArray().isString().isOptional().withDefault([])
      .whereParam("validators").isInstanceOf(Validator).isArray().isOptional().withDefault([])
      .whereParam("displayName").isOptional()
      .whereParam("custom").isOptional()
      .applyAll(this);
    let hasName = !!(this.name || this.nameOnServer);

    if (!hasName) {
      throw new Error("A Navigation property must be instantiated with either a 'name' or a 'nameOnServer' property");
    }
  };


  /**
  The {{#crossLink "EntityType"}}{{/crossLink}} that this property belongs to. ( same as parentEntityType).
  __readOnly__
  @property parentType {EntityType}
  **/

  /**
  The {{#crossLink "EntityType"}}{{/crossLink}} that this property belongs to.
  __readOnly__
  @property parentEntityType {EntityType}
  **/

  /**
  The name of this property

  __readOnly__
  @property name {String}
  **/

  /**
  The display name of this property

  __readOnly__
  @property displayName {String} 
  **/

  /**
  The name of this property on the server

  __readOnly__
  @property nameOnServer {String} 
  **/

  /**
  The {{#crossLink "EntityType"}}{{/crossLink}} returned by this property.

  __readOnly__
  @property entityType {EntityType}
  **/

  /**
  Whether this property returns a single entity or an array of entities.

  __readOnly__
  @property isScalar {Boolean}
  **/

  /**
  Property on the base type that this property is inherited from. Will be null if the property is not on the base type.

  __readOnly__
  @property baseProperty {NavigationProperty}
  **/

  /**
  The name of the association to which that this property belongs.  This associationName will be shared with this
  properties 'inverse'.

  __readOnly__
  @property associationName {String}
  **/

  /**
  The names of the foreign key DataProperties associated with this NavigationProperty. There will usually only be a single DataProperty associated
  with a Navigation property except in the case of entities with multipart keys.

  __readOnly__
  @property foreignKeyNames {Array of String}
  **/

  /**
  The 'foreign key' DataProperties associated with this NavigationProperty. There will usually only be a single DataProperty associated
  with a Navigation property except in the case of entities with multipart keys.

  __readOnly__
  @property relatedDataProperties {Array of DataProperty}
  **/

  /**
  The inverse of this NavigationProperty.  The NavigationProperty that represents a navigation in the opposite direction
  to this NavigationProperty.

  __readOnly__
  @property inverse {NavigationProperty}
  **/

  /**
  The {{#crossLink "Validator"}}{{/crossLink}}s that are associated with this property. Validators can be added and
  removed from this collection.

  __readOnly__
  @property validators {Array of Validator}
  **/

  /**
  A free form object that can be used to define any custom metadata for this NavigationProperty.

  __readOnly__
  @property custom {Object}
  **/

  /**
  Is this a DataProperty? - always false here
  Allows polymorphic treatment of DataProperties and NavigationProperties.

  __readOnly__
  @property isDataProperty {Boolean}
  **/

  /**
  Is this a NavigationProperty? - always true here
  Allows polymorphic treatment of DataProperties and NavigationProperties.

  __readOnly__
  @property isNavigationProperty {Boolean}
  **/


  /**
  General purpose property set method
  @example
      // assume myEntityType is an EntityType
      let prop = myEntityType.getProperty("myProperty");
      prop.setProperties( {
          custom: { foo: 7, bar: "test" }
      });
  @method setProperties
  @param config [object]
  @param [config.inverse] {String}
  @param [config.custom] {Object}
  **/
  setProperties = function (config: { displayName?: string, foreignKeyNames?: string[], invForeignKeyNames?: string[], custom?: Object }) {
    if (!this.parentType) {
      throw new Error("Cannot call NavigationProperty.setProperties until the parent EntityType of the NavigationProperty has been set.");
    }
    let inverse = config.inverse;
    if (inverse) delete config.inverse;
    assertConfig(config)
      .whereParam("displayName").isOptional()
      .whereParam("foreignKeyNames").isArray().isString().isOptional().withDefault([])
      .whereParam("invForeignKeyNames").isArray().isString().isOptional().withDefault([])
      .whereParam("custom").isOptional()
      .applyAll(this);
    this.parentType._updateNames(this);

    this._resolveNp();
    if (inverse) {
      this.setInverse(inverse);
    }

  };

  setInverse(inverseNp: NavigationProperty | string) {
    let invNp: NavigationProperty;
    if (typeof (inverseNp) === "string") {
      invNp = this.entityType.getNavigationProperty(inverseNp);
    } else {
      invNp = inverseNp;
    }

    if (!invNp) {
      throw throwSetInverseError(this, "Unable to find inverse property: " + inverseNp);
    }
    if (this.inverse || invNp.inverse) {
      throwSetInverseError(this, "It has already been set on one side or the other.");
    }
    if (invNp.entityType != this.parentType) {
      throwSetInverseError(this, invNp.formatName + " is not a valid inverse property for this.");
    }
    if (this.associationName) {
      invNp.associationName = this.associationName;
    } else {
      if (!invNp.associationName) {
        invNp.associationName = this.formatName() + "_" + invNp.formatName();
      }
      this.associationName = invNp.associationName;
    }
    this._resolveNp();
    invNp._resolveNp();
  };

  // // In progress - will be used for manual metadata config
  // createInverse(config: any) {

  //   if (!this.entityType) {
  //     throwCreateInverseError(this, "has not yet been defined.");
  //   }
  //   if (this.entityType.isFrozen) {
  //     throwCreateInverseError(this, "is frozen.");
  //   }
  //   let metadataStore = this.entityType.metadataStore;
  //   if (metadataStore == null) {
  //     throwCreateInverseError(this, "has not yet been added to the metadataStore.");
  //   }

  //   config.entityTypeName = this.parentEntityType.name;
  //   config.associationName = this.associationName;
  //   let invNp = new NavigationProperty(config);
  //   this.parentEntityType.addNavigationProperty(invNp);
  //   return invNp;
  // };



  toJSON() {
    return core.toJson(this, {
      name: null,
      entityTypeName: null,
      isScalar: null,
      associationName: null,
      validators: null,
      displayName: null,
      foreignKeyNames: null,
      invForeignKeyNames: null,
      custom: null
    });
  };

  static fromJSON(json: any) {
    if (json.validators) {
      json.validators = json.validators.map(Validator.fromJSON);
    }
    return new NavigationProperty(json);
  };

  _resolveNp() {
    let np = this;
    let entityType = np.entityType;
    let invNp = core.arrayFirst(entityType.navigationProperties, function (altNp) {
      // Can't do this because of possibility of comparing a base class np with a subclass altNp.
      // return altNp.associationName === np.associationName
      //    && altNp !== np;
      // So use this instead.
      return altNp.associationName === np.associationName &&
        (altNp.name !== np.name || altNp.entityTypeName !== np.entityTypeName);
    });
    np.inverse = invNp;
    //if (invNp && invNp.inverse == null) {
    //    invNp._resolveNp();
    //}
    if (!invNp) {
      // unidirectional 1-n relationship
      np.invForeignKeyNames.forEach(function (invFkName) {
        let fkProp = entityType.getDataProperty(invFkName);
        if (!fkProp) {
          throw new Error("EntityType '" + np.entityTypeName + "' has no foreign key matching '" + invFkName + "'");
        }
        let invEntityType = np.parentType;
        fkProp.inverseNavigationProperty = core.arrayFirst(invEntityType.navigationProperties, function (np2) {
          return np2.invForeignKeyNames && np2.invForeignKeyNames.indexOf(fkProp.name) >= 0 && np2.entityType === fkProp.parentType;
        });
        core.arrayAddItemUnique(entityType.foreignKeyProperties, fkProp);
      });
    }

    resolveRelated(np);
  }

}

function throwSetInverseError(np: NavigationProperty, message: string) {
  throw new Error("Cannot set the inverse property for: " + np.formatName() + ". " + message);
}

function throwCreateInverseError(np: NavigationProperty, message: string) {
  throw new Error("Cannot create inverse for: " + np.formatName() + ". The entityType for this navigation property " + message);
}

// sets navigation property: relatedDataProperties and dataProperty: relatedNavigationProperty
function resolveRelated(np: NavigationProperty) {

  let fkNames = np.foreignKeyNames;
  if (fkNames.length === 0) return;

  let parentEntityType = np.parentType;
  let fkProps = fkNames.map(function (fkName) {
    return parentEntityType.getDataProperty(fkName);
  });
  let fkPropCollection = parentEntityType.foreignKeyProperties;

  fkProps.forEach(function (dp) {
    core.arrayAddItemUnique(fkPropCollection, dp);
    dp.relatedNavigationProperty = np;
    // now update the inverse
    core.arrayAddItemUnique(np.entityType.inverseForeignKeyProperties, dp);
    if (np.relatedDataProperties) {
      core.arrayAddItemUnique(np.relatedDataProperties, dp);
    } else {
      np.relatedDataProperties = [dp];
    }
  });
}

export class AutoGeneratedKeyTypeSymbol extends EnumSymbol {

}

/**
  AutoGeneratedKeyType is an 'Enum' containing all of the valid states for an automatically generated key.
  @class AutoGeneratedKeyType
  @static
  @final
  **/
class AutoGeneratedKeyTypeEnum extends TypedEnum<AutoGeneratedKeyTypeSymbol> {

  constructor() {
      super("AutoGeneratedKeyType", AutoGeneratedKeyTypeSymbol);
      this.resolveSymbols();
  }

  /**
  This entity does not have an autogenerated key.
  The client must set the key before adding the entity to the EntityManager
  @property None {AutoGeneratedKeyType}
  @final
  @static
  **/
  None = this.addSymbol();
  /**
  This entity's key is an Identity column and is set by the backend database.
  Keys for new entities will be temporary until the entities are saved at which point the keys will
  be converted to their 'real' versions.
  @property Identity {AutoGeneratedKeyType}
  @final
  @static
  **/
  Identity = this.addSymbol();
  /**
  This entity's key is generated by a KeyGenerator and is set by the backend database.
  Keys for new entities will be temporary until the entities are saved at which point the keys will
  be converted to their 'real' versions.
  @property KeyGenerator {AutoGeneratedKeyType}
  @final
  @static
  **/
  KeyGenerator = this.addSymbol();

};

export const AutoGeneratedKeyType = new AutoGeneratedKeyTypeEnum();

// Type guards
function isEntityType(type: IStructuralType): type is EntityType {
    return !type.isComplexType;
}

function isComplexType(type: IStructuralType): type is ComplexType {
    return type.isComplexType;
}

// mixin methods

let proto = Param.prototype;

proto.isEntity = function () {
  return this._addContext({
    fn: isEntity,
    msg: " must be an entity"
  });
};

function isEntity(context, v) {
  if (v == null) return false;
  return (v.entityType !== undefined);
}

proto.isEntityProperty = function () {
  return this._addContext({
    fn: isEntityProperty,
    msg: " must be either a DataProperty or a NavigationProperty"
  });
};

function isEntityProperty(context, v) {
  if (v == null) return false;
  return (v.isDataProperty || v.isNavigationProperty);
}


// functions shared between classes related to Metadata

function parseTypeName(entityTypeName: string) {
  if (!entityTypeName) {
    return null;
  }

  let typeParts = entityTypeName.split(":#");
  if (typeParts.length > 1) {
    return makeTypeHash(typeParts[0], typeParts[1]);
  }

  if (core.stringStartsWith(entityTypeName, MetadataStore.ANONTYPE_PREFIX)) {
    let typeHash = makeTypeHash(entityTypeName);
    typeHash.isAnonymous = true
    return typeHash;
  }
  let entityTypeNameNoAssembly = entityTypeName.split(",")[0];
  typeParts = entityTypeNameNoAssembly.split(".");
  if (typeParts.length > 1) {
    let shortName = typeParts[typeParts.length - 1];
    let namespaceParts = typeParts.slice(0, typeParts.length - 1);
    let ns = namespaceParts.join(".");
    return makeTypeHash(shortName, ns);
  } else {
    return makeTypeHash(entityTypeName);
  }
}

function makeTypeHash(shortName: string, ns?: string) {
  return {
    shortTypeName: shortName,
    namespace: ns,
    typeName: qualifyTypeName(shortName, ns)
  };
}

function isQualifiedTypeName(entityTypeName: string) {
  return entityTypeName.indexOf(":#") >= 0;
}

function qualifyTypeName(shortName: string, ns?: string) {
  if (ns && ns.length > 0) {
    return shortName + ":#" + ns;
  } else {
    return shortName;
  }
}

// Used by both ComplexType and EntityType
function addProperties(entityType: EntityType | ComplexType, propObj: Object | null, ctor: FunctionConstructor) {

  if (!propObj) return;
  if (Array.isArray(propObj)) {
    propObj.forEach(entityType._addPropertyCore.bind(entityType));
  } else if (typeof (propObj) === 'object') {
    for (let key in propObj) {
      if (core.hasOwnProperty(propObj, key)) {
        let value = propObj[key];
        value.name = key;
        let prop = new ctor(value);
        entityType._addPropertyCore(<IStructuralProperty> prop);
      }
    }
  } else {
    throw new Error("The 'dataProperties' or 'navigationProperties' values must be either an array of data/nav properties or an object where each property defines a data/nav property");
  }
}

breeze.MetadataStore = MetadataStore;
breeze.EntityType = EntityType;
breeze.ComplexType = ComplexType;
breeze.DataProperty = DataProperty;
breeze.NavigationProperty = NavigationProperty;
breeze.AutoGeneratedKeyType = AutoGeneratedKeyType;



