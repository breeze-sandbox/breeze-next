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
      EntityState.prototype.name;
    return this === EntityState.Added ||
      this === EntityState.Modified ||
      this === EntityState.Deleted;
  }

}

/**
EntityState is an 'Enum' containing all of the valid states for an 'Entity'.

**/
export class EntityState extends TypedEnum<EntityStateSymbol> {

  /** @hidden  **/
  static instance = new EntityState();

  /** @hidden **/
  constructor() {
    super("EntityState", EntityStateSymbol);
  }

  /**
  The 'Unchanged' state.
  **/
  static Unchanged = EntityState.instance.addSymbol();
  /**
  The 'Added' state.
  **/
  static Added = EntityState.instance.addSymbol();
  /**
  The 'Modified' state.
  **/
  static Modified = EntityState.instance.addSymbol();
  /**
  The 'Deleted' state.
  **/
  static Deleted = EntityState.instance.addSymbol();
  /**
  The 'Detached' state.
  **/
  static Detached = EntityState.instance.addSymbol();

}

EntityState.instance.resolveSymbols();


