import { EnumSymbol, TypedEnum } from './enum';

export class EntityActionSymbol extends EnumSymbol {
  _isAttach?: boolean;
  _isDetach?: boolean;
  _isModification: boolean;
  isAttach() {
    return !!this._isAttach;
  }
  isDetach() {
    return !!this._isDetach;
  }
  isModification() {
    return !!this._isModification;
  }
};

export class EntityAction extends TypedEnum<EntityActionSymbol> {
  static instance = new EntityAction();
  constructor() {
    super("EntityAction", EntityActionSymbol);
  }
  // Attach - Entity was attached via an AttachEntity call.
  static Attach = EntityAction.instance.addSymbol( { _isAttach: true });
  // AttachOnQuery - Entity was attached as a result of a query.
  static AttachOnQuery = EntityAction.instance.addSymbol({ _isAttach: true});
  // AttachOnImport - Entity was attached as a result of an import.
  static AttachOnImport = EntityAction.instance.addSymbol({ _isAttach: true});

  static Detach = EntityAction.instance.addSymbol( { _isDetach: true });

  // MergeOnQuery - Properties on the entity were merged as a result of a query.
  static MergeOnQuery = EntityAction.instance.addSymbol({ _isModification: true });
  // MergeOnImport - Properties on the entity were merged as a result of an import.
  static MergeOnImport = EntityAction.instance.addSymbol({ _isModification: true });
  // MergeOnSave - Properties on the entity were merged as a result of a save
  static MergeOnSave = EntityAction.instance.addSymbol({ _isModification: true });


  // PropertyChange - A property on the entity was changed.
  static PropertyChange = EntityAction.instance.addSymbol({ _isModification: true});

  // EntityStateChange - The EntityState of the entity was changed.
  static EntityStateChange = EntityAction.instance.addSymbol();

  // AcceptChanges - AcceptChanges was called on the entity, or its entityState was set to Unmodified.
  static AcceptChanges = EntityAction.instance.addSymbol();
  // RejectChanges - RejectChanges was called on the entity.
  static RejectChanges = EntityAction.instance.addSymbol({ _isModification: true});

  // Clear - The EntityManager was cleared.  All entities detached.
  static Clear = EntityAction.instance.addSymbol({ _isDetach: true});
}

EntityAction.instance.resolveSymbols();



