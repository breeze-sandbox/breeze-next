﻿import { core } from './core-fns';
import { BreezeEvent } from './event';
import { EntityAspect } from './entity-aspect';
import { DataProperty } from './entity-metadata';

export interface IObservableArray {
  push: (...args: any[]) => number;
  _push: (...args: any[]) => number;
  unshift: (...args: any[]) =>  number;
  pop: () => any;
  shift: () => any;
  splice: (...args: any[]) => any[];
  slice: (a: number, b?: number) => any[]; // implemented on the native array

  getEntityAspect: () => EntityAspect;
  arrayChanged: BreezeEvent;
  parent?: Object;
  parentProperty?: DataProperty; // TODO: IProperty 
  _getEventParent: () => Object;
  _getPendingPubs: () => any[]; // TODO: Pub[]
  _beforeChange: () => void;
  _processAdds(items: any[]): void;
  _processRemoves(items: any[]): void;
  _origValues: any[];
  _pendingArgs: any;
}

let mixin = {
  push: (...args: any[]) => {
    if (this._inProgress) {
      return -1;
    }

    let goodAdds = this._getGoodAdds(args);
    if (!goodAdds.length) {
      return this.length;
    }
    this._beforeChange();
    let result = Array.prototype.push.apply(this, goodAdds);
    processAdds(this, goodAdds);
    return result;
  },

  _push: (...args: any[]) => {
    if (this._inProgress) {
      return -1;
    }
    let goodAdds = args;
    this._beforeChange();
    let result = Array.prototype.push.apply(this, goodAdds);
    processAdds(this, goodAdds);
    return result;
  },

  unshift: (...args: any[]) =>  {
    let goodAdds = this._getGoodAdds(args);
    if (!goodAdds.length) {
      return this.length;
    }
    this._beforeChange();
    let result = Array.prototype.unshift.apply(this, goodAdds);
    processAdds(this, goodAdds);
    return result;
  },

  pop: () => {
    this._beforeChange();
    let result = Array.prototype.pop.apply(this);
    processRemoves(this, [result]);
    return result;
  },

  shift: () => {
    this._beforeChange();
    let result = Array.prototype.shift.apply(this);
    processRemoves(this, [result]);
    return result;
  },

  splice: (...args: any[]) => {
    let goodAdds = this._getGoodAdds(core.arraySlice(args, 2));
    let newArgs = core.arraySlice(args, 0, 2).concat(goodAdds);
    this._beforeChange();
    let result = Array.prototype.splice.apply(this, newArgs);
    processRemoves(this, result);

    if (goodAdds.length) {
      processAdds(this, goodAdds);
    }
    return result;
  },

  getEntityAspect: () => {
    return this.parent.entityAspect || this.parent.complexAspect.getEntityAspect();
  },

  _getEventParent: () => {
    return this.getEntityAspect();
  },

  _getPendingPubs: function () {
    let em = this.getEntityAspect().entityManager;
    return em && em._pendingPubs;
  },

  _beforeChange:  function () {
    // default is to do nothing
  }
};

function updateEntityState(obsArray: IObservableArray) {
  let entityAspect = obsArray.getEntityAspect();
  if (entityAspect.entityState.isUnchanged()) {
    entityAspect.setModified();
  }
  if (entityAspect.entityState.isModified() && !obsArray._origValues) {
    obsArray._origValues = obsArray.slice(0);
  }
}

function publish(publisher: IObservableArray, eventName: string, eventArgs: any) {
  let pendingPubs = publisher._getPendingPubs();
  if (pendingPubs) {
    if (!publisher._pendingArgs) {
      publisher._pendingArgs = eventArgs;
      pendingPubs.push(function () {
        publisher[eventName].publish(publisher._pendingArgs);
        publisher._pendingArgs = null;
      });
    } else {
      combineArgs(publisher._pendingArgs, eventArgs);
    }
  } else {
    publisher[eventName].publish(eventArgs);
  }
}

function initializeParent(obsArray: IObservableArray, parent: Object, parentProperty: DataProperty) {
  obsArray.parent = parent;
  obsArray.parentProperty = parentProperty;
}

function processAdds(obsArray: IObservableArray, adds: any[]) {
  obsArray._processAdds(adds);
  // this is referencing the name of the method on the complexArray not the name of the event
  //var args = { added: adds };
  //args[obsArray._typeName] = obsArray;
  publish(obsArray, "arrayChanged", { array: obsArray, added: adds });
}

function processRemoves(obsArray: IObservableArray, removes: any[]) {
  obsArray._processRemoves(removes);
  // this is referencing the name of the method on the array not the name of the event
  publish(obsArray, "arrayChanged", { array: obsArray, removed: removes });
}

// TODO: see if this function already exists in core and can be imported.
function combineArgs(target: Object, source: Object) {
  for (let key in source) {
    if (key !== "array" && target.hasOwnProperty(key)) {
      let sourceValue = source[key];
      let targetValue = target[key];
      if (targetValue) {
        if (!Array.isArray(targetValue)) {
          throw new Error("Cannot combine non array args");
        }
        Array.prototype.push.apply(targetValue, sourceValue);
      } else {
        target[key] = sourceValue;
      }
    }
  }
}

export const observableArray = {
  mixin: mixin,
  updateEntityState: updateEntityState,
  publish: publish,
  initializeParent: initializeParent
};
