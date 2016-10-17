import { breeze, core  } from './core-fns';
import { IObservableArray, observableArray } from './observable-array';
import { BreezeEvent } from './event';
import { IComplexObject, IStructuralObject } from './entity-aspect';
import { DataProperty } from './entity-metadata';

// TODO: mixin impl is not very typesafe

export interface IComplexArray extends IObservableArray {
  [index: number]: IComplexObject;
  parent: IStructuralObject | null;
  parentProperty: DataProperty | null;
}

let complexArrayMixin = {

  // complexArray will have the following props
  //    parent
  //    propertyPath
  //    parentProperty
  //    addedItems  - only if modified
  //    removedItems  - only if modified
  //  each complexAspect of any entity within a complexArray
  //  will have its own _complexState = "A/M";

  /**
   Complex arrays are not actually classes, they are objects that mimic arrays. A complex array is collection of
   complexTypes associated with a data property on a single entity or other complex object. i.e. customer.orders or order.orderDetails.
   This collection looks like an array in that the basic methods on arrays such as 'push', 'pop', 'shift', 'unshift', 'splice'
   are all provided as well as several special purpose methods.
   @class {complexArray}
   **/

  /**
  An {{#crossLink "Event"}}{{/crossLink}} that fires whenever the contents of this array changed.  This event
  is fired any time a new entity is attached or added to the EntityManager and happens to belong to this collection.
  Adds that occur as a result of query or import operations are batched so that all of the adds or removes to any individual
  collections are collected into a single notification event for each relation array.
  @example
      // assume order is an order entity attached to an EntityManager.
      orders.arrayChanged.subscribe(
      function (arrayChangedArgs) {
          var addedEntities = arrayChangedArgs.added;
          var removedEntities = arrayChanged.removed;
      });
  @event arrayChanged
  @param added {Array of Entity} An array of all of the entities added to this collection.
  @param removed {Array of Entity} An array of all of the removed from this collection.
  @readOnly
  **/

    // virtual impls
  _getGoodAdds: (adds: any[]) => {
    return getGoodAdds(this, adds);
  },

  _beforeChange: () => {
    observableArray.updateEntityState(this);
  },

  _processAdds: (adds: any[]) => {
    processAdds(this, adds);
  },

  _processRemoves: (removes: any[]) => {
    processRemoves(this, removes);
  },

  _rejectChanges: () => {
    if (!this._origValues) return;
    let that = this;
    this.forEach(function (co: IComplexObject) {
      clearAspect(co, that);
    });
    this.length = 0;
    this._origValues.forEach(function (co: IComplexObject) {
      that.push(co);
    });
  },

  _acceptChanges: () => {
    this._origValues = null;
  }
};

// local functions


function getGoodAdds(complexArray: IComplexArray, adds: IComplexObject[]) {
  // remove any that are already added here
  return adds.filter(function (a) {
    // return a.parent !== complexArray.parent;  // TODO: check if this is actually a bug in original breezejs ???
    return a.complexAspect == null || a.complexAspect.parent !== complexArray.parent;
  });
}

function processAdds(complexArray: IComplexArray, adds: IComplexObject[]) {
  adds.forEach(function (a) {
    // if (a.parent != null) { // TODO: check if this is actually a bug in original breezejs ???
    if (a.complexAspect && a.complexAspect.parent != null) {
      throw new Error("The complexObject is already attached. Either clone it or remove it from its current owner");
    }
    setAspect(a, complexArray);
  });
}

function processRemoves(complexArray: IComplexArray, removes: IComplexObject[]) {
  removes.forEach(function (a) {
    clearAspect(a, complexArray);
  });
}

function clearAspect(co: IComplexObject, arr: IComplexArray) {
  let coAspect = co.complexAspect;
  // if not already attached - exit
  if (coAspect.parent !== arr.parent) return null;

  coAspect.parent = null;
  coAspect.parentProperty = null;
  return coAspect;
}

function setAspect(co: IComplexObject, arr: IComplexArray) {
  let coAspect = co.complexAspect;
  // if already attached - exit
  if (coAspect.parent === arr.parent) return null;
  coAspect.parent = arr.parent;
  coAspect.parentProperty = arr.parentProperty;

  return coAspect;
}

export function makeComplexArray(arr: IObservableArray, parent: IStructuralObject, parentProperty: DataProperty) {

  observableArray.initializeParent(arr, parent, parentProperty);
  arr.arrayChanged = new BreezeEvent("arrayChanged", arr);
  core.extend(arr, observableArray.mixin);
  return core.extend(arr, complexArrayMixin) as IComplexArray;
}

breeze.makeComplexArray = makeComplexArray; 