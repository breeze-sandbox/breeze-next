import { core, __extend, __formatString } from './core-fns';

interface IParamContext {
    typeName?: string;
    type?: any;
    prevContext?: IParamContext;
    msg?: string | ((context: IParamContext, v: any) => string);
    mustNotBeEmpty?: boolean;
    enumType?: any;
    propertyName?: string;
    allowNull?: boolean;
    fn?(context: IParamContext, v: any): boolean;
}

function isTypeOf(context: IParamContext, v: any) {
    if (v == null) return false;
    if (typeof (v) === context.typeName) return true;
    return false;
}

function isNonEmptyString(context: IParamContext, v: any) {
    if (v == null) return false;
    return (typeof (v) === 'string') && v.length > 0;
}

function isInstanceOf(context: IParamContext, v: any) {
    if (v == null) return false;
    return (v instanceof context.type);
}

function isEnumOf(context: IParamContext, v: any) {
    if (v == null) return false;
    return context.enumType.contains(v);
}

function hasProperty(context: IParamContext, v: any) {
    if (v == null) return false;
    return (v[context.propertyName] !== undefined);
}

function isRequired(context: IParamContext, v: any) {
    if (context.allowNull) {
        return v !== undefined;
    } else {
        return v != null;
    }
}

function isOptional(context: IParamContext, v: any) {
    if (v == null) return true;
    var prevContext = context.prevContext;
    if (prevContext) {
        return prevContext.fn(prevContext, v);
    } else {
        return true;
    }
}

function isOptionalMessage(context: IParamContext, v: any) {
    var prevContext = context.prevContext;
    var element = prevContext ? " or it " + getMessage(prevContext, v) : "";
    return "is optional" + element;
}

function isArray(context: IParamContext, v: any) {
    if (!Array.isArray(v)) {
        return false;
    }
    if (context.mustNotBeEmpty) {
        if (v.length === 0) return false;
    }
    // allow standalone is array call.
    var prevContext = context.prevContext;
    if (!prevContext) return true;

    return v.every(function (v1: any) {
        return prevContext.fn(prevContext, v1);
    });
}

function isArrayMessage(context: IParamContext, v: any) {
    var arrayDescr = context.mustNotBeEmpty ? "a nonEmpty array" : "an array";
    var prevContext = context.prevContext;
    var element = prevContext ? " where each element " + getMessage(prevContext, v) : "";
    return " must be " + arrayDescr + element;
}

function getMessage(context: IParamContext, v: any) {
    var msg = context.msg;
    if (typeof (msg) === "function") {
        msg = (<any>msg)(context, v);
    }
    return msg;
}

function addContext(that: Param, context: IParamContext) {
    if (that._context) {
        var curContext = that._context;

        while (curContext.prevContext != null) {
            curContext = curContext.prevContext;
        }

        if (curContext.prevContext === null) {
            curContext.prevContext = context;
            // just update the prevContext but don't change the curContext.
            return that;
        } else if (context.prevContext == null) {
            context.prevContext = that._context;
        } else {
            throw new Error("Illegal construction - use 'or' to combine checks");
        }
    }
    return setContext(that, context);
}

function setContext(that: Param, context: IParamContext) {
    that._contexts[that._contexts.length - 1] = context;
    that._context = context;
    return that;
}


function exec(self: Param) {
    // clear off last one if null
    var contexts = self._contexts;
    if (contexts[contexts.length - 1] == null) {
        contexts.pop();
    }
    if (contexts.length === 0) {
        return undefined;
    }
    return contexts.some(function (context: IParamContext) {
        return context.fn(context, self.v);
    });
}

function throwConfigError(instance: any, message: string) {
    throw new Error(__formatString("Error configuring an instance of '%1'. %2", (instance && instance._$typeName) || "object", message));
}

class Param {
    // The %1 parameter
    // is required
    // must be a %2
    // must be an instance of %2
    // must be an instance of the %2 enumeration
    // must have a %2 property
    // must be an array where each element
    // is optional or

    v: any;
    name: string;
    _context: IParamContext;
    _contexts: IParamContext[];
    defaultValue: any;
    parent: ConfigParam;

    constructor(v: any, name: string) {
        this.v = v;
        this.name = name;
        this._contexts = [null];
    }

    isObject(): Param {
        return this.isTypeOf('object');
    }

    isBoolean(): Param {
        return this.isTypeOf('boolean');
    }

    isString(): Param {
        return this.isTypeOf('string');
    }

    isNumber(): Param {
        return this.isTypeOf('number');
    }

    isFunction(): Param {
        return this.isTypeOf('function');
    }

    isNonEmptyString(): Param {
        return addContext(this, {
            fn: isNonEmptyString,
            msg: "must be a nonEmpty string"
        });
    };


    isTypeOf(typeName: string): Param {
        return addContext(this, {
            fn: isTypeOf,
            typeName: typeName,
            msg: "must be a '" + typeName + "'"
        });
    };

    isInstanceOf(type: any, typeName: string): Param {
        typeName = typeName || type.prototype._$typeName;
        return addContext(this, {
            fn: isInstanceOf,
            type: type,
            typeName: typeName,
            msg: "must be an instance of '" + typeName + "'"
        });
    };


    hasProperty(propertyName: string): Param {
        return addContext(this, {
            fn: hasProperty,
            propertyName: propertyName,
            msg: "must have a '" + propertyName + "' property"
        });
    };


    isEnumOf(enumType: any): Param {
        return addContext(this, {
            fn: isEnumOf,
            enumType: enumType,
            msg: "must be an instance of the '" + enumType.name + "' enumeration"
        });
    };

    isRequired(allowNull: boolean): Param {
        return addContext(this, {
            fn: isRequired,
            allowNull: allowNull,
            msg: "is required"
        });
    };

    isOptional(): Param {
        var context = {
            fn: isOptional,
            prevContext: <any>null,
            msg: isOptionalMessage
        };
        return addContext(this, context);
    };

    isNonEmptyArray(): Param {
        return this.isArray(true);
    };

    isArray(mustNotBeEmpty?: boolean): Param {
        var context = {
            fn: isArray,
            mustNotBeEmpty: mustNotBeEmpty,
            prevContext: <any>null,
            msg: isArrayMessage
        };
        return addContext(this, context);
    };

    or() {
        this._contexts.push(null);
        this._context = null;
        return this;
    };

    check(defaultValue?: any) {
        var ok = exec(this);
        if (ok === undefined) return;
        if (!ok) {
            throw new Error(this.getMessage());
        }

        if (this.v !== undefined) {
            return this.v;
        } else {
            return defaultValue;
        }
    };

    // called from outside this file.
    _addContext(context: IParamContext) {
        return addContext(this, context);
    };



    getMessage() {
        var that = this;
        var message = this._contexts.map(function (context) {
            return getMessage(context, that.v);
        }).join(", or it ");
        return __formatString(this.MESSAGE_PREFIX, this.name) + " " + message;
    };

    withDefault(defaultValue: any) {
        this.defaultValue = defaultValue;
        return this;
    };

    whereParam(propName: string) {
        return this.parent.whereParam(propName);
    };

    applyAll(instance: any, checkOnly: boolean) {
        var parentTypeName = instance._$typeName;
        var allowUnknownProperty = (parentTypeName && this.parent.config._$typeName === parentTypeName);

        var clone = __extend({}, this.parent.config);
        this.parent.params.forEach(function (p) {
            if (!allowUnknownProperty) delete clone[p.name];
            try {
                p.check();
            } catch (e) {
                throwConfigError(instance, e.message);
            }
            (!checkOnly) && p._applyOne(instance);
        });
        // should be no properties left in the clone
        if (!allowUnknownProperty) {
            for (var key in clone) {
                // allow props with an undefined value
                if (clone[key] !== undefined) {
                    throwConfigError(instance, __formatString("Unknown property: '%1'.", key));
                }
            }
        }
    };

    _applyOne = function (instance: any) {
        if (this.v !== undefined) {
            instance[this.name] = this.v;
        } else {
            if (this.defaultValue !== undefined) {
                instance[this.name] = this.defaultValue;
            }
        }
    };

    MESSAGE_PREFIX = "The '%1' parameter ";

}

var assertParam = function (v: any, name: string) {
    return new Param(v, name);
};

class ConfigParam {
    config: any;
    params: Param[];
    constructor(config: any) {
        if (typeof (config) !== "object") {
            throw new Error("Configuration parameter should be an object, instead it is a: " + typeof (config));
        }
        this.config = config;
        this.params = [];
    }

    whereParam(propName: string) {
        var param = new Param(this.config[propName], propName);
        param.parent = this;
        this.params.push(param);
        return param;
    }
}

var assertConfig = function (config: any) {
    return new ConfigParam(config);
};

// Param is exposed so that additional 'is' methods can be added to the prototype.
core.Param = Param;
core.assertParam = assertParam;
core.assertConfig = assertConfig;



