import { breeze } from './core-fns';
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

class EntityActionEnum extends TypedEnum<EntityActionSymbol> {
  constructor() {
    super("EntityAction", EntityActionSymbol);
    this.resolveSymbols();
  }
  // Attach - Entity was attached via an AttachEntity call.
  Attach = this.addSymbol( { _isAttach: true });
  // AttachOnQuery - Entity was attached as a result of a query.
  AttachOnQuery = this.addSymbol({ _isAttach: true});
  // AttachOnImport - Entity was attached as a result of an import.
  AttachOnImport = this.addSymbol({ _isAttach: true});

  Detach = this.addSymbol( { _isDetach: true });

  // MergeOnQuery - Properties on the entity were merged as a result of a query.
  MergeOnQuery = this.addSymbol({ _isModification: true });
  // MergeOnImport - Properties on the entity were merged as a result of an import.
  MergeOnImport = this.addSymbol({ _isModification: true });
  // MergeOnSave - Properties on the entity were merged as a result of a save
  MergeOnSave = this.addSymbol({ _isModification: true });


  // PropertyChange - A property on the entity was changed.
  PropertyChange = this.addSymbol({ _isModification: true});

  // EntityStateChange - The EntityState of the entity was changed.
  EntityStateChange = this.addSymbol();

  // AcceptChanges - AcceptChanges was called on the entity, or its entityState was set to Unmodified.
  AcceptChanges = this.addSymbol();
  // RejectChanges - RejectChanges was called on the entity.
  RejectChanges = this.addSymbol({ _isModification: true});

  // Clear - The EntityManager was cleared.  All entities detached.
  Clear = this.addSymbol({ _isDetach: true});
}

export const EntityAction = new EntityActionEnum();
breeze.EntityAction = EntityAction;

