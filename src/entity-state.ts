import { BreezeEnum } from './enum';

/**
EntityState is an 'Enum' containing all of the valid states for an 'Entity'.

**/
export class EntityState extends BreezeEnum {

  /**
  The 'Unchanged' state.
  **/
  static Unchanged = new EntityState();
  /**
  The 'Added' state.
  **/
  static Added = new EntityState();
  /**
  The 'Modified' state.
  **/
  static Modified = new EntityState();
  /**
  The 'Deleted' state.
  **/
  static Deleted = new EntityState();
  /**
  The 'Detached' state.
  **/
  static Detached = new EntityState();

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

EntityState.resolveSymbols();


