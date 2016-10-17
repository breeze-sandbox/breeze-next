import { breeze } from './core-fns';
import { EnumSymbol, TypedEnum } from './enum';

export class EntityStateSymbol extends EnumSymbol {
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isUnchanged();
    is the same as
    @example
        return es === EntityState.Unchanged;
    @method isUnchanged
    @return {Boolean} Whether an entityState instance is EntityState.Unchanged.
    **/
    isUnchanged() {
      return this === EntityState.Unchanged;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isAdded();
    is the same as
    @example
        return es === EntityState.Added;
    @method isAdded
    @return {Boolean} Whether an entityState instance is EntityState.Added.
    **/
    isAdded() {
      return this === EntityState.Added;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isModified();
    is the same as
    @example
        return es === EntityState.Modified;
    @method isModified
    @return {Boolean} Whether an entityState instance is EntityState.Modified.
    **/
    isModified() {
      return this === EntityState.Modified;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isDeleted();
    is the same as
    @example
        return es === EntityState.Deleted;
    @method isDeleted
    @return  {Boolean} Whether an entityState instance is EntityState.Deleted.
    **/
    isDeleted() {
      return this === EntityState.Deleted;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isDetached();
    is the same as
    @example
        return es === EntityState.Detached;
    @method isDetached
    @return  {Boolean} Whether an entityState instance is EntityState.Detached.
    **/
    isDetached() {
      return this === EntityState.Detached;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isUnchangedOrModified();
    is the same as
    @example
        return es === EntityState.Unchanged || es === EntityState.Modified
    @method isUnchangedOrModified
    @return {Boolean} Whether an entityState instance is EntityState.Unchanged or EntityState.Modified.
    **/
    isUnchangedOrModified() {
      return this === EntityState.Unchanged || this === EntityState.Modified;
    }
    /**
    @example
        var es = anEntity.entityAspect.entityState;
        return es.isAddedModifiedOrDeleted();
    is the same as
    @example
        return es === EntityState.Added || es === EntityState.Modified || es === EntityState.Deleted
    @method isAddedModifiedOrDeleted
    @return {Boolean} Whether an entityState instance is EntityState.Added or EntityState.Modified or EntityState.Deleted.
    **/
    isAddedModifiedOrDeleted() {
      return this === EntityState.Added ||
          this === EntityState.Modified ||
          this === EntityState.Deleted;
    }

}

class EntityStateEnum extends TypedEnum<EntityStateSymbol> {
  /**
  EntityState is an 'Enum' containing all of the valid states for an 'Entity'.

  @class EntityState
  @static
  **/
  constructor() {
      super("EntityState", EntityStateSymbol);
      this.resolveSymbols();
  }

  /**
  The 'Unchanged' state.

  @property Unchanged {EntityState}
  @final
  @static
  **/
  Unchanged = this.addSymbol();
  /**
  The 'Added' state.

  @property Added {EntityState}
  @final
  @static
  **/
  Added = this.addSymbol();
  /**
  The 'Modified' state.

  @property Modified {EntityState}
  @final
  @static
  **/
  Modified = this.addSymbol();
  /**
  The 'Deleted' state.

  @property Deleted {EntityState}
  @final
  @static
  **/
  Deleted = this.addSymbol();
  /**
  The 'Detached' state.

  @property Detached {EntityState}
  @final
  @static
  **/
  Detached = this.addSymbol();

}

export const EntityState = new EntityStateEnum();
breeze.EntityState = EntityState;
