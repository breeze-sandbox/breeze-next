import { assertConfig } from './assert-param';
import { breeze, core } from './core-fns';
import { config } from './config';

export class NamingConventionConfig {
  name?: string;
  serverPropertyNameToClient?: (nm: string, context?: any) => string;
  clientPropertyNameToServer?: (nm: string, context?: any) => string;
}

/**
  A NamingConvention instance is used to specify the naming conventions under which a MetadataStore
  will translate property names between the server and the javascript client.

  The default NamingConvention does not perform any translation, it simply passes property names thru unchanged.

  @class NamingConvention
  **/
export class NamingConvention {
  _$typeName = "NamingConvention";

  name: string;
  serverPropertyNameToClient: (nm: string, context?: any) => string;
  clientPropertyNameToServer: (nm: string, context?: any) => string;

  /**
  NamingConvention constructor

  @example
      // A naming convention that converts the first character of every property name to uppercase on the server
      // and lowercase on the client.
      var namingConv = new NamingConvention({
          serverPropertyNameToClient: function(serverPropertyName) {
              return serverPropertyName.substr(0, 1).toLowerCase() + serverPropertyName.substr(1);
          },
          clientPropertyNameToServer: function(clientPropertyName) {
              return clientPropertyName.substr(0, 1).toUpperCase() + clientPropertyName.substr(1);
          }            
      });
      var ms = new MetadataStore({ namingConvention: namingConv });
      var em = new EntityManager( { metadataStore: ms });
  @method <ctor> NamingConvention
  @param config {Object}
  @param config.serverPropertyNameToClient {Function} Function that takes a server property name add converts it into a client side property name.
  @param config.clientPropertyNameToServer {Function} Function that takes a client property name add converts it into a server side property name.
  **/
  constructor(ncConfig: NamingConventionConfig ) {
    assertConfig(ncConfig || {})
        .whereParam("name").isOptional().isString()
        .whereParam("serverPropertyNameToClient").isFunction()
        .whereParam("clientPropertyNameToServer").isFunction()
        .applyAll(this);
    if (!this.name) {
      this.name = core.getUuid();
    }
    config._storeObject(this, this._$typeName, this.name);
  };

  /**
  The function used to convert server side property names to client side property names.

  @method serverPropertyNameToClient
  @param serverPropertyName {String}
  @param [property] {DataProperty|NavigationProperty} The actual DataProperty or NavigationProperty corresponding to the property name.
  @return {String} The client side property name.
  **/

  /**
  The function used to convert client side property names to server side property names.

  @method clientPropertyNameToServer
  @param clientPropertyName {String}
  @param [property] {DataProperty|NavigationProperty} The actual DataProperty or NavigationProperty corresponding to the property name.
  @return {String} The server side property name.
  **/

  /**
  A noop naming convention - This is the default unless another is specified.
  @property none {NamingConvention}
  @static
  **/
  static none = new NamingConvention({
    name: "noChange",
    serverPropertyNameToClient: (serverPropertyName) => {
      return serverPropertyName;
    },
    clientPropertyNameToServer: (clientPropertyName) => {
      return clientPropertyName;
    }
  });

  /**
  The "camelCase" naming convention - This implementation only lowercases the first character of the server property name
  but leaves the rest of the property name intact.  If a more complicated version is needed then one should be created via the ctor.
  @property camelCase {NamingConvention}
  @static
  **/
  static camelCase = new NamingConvention({
    name: "camelCase",
    serverPropertyNameToClient: (serverPropertyName) => {
      return serverPropertyName.substr(0, 1).toLowerCase() + serverPropertyName.substr(1);
    },
    clientPropertyNameToServer: (clientPropertyName) => {
      return clientPropertyName.substr(0, 1).toUpperCase() + clientPropertyName.substr(1);
    }
  });

  /**
  The default value whenever NamingConventions are not specified.
  @property defaultInstance {NamingConvention}
  @static
  **/
  static defaultInstance = new NamingConvention(NamingConvention.none);

  /**
  Sets the 'defaultInstance' by creating a copy of the current 'defaultInstance' and then applying all of the properties of the current instance.
  The current instance is returned unchanged.
  @method setAsDefault
  @example
      var namingConv = new NamingConvention({
          serverPropertyNameToClient: function(serverPropertyName) {
              return serverPropertyName.substr(0, 1).toLowerCase() + serverPropertyName.substr(1);
          },
          clientPropertyNameToServer: function(clientPropertyName) {
              return clientPropertyName.substr(0, 1).toUpperCase() + clientPropertyName.substr(1);
          }            
      });
      namingConv.setAsDefault();
  @chainable
  **/
  setAsDefault() {
    return core.setAsDefault(this, NamingConvention);
  };

}

breeze.NamingConvention = NamingConvention;


