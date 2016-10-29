﻿import { core } from './core';
import { assertConfig } from './assert-param';
import { config } from './config';

export interface ILocalQueryComparisonOptionsConfig {
  name?: string;
  isCaseSensitive?: boolean;
  usesSql92CompliantStringComparison?: boolean;
}

/**
  A LocalQueryComparisonOptions instance is used to specify the "comparison rules" used when performing "local queries" in order
  to match the semantics of these same queries when executed against a remote service.  These options should be set based on the
  manner in which your remote service interprets certain comparison operations.

  The default LocalQueryComparisonOptions stipulates 'caseInsensitive" queries with ANSI SQL rules regarding comparisons of unequal
  length strings.

  @class LocalQueryComparisonOptions
  **/
export class LocalQueryComparisonOptions {
  _$typeName = "LocalQueryComparisonOptions";

  name: string;
  isCaseSensitive: boolean;
  usesSql92CompliantStringComparison: boolean;
  /**
  LocalQueryComparisonOptions constructor
  @example
      // create a 'caseSensitive - non SQL' instance.
      var lqco = new LocalQueryComparisonOptions({
              name: "caseSensitive-nonSQL"
              isCaseSensitive: true;
              usesSql92CompliantStringComparison: false;
          });
      // either apply it globally
      lqco.setAsDefault();
      // or to a specific MetadataStore
      var ms = new MetadataStore({ localQueryComparisonOptions: lqco });
      var em = new EntityManager( { metadataStore: ms });

  @method <ctor> LocalQueryComparisonOptions
  @param config {Object}
  @param [config.name] {String}
  @param [config.isCaseSensitive] {Boolean} Whether predicates that involve strings will be interpreted in a "caseSensitive" manner. Default is 'false'
  @param [config.usesSql92CompliantStringComparison] {Boolean} Whether of not to enforce the ANSI SQL standard
  of padding strings of unequal lengths before comparison with spaces. Note that per the standard, padding only occurs with equality and
  inequality predicates, and not with operations like 'startsWith', 'endsWith' or 'contains'.  Default is true.
  **/

  constructor(lqcoConfig: ILocalQueryComparisonOptionsConfig) {
    assertConfig(lqcoConfig || {})
        .whereParam("name").isOptional().isString()
        .whereParam("isCaseSensitive").isOptional().isBoolean()
        .whereParam("usesSql92CompliantStringComparison").isBoolean()
        .applyAll(this);
    if (!this.name) {
      this.name = core.getUuid();
    }
    config._storeObject(this, this._$typeName, this.name);
  };

  /**
  Case insensitive SQL compliant options - this is also the default unless otherwise changed.
  @property caseInsensitiveSQL {LocalQueryComparisonOptions}
  @static
  **/
  static caseInsensitiveSQL = new LocalQueryComparisonOptions({
    name: "caseInsensitiveSQL",
    isCaseSensitive: false,
    usesSql92CompliantStringComparison: true
  });

  /**
  The default value whenever LocalQueryComparisonOptions are not specified. By default this is 'caseInsensitiveSQL'.
  @property defaultInstance {LocalQueryComparisonOptions}
  @static
  **/
  static defaultInstance = new LocalQueryComparisonOptions(LocalQueryComparisonOptions.caseInsensitiveSQL);

  /**
  Sets the 'defaultInstance' by creating a copy of the current 'defaultInstance' and then applying all of the properties of the current instance.
  The current instance is returned unchanged.
  @method setAsDefault
  @example
      var lqco = new LocalQueryComparisonOptions({
          isCaseSensitive: false;
          usesSql92CompliantStringComparison: true;
      });
  lqco.setAsDefault();
  @chainable
  **/
  setAsDefault() {
    return core.setAsDefault(this, LocalQueryComparisonOptions);
  };

}




