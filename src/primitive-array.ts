import { breeze, core  } from './core-fns';
import { IObservableArray, observableArray } from './observable-array';
import { BreezeEvent } from './event';
import { IStructuralObject } from './entity-aspect';
import { DataProperty } from './entity-metadata';

// TODO: mixin impl is not very typesafe

interface IPrimitiveArray extends IObservableArray {
  [index: number]: any;
  parent: IStructuralObject | null;
  parentProperty: DataProperty | null;
}

let primitiveArrayMixin = {

  // complexArray will have the following props
  //    parent
  //    propertyPath
  //    parentProperty
  //    addedItems  - only if modified
  //    removedItems  - only if modified
  //  each complexAspect of any entity within a complexArray
  //  will have its own _complexState = "A/M";

  /**
  Primitive arrays are not actually classes, they are objects that mimic arrays. A primitive array is collection of
  primitive types associated with a data property on a single entity or complex object. i.e. customer.invoiceNumbers.
  This collection looks like an array in that the basic methods on arrays such as 'push', 'pop', 'shift', 'unshift', 'splice'
  are all provided as well as several special purpose methods.
  @class {primitiveArray}
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
          let addedEntities = arrayChangedArgs.added;
          let removedEntities = arrayChanged.removed;
      });
  @event arrayChanged
  @param added {Array of Primitives} An array of all of the items added to this collection.
  @param removed {Array of Primitives} An array of all of the items removed from this collection.
  @readOnly
  **/

    // virtual impls
  _getGoodAdds:  (adds: any[]) => {
    return adds;
  },

  _beforeChange: () => {
    let entityAspect = this.getEntityAspect();
    if (entityAspect.entityState.isUnchanged()) {
      entityAspect.setModified();
    }
    if (entityAspect.entityState.isModified() && !this._origValues) {
      this._origValues = this.slice(0);
    }
  },

  _processAdds: (adds: any[]) => {
    // nothing needed
  },

  _processRemoves: (removes: any[]) => {
    // nothing needed;
  },


  _rejectChanges: () => {
    if (!this._origValues) return;
    this.length = 0;
    Array.prototype.push.apply(this, this._origValues);
  },

  _acceptChanges: () => {
    this._origValues = null;
  }
};
  // local functions

export function makePrimitiveArray(arr: IObservableArray, parent: IStructuralObject, parentProperty: DataProperty) {

  observableArray.initializeParent(arr, parent, parentProperty);
  arr.arrayChanged = new BreezeEvent("arrayChanged", arr);
  core.extend(arr, observableArray.mixin);
  return core.extend(arr, primitiveArrayMixin);
}

