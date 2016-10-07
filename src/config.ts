import { __objectFirst, __objectMap, core, breeze } from './core-fns';
import { assertParam, assertConfig } from './assert-param';
import { BreezeEvent } from './event';

interface ICtor { new (...args: any[]): any };
interface IDef { ctor: ICtor, defaultInstance: any };

class InterfaceDef {

    name: string;
    defaultInstance: any;
    _implMap: { [name: string]: IDef };

    constructor(name: string) {
        this.name = name;
        this.defaultInstance = null;
        this._implMap = {};
    }

    /** Define an implementation of the given adaptername */
    registerCtor(adapterName: string, ctor: ICtor): void {
        this._implMap[adapterName.toLowerCase()] = { ctor: ctor, defaultInstance: null };
    };

    /** Return the definition for the given adapterName */
    getImpl(adapterName: string): IDef {
        return this._implMap[adapterName.toLowerCase()];
    };

    /** Return the first implementation for this InterfaceDef */
    getFirstImpl(): IDef {
        let kv = __objectFirst(this._implMap, function () {
            return true;
        });
        return kv ? kv.value : null;
    };

    getDefaultInstance(): IDef {
        return this.defaultInstance;
    }
}

interface InterfaceRegistry {
    ajax: InterfaceDef;
    modelLibrary: InterfaceDef;
    dataService: InterfaceDef;
    uriBuilder: InterfaceDef;
}

class Config {
    functionRegistry = {};
    typeRegistry = {};
    objectRegistry = {};
    interfaceInitialized: BreezeEvent;
    interfaceRegistry: InterfaceRegistry = {
        ajax: new InterfaceDef("ajax"),
        modelLibrary: new InterfaceDef("modelLibrary"),
        dataService: new InterfaceDef("dataService"),
        uriBuilder: new InterfaceDef("uriBuilder")
    };
    stringifyPad = '';

    constructor() {
        this.interfaceInitialized = new BreezeEvent("interfaceInitialized", this);
        this.interfaceRegistry.modelLibrary.getDefaultInstance = function() {
            if (!this.defaultInstance) {
                throw new Error("Unable to locate the default implementation of the '" + this.name +
                    "' interface.  Possible options are 'ko', 'backingStore' or 'backbone'. See the breeze.config.initializeAdapterInstances method.");
            }
            return this.defaultInstance;
        }
    }

    /**
    Method use to register implementations of standard breeze interfaces.  Calls to this method are usually
    made as the last step within an adapter implementation.
    @method registerAdapter
    @param interfaceName {String} - one of the following interface names "ajax", "dataService" or "modelLibrary"
    @param adapterCtor {Function} - an ctor function that returns an instance of the specified interface.
    **/
    registerAdapter(interfaceName: string, adapterCtor: ICtor) {
        assertParam(interfaceName, "interfaceName").isNonEmptyString().check();
        assertParam(adapterCtor, "adapterCtor").isFunction().check();
        // this impl will be thrown away after the name is retrieved.
        let impl = new adapterCtor();
        let implName = impl.name;
        if (!implName) {
            throw new Error("Unable to locate a 'name' property on the constructor passed into the 'registerAdapter' call.");
        }
        let idef = this.getInterfaceDef(interfaceName);
        idef.registerCtor(implName, adapterCtor);
    }

    /**
    Returns the ctor function used to implement a specific interface with a specific adapter name.
    @method getAdapter
    @param interfaceName {String} One of the following interface names "ajax", "dataService" or "modelLibrary"
    @param [adapterName] {String} The name of any previously registered adapter. If this parameter is omitted then
    this method returns the "default" adapter for this interface. If there is no default adapter, then a null is returned.
    @return {Function|null} Returns either a ctor function or null.
    **/
    getAdapter(interfaceName: string, adapterName: string) {
        let idef = this.getInterfaceDef(interfaceName);
        if (adapterName) {
            let impl = idef.getImpl(adapterName);
            return impl ? impl.ctor : null;
        } else {
            return idef.defaultInstance ? idef.defaultInstance._$impl.ctor : null;
        }
    };

    /**
    Initializes a collection of adapter implementations and makes each one the default for its corresponding interface.
    @method initializeAdapterInstances
    @param config {Object}
    @param [config.ajax] {String} - the name of a previously registered "ajax" adapter
    @param [config.dataService] {String} - the name of a previously registered "dataService" adapter
    @param [config.modelLibrary] {String} - the name of a previously registered "modelLibrary" adapter
    @param [config.uriBuilder] {String} - the name of a previously registered "uriBuilder" adapter
    @return [array of instances]
    **/
    initializeAdapterInstances(config: InterfaceRegistry) {
        assertConfig(config)
            .whereParam("dataService").isOptional()
            .whereParam("modelLibrary").isOptional()
            .whereParam("ajax").isOptional()
            .whereParam("uriBuilder").isOptional()
            .applyAll(this, false);
        return __objectMap(config, this.initializeAdapterInstance);
    };

    /**
    Initializes a single adapter implementation. Initialization means either newing a instance of the
    specified interface and then calling "initialize" on it or simply calling "initialize" on the instance
    if it already exists.
    @method initializeAdapterInstance
    @param interfaceName {String} The name of the interface to which the adapter to initialize belongs.
    @param adapterName {String} - The name of a previously registered adapter to initialize.
    @param [isDefault=true] {Boolean} - Whether to make this the default "adapter" for this interface.
    @return {an instance of the specified adapter}
    **/
    initializeAdapterInstance(interfaceName: string, adapterName: string, isDefault: boolean = true) {
        isDefault = isDefault === undefined ? true : isDefault;
        assertParam(interfaceName, "interfaceName").isNonEmptyString().check();
        assertParam(adapterName, "adapterName").isNonEmptyString().check();
        assertParam(isDefault, "isDefault").isBoolean().check();

        let idef = this.getInterfaceDef(interfaceName);
        let impl = idef.getImpl(adapterName);
        if (!impl) {
            throw new Error("Unregistered adapter.  Interface: " + interfaceName + " AdapterName: " + adapterName);
        }

        return this.initializeAdapterInstanceCore(idef, impl, isDefault);
    };

    /**
    Returns the adapter instance corresponding to the specified interface and adapter names.
    @method getAdapterInstance
    @param interfaceName {String} The name of the interface.
    @param [adapterName] {String} - The name of a previously registered adapter.  If this parameter is
    omitted then the default implementation of the specified interface is returned. If there is
    no defaultInstance of this interface, then the first registered instance of this interface is returned.
    @return {an instance of the specified adapter}
    **/
    getAdapterInstance(interfaceName: string, adapterName: string) {
        let idef = this.getInterfaceDef(interfaceName);
        let impl: IDef;

        let isDefault = adapterName == null || adapterName == "";
        if (isDefault) {
            if (idef.defaultInstance) return idef.defaultInstance;
            impl = idef.getFirstImpl();
        } else {
            impl = idef.getImpl(adapterName);
        }
        if (!impl) return null;
        if (impl.defaultInstance) {
            return impl.defaultInstance;
        } else {
            return this.initializeAdapterInstanceCore(idef, impl, isDefault);
        }
    };

    /** this is needed for reflection purposes when deserializing an object that needs a fn or ctor.
        Used to register validators. */
    registerFunction(fn: Function, fnName: string) {
        assertParam(fn, "fn").isFunction().check();
        assertParam(fnName, "fnName").isString().check();
        fn.prototype._$fnName = fnName;
        this.functionRegistry[fnName] = fn;
    };

    getRegisteredFunction(fnName: string) {
        return this.functionRegistry[fnName];
    };

    private _storeObject(obj: Object, type: string | Function, name: string) {
        // uncomment this if we make this public.
        //assertParam(obj, "obj").isObject().check();
        //assertParam(name, "objName").isString().check();
        let key = (typeof (type) === "string" ? type : type.prototype._$typeName) + "." + name;
        this.objectRegistry[key] = obj;
    };

    private _fetchObject(type: string | Function, name: string) {
        if (!name) return undefined;
        let key = (typeof (type) === "string" ? type : type.prototype._$typeName) + "." + name;
        let result = this.objectRegistry[key];
        if (!result) {
            throw new Error("Unable to locate a registered object by the name: " + key);
        }
        return result;
    };

    registerType(ctor: Function, typeName: string) {
        assertParam(ctor, "ctor").isFunction().check();
        assertParam(typeName, "typeName").isString().check();
        ctor.prototype._$typeName = typeName;
        this.typeRegistry[typeName] = ctor;
    };


    initializeAdapterInstanceCore(interfaceDef: InterfaceDef, impl: IDef, isDefault: boolean) {
        let instance = impl.defaultInstance;
        if (!instance) {
            instance = new (impl.ctor)();
            impl.defaultInstance = instance;
            instance._$impl = impl;
        }

        instance.initialize();

        if (isDefault) {
            // next line needs to occur before any recomposition
            interfaceDef.defaultInstance = instance;
        }

        // recomposition of other impls will occur here.
        this.interfaceInitialized.publish({ interfaceName: interfaceDef.name, instance: instance, isDefault: true });

        if (instance.checkForRecomposition) {
            // now register for own dependencies.
            this.interfaceInitialized.subscribe(function (interfaceInitializedArgs) {
                instance.checkForRecomposition(interfaceInitializedArgs);
            });
        }

        return instance;
    }

    getInterfaceDef(interfaceName: string): InterfaceDef {
        let lcName = interfaceName.toLowerCase();
        // source may be null
        let kv = __objectFirst(this.interfaceRegistry || {}, function (k, v) {
            return k.toLowerCase() === lcName;
        });
        if (!kv) {
            throw new Error("Unknown interface name: " + interfaceName);
        }
        return kv.value;
    }

}

export const config = new Config();
let __modelLibraryDef = config.interfaceRegistry.modelLibrary;

// legacy
core.config = config;

breeze.config = config;


