import { core } from './core';
import { EnumSymbol, TypedEnum } from './enum';
import { assertConfig } from './assert-param';

export class MergeStrategySymbol extends EnumSymbol {

}


/**
MergeStrategy is an 'Enum' that determines how entities are merged into an EntityManager.

@class MergeStrategy
@static
**/
class MergeStrategyEnum extends TypedEnum<MergeStrategySymbol> {
  constructor() {
    super("MergeStrategy", MergeStrategySymbol);
    this.resolveSymbols();
  }


  /**
  MergeStrategy.PreserveChanges updates the cached entity with the incoming values unless the cached entity is in a changed
  state (added, modified, deleted) in which case the incoming values are ignored. The updated cached entity’s EntityState will
  remain {{#crossLink "EntityState/Unchanged"}}{{/crossLink}} unless you’re importing entities in which case the new EntityState will
  be that of the imported entities.

  @property PreserveChanges {MergeStrategy}
  @final
  @static
  **/
  PreserveChanges = this.addSymbol();
  /**
  MergeStrategy.OverwriteChanges always updates the cached entity with incoming values even if the entity is in
  a changed state (added, modified, deleted). After the merge, the pending changes are lost.
  The new EntityState will be  {{#crossLink "EntityState/Unchanged"}}{{/crossLink}} unless you’re importing entities
  in which case the new EntityState will be that of the imported entities.

  @property OverwriteChanges {MergeStrategy}
  @final
  @static
  **/
  OverwriteChanges = this.addSymbol();

  /**
  SkipMerge is used to ignore incoming values. Adds the incoming entity to the cache only if there is no cached entity with the same key.
  This is the fastest merge strategy but your existing cached data will remain “stale”.

  @property SkipMerge {MergeStrategy}
  @final
  @static
  **/
  SkipMerge = this.addSymbol();

  /**
  Disallowed is used to throw an exception if there is an incoming entity with the same key as an entity already in the cache.
  Use this strategy when you want to be sure that the incoming entity is not already in cache.
  This is the default strategy for EntityManager.attachEntity.

  @property Disallowed {MergeStrategy}
  @final
  @static
  **/
  Disallowed = this.addSymbol();


}

export const MergeStrategy = new MergeStrategyEnum();

export class FetchStrategySymbol extends EnumSymbol {

}

/**
FetchStrategy is an 'Enum' that determines how and where entities are retrieved from as a result of a query.

@class FetchStrategy
@static
**/
class FetchStrategyEnum extends TypedEnum<FetchStrategySymbol> {
  constructor() {
    super("FetchStrategy", FetchStrategySymbol);
    this.resolveSymbols();
  }

  /**
  FromServer is used to tell the query to execute the query against a remote data source on the server.
  @property FromServer {MergeStrategy}
  @final
  @static
  **/
  FromServer = this.addSymbol();
  /**
  FromLocalCache is used to tell the query to execute the query against a local EntityManager instead of going to a remote server.
  @property FromLocalCache {MergeStrategy}
  @final
  @static
  **/
  FromLocalCache = this.addSymbol();

}

export const FetchStrategy = new FetchStrategyEnum();

export class QueryOptionsConfig {
    fetchStrategy?: FetchStrategySymbol;
    mergeStrategy?: MergeStrategySymbol;
    includeDeleted?: boolean;
}

/**
  A QueryOptions instance is used to specify the 'options' under which a query will occur.

  @class QueryOptions
  **/
export class QueryOptions {
  _$typeName: string;

  fetchStrategy: FetchStrategySymbol;
  mergeStrategy: MergeStrategySymbol;
  includeDeleted: boolean;
  /**
  The default value whenever QueryOptions are not specified.
  @property defaultInstance {QueryOptions}
  @static
  **/
  static defaultInstance = new QueryOptions({
    fetchStrategy: FetchStrategy.FromServer,
    mergeStrategy: MergeStrategy.PreserveChanges,
    includeDeleted: false
  });

  /**
  QueryOptions constructor
  @example
      var newQo = new QueryOptions( { mergeStrategy: MergeStrategy.OverwriteChanges });
      // assume em1 is a preexisting EntityManager
      em1.setProperties( { queryOptions: newQo });

  Any QueryOptions property that is not defined will be defaulted from any QueryOptions defined at a higher level in the breeze hierarchy, i.e.
  -  from query.queryOptions
  -  to   entityManager.queryOptions
  -  to   QueryOptions.defaultInstance;

  @method <ctor> QueryOptions
  @param [config] {Object}
  @param [config.fetchStrategy] {FetchStrategy}
  @param [config.mergeStrategy] {MergeStrategy}
  @param [config.includeDeleted] {Boolean} Whether query should return cached deleted entities (false by default)
  **/
  constructor(config?: QueryOptionsConfig) {
    QueryOptions._updateWithConfig(this, config);
  };


  /**
  A {{#crossLink "FetchStrategy"}}{{/crossLink}}
  __readOnly__
  @property fetchStrategy {FetchStrategy}
  **/

  /**
  A {{#crossLink "MergeStrategy"}}{{/crossLink}}
  __readOnly__
  @property mergeStrategy {MergeStrategy}
  **/

  /**
  Whether to include cached deleted entities in a query result (false by default).

  __readOnly__
  @property includeDeleted {Boolean}
  **/

  static resolve(queryOptionsArray: any[]) {
    return new QueryOptions(core.resolveProperties(queryOptionsArray, ["fetchStrategy", "mergeStrategy", "includeDeleted"]));
  };

  /**
  Returns a copy of this QueryOptions with the specified {{#crossLink "MergeStrategy"}}{{/crossLink}},
  {{#crossLink "FetchStrategy"}}{{/crossLink}}, or 'includeDeleted' option applied.
  @example
      // Given an EntityManager instance, em
      var queryOptions = em.queryOptions.using(MergeStrategy.PreserveChanges);
  or
  @example
      var queryOptions = em.queryOptions.using(FetchStrategy.FromLocalCache);
  or
  @example
      var queryOptions = em.queryOptions.using({ mergeStrategy: MergeStrategy.OverwriteChanges });
  or
  @example
      var queryOptions = em.queryOptions.using({
          includeDeleted: true,
          fetchStrategy:  FetchStrategy.FromLocalCache 
      });
  @method using
  @param config {Configuration Object|MergeStrategy|FetchStrategy} The object to apply to create a new QueryOptions.
  @return {QueryOptions}
  @chainable
  **/
  using(qoConfig: QueryOptionsConfig | MergeStrategySymbol | FetchStrategySymbol) {
    if (!qoConfig) return this;
    let result = new QueryOptions(this);
    if ( qoConfig instanceof MergeStrategySymbol) {
      qoConfig = { mergeStrategy: qoConfig };
    } else if ( qoConfig instanceof FetchStrategySymbol) {
      qoConfig = { fetchStrategy: qoConfig };
    }
    return QueryOptions._updateWithConfig(result, qoConfig);
  };

  /**
  Sets the 'defaultInstance' by creating a copy of the current 'defaultInstance' and then applying all of the properties of the current instance.
  The current instance is returned unchanged.
  @method setAsDefault
  @example
      var newQo = new QueryOptions( { mergeStrategy: MergeStrategy.OverwriteChanges });
      newQo.setAsDefault();
  @chainable
  **/
  setAsDefault() {
    return core.setAsDefault(this, QueryOptions);
  };

  toJSON() {
    return core.toJson(this, {
      fetchStrategy: null,
      mergeStrategy: null,
      includeDeleted: false
    });
  };

  static fromJSON(json: any) {
    return new QueryOptions({
      fetchStrategy: FetchStrategy.fromName(json.fetchStrategy),
      mergeStrategy: MergeStrategy.fromName(json.mergeStrategy),
      includeDeleted: json.includeDeleted === true
    });
  };

  private static _updateWithConfig(obj: QueryOptions, config?: QueryOptionsConfig) {
    if (config) {
      assertConfig(config)
        .whereParam("fetchStrategy").isEnumOf(FetchStrategy).isOptional()
        .whereParam("mergeStrategy").isEnumOf(MergeStrategy).isOptional()
        .whereParam("includeDeleted").isBoolean().isOptional()
        .applyAll(obj);
    }
    return obj;
  }

}
QueryOptions.prototype._$typeName = "QueryOptions";




