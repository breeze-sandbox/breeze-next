import { core } from './core';
import { assertParam } from './assert-param';

function publishCore<T>(that: BreezeEvent<T>, data: T, errorCallback?: (e: Error) => any) {
    let subscribers = that._subscribers;
    if (!subscribers) return true;
    // subscribers from outer scope.
    subscribers.forEach(function (s) {
        try {
            s.callback(data);
        } catch (e) {
            e.context = "unable to publish on topic: " + that.name;
            if (errorCallback) {
                errorCallback(e);
            } else if (that._defaultErrorCallback) {
                that._defaultErrorCallback(e);
            } else {
                fallbackErrorHandler(e);
            }
        }
    });
}

function fallbackErrorHandler(e: Error) {
    // TODO: maybe log this
    // for now do nothing;
}


interface ISubscription {
    unsubKey: number;
    callback: (data: any) => any;
}
/**
Class to support basic event publication and subscription semantics.
@class Event
**/
export class BreezeEvent<T> {

    static __eventNameMap = {};
    static __nextUnsubKey = 1;
    name: string;
    publisher: Object;
    _subscribers: ISubscription[];
    _defaultErrorCallback: (e: Error) => any;


    /**
    Constructor for an Event
    @example
        salaryEvent = new Event("salaryEvent", person);
    @method <ctor> Event
    @param name {String}
    @param publisher {Object} The object that will be doing the publication. i.e. the object to which this event is attached.
    @param [defaultErrorCallback] {Function} If omitted then subscriber notification failures will be ignored.

    errorCallback([e])
    @param [defaultErrorCallback.e] {Error} Any error encountered during subscription execution.
    **/
    constructor(name: string, publisher: Object, defaultErrorCallback?: (e: Error) => any) {
        assertParam(name, "eventName").isNonEmptyString().check();
        assertParam(publisher, "publisher").isObject().check();

        this.name = name;
        // register the name
        BreezeEvent.__eventNameMap[name] = true;
        this.publisher = publisher;
        if (defaultErrorCallback) {
            this._defaultErrorCallback = defaultErrorCallback;
        }
    }

    /**
    Publish data for this event.
    @example
        // Assume 'salaryEvent' is previously constructed Event
        salaryEvent.publish( { eventType: "payRaise", amount: 100 });
    This event can also be published asychronously
    @example
        salaryEvent.publish( { eventType: "payRaise", amount: 100 }, true);
    And we can add a handler in case the subscriber 'mishandles' the event.
    @example
        salaryEvent.publish( { eventType: "payRaise", amount: 100 }, true, function(error) {
            // do something with the 'error' object
        });
    @method publish
    @param data {Object} Data to publish
    @param [publishAsync=false] {Boolean} Whether to publish asynchonously or not.
    @param [errorCallback] {Function} Will be called for any errors that occur during publication. If omitted,
    errors will be eaten.
  
    errorCallback([e])
    @param [errorCallback.e] {Error} Any error encountered during publication execution.
    @return {Boolean} false if event is disabled; true otherwise.
    **/
    publish(data: T, publishAsync: boolean = false, errorCallback?: (e: Error) => any) {

        if (!BreezeEvent._isEnabled(this.name, this.publisher)) return false;

        if (publishAsync === true) {
            setTimeout(publishCore, 0, this, data, errorCallback);
        } else {
            publishCore(this, data, errorCallback);
        }
        return true;
    };

    /**
    Publish data for this event asynchronously.
    @example
        // Assume 'salaryEvent' is previously constructed Event
        salaryEvent.publishAsync( { eventType: "payRaise", amount: 100 });
    And we can add a handler in case the subscriber 'mishandles' the event.
    @example
        salaryEvent.publishAsync( { eventType: "payRaise", amount: 100 }, function(error) {
            // do something with the 'error' object
        });
    @method publishAsync
    @param data {Object} Data to publish
    @param [errorCallback] {Function} Will be called for any errors that occur during publication. If omitted,
    errors will be eaten.
  
    errorCallback([e])
    @param [errorCallback.e] {Error} Any error encountered during publication execution.
    **/
    publishAsync(data: any, errorCallback: (e: Error) => any) {
        this.publish(data, true, errorCallback);
    };

    /**
    Subscribe to this event.
    @example
        // Assume 'salaryEvent' is previously constructed Event
        salaryEvent.subscribe(function (eventArgs) {
            if (eventArgs.eventType === "payRaise") {
                // do something
            }
        });
    There are several built in Breeze events, such as EntityAspect.propertyChanged, EntityAspect.validationErrorsChanged as well.
    @example
        // Assume order is a preexisting 'order' entity
        order.entityAspect.propertyChanged.subscribe(function (pcEvent) {
            if ( pcEvent.propertyName === "OrderDate") {
                // do something
            }
        });
    @method subscribe
    @param [callback] {Function} Will be called whenever 'data' is published for this event.
  
    callback([data])
    @param [callback.data] {Object} Whatever 'data' was published.  This should be documented on the specific event.
    @return {Number} This is a key for 'unsubscription'.  It can be passed to the 'unsubscribe' method.
    **/
    subscribe(callback: (data: any) => any) {
        if (!this._subscribers) {
            this._subscribers = [];
        }

        let unsubKey = BreezeEvent.__nextUnsubKey;
        this._subscribers.push({ unsubKey: unsubKey, callback: callback });
        ++BreezeEvent.__nextUnsubKey;
        return unsubKey;
    };

    /**
    Unsubscribe from this event.
    @example
        // Assume order is a preexisting 'order' entity
        let token = order.entityAspect.propertyChanged.subscribe(function (pcEvent) {
                // do something
        });
        // sometime later
        order.entityAspect.propertyChanged.unsubscribe(token);
    @method unsubscribe
    @param unsubKey {Number} The value returned from the 'subscribe' method may be used to unsubscribe here.
    @return {Boolean} Whether unsubscription occured. This will return false if already unsubscribed or if the key simply
    cannot be found.
    **/
    unsubscribe = function (unsubKey: number) {
        if (!this._subscribers) return false;
        let subs = this._subscribers;
        let ix = core.arrayIndexOf(subs, function (s) {
            return s.unsubKey === unsubKey;
        });
        if (ix !== -1) {
            subs.splice(ix, 1);
            if (subs.length === 0) {
                this._subscribers = null;
            }
            return true;
        } else {
            return false;
        }
    };

    /** remove all subscribers */
    clear() {
        this._subscribers = <any>null;
    };

    /** event bubbling - document later. */
    static bubbleEvent(target: any, getParentFn?: (() => any)) {
        target._getEventParent = getParentFn;
    };

    /**
    Enables or disables the named event for an object and all of its children.
    @example
        Event.enable(“propertyChanged”, myEntityManager, false)
    will disable all EntityAspect.propertyChanged events within a EntityManager.
    @example
        Event.enable(“propertyChanged”, myEntityManager, true)
    will enable all EntityAspect.propertyChanged events within a EntityManager.
    @example
        Event.enable(“propertyChanged”, myEntity.entityAspect, false)
    will disable EntityAspect.propertyChanged events for a specific entity.
    @example
        Event.enable(“propertyChanged”, myEntity.entityAspect, null)
    will removes any enabling / disabling at the entity aspect level so now any 'Event.enable' calls at the EntityManager level,
    made either previously or in the future, will control notification.
    @example
        Event.enable(“validationErrorsChanged”, myEntityManager, function(em) {
            return em.customTag === “blue”;
        })
    will either enable or disable myEntityManager based on the current value of a ‘customTag’ property on myEntityManager.
    Note that this is dynamic, changing the customTag value will cause events to be enabled or disabled immediately.
    @method enable
    @static
    @param eventName {String} The name of the event.
    @param target {Object} The object at which enabling or disabling will occur.  All event notifications that occur to this object or
    children of this object will be enabled or disabled.
    @param isEnabled {Boolean|null|Function} A boolean, a null or a function that returns either a boolean or a null.
    **/
    static enable(eventName: string, obj: Object, isEnabled: boolean) {
        assertParam(eventName, "eventName").isNonEmptyString().check();
        assertParam(obj, "obj").isObject().check();
        assertParam(isEnabled, "isEnabled").isBoolean().isOptional().or().isFunction().check();
        let ob = <any>obj;
        if (!ob._$eventMap) {
            ob._$eventMap = {};
        }
        ob._$eventMap[eventName] = isEnabled;
    };

    /**
    Returns whether for a specific event and a specific object and its children, notification is enabled or disabled or not set.
    @example
        Event.isEnabled(“propertyChanged”, myEntityManager)
  
    @method isEnabled
    @static
    @param eventName {String} The name of the event.
    @param target {Object} The object for which we want to know if notifications are enabled.
    @return {Boolean|null} A null is returned if this value has not been set.
    **/
    static isEnabled(eventName: string, obj: Object) {
        assertParam(eventName, "eventName").isNonEmptyString().check();
        assertParam(obj, "obj").isObject().check();
        // null is ok - it just means that the object is at the top level.
        if ((<any>obj)._getEventParent === undefined) {
            throw new Error("This object does not support event enabling/disabling");
        }
        // return ctor._isEnabled(getFullEventName(eventName), obj);
        return BreezeEvent._isEnabled(eventName, 3);
    };

    static _isEnabled = function (eventName: string, obj: Object) {
        let isEnabled: any = null;
        let ob = <any>obj;
        let eventMap = ob._$eventMap;
        if (eventMap) {
            isEnabled = eventMap[eventName];
        }
        if (isEnabled != null) {
            if (typeof isEnabled === 'function') {
                return isEnabled(obj);
            } else {
                return !!isEnabled;
            }
        } else {
            let parent = ob._getEventParent && ob._getEventParent();
            if (parent) {
                return this._isEnabled(eventName, parent);
            } else {
                // default if not explicitly disabled.
                return true;
            }
        }
    };


}
