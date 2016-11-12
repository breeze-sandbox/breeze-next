import { BreezeEnum} from './enum';

export class EntityAction extends BreezeEnum {

  // Attach - Entity was attached via an AttachEntity call.
  static Attach = new EntityAction( { _isAttach: true });
  // AttachOnQuery - Entity was attached as a result of a query.
  static AttachOnQuery = new EntityAction({ _isAttach: true});
  // AttachOnImport - Entity was attached as a result of an import.
  static AttachOnImport = new EntityAction({ _isAttach: true});

  static Detach = new EntityAction( { _isDetach: true });

  // MergeOnQuery - Properties on the entity were merged as a result of a query.
  static MergeOnQuery = new EntityAction({ _isModification: true });
  // MergeOnImport - Properties on the entity were merged as a result of an import.
  static MergeOnImport = new EntityAction({ _isModification: true });
  // MergeOnSave - Properties on the entity were merged as a result of a save
  static MergeOnSave = new EntityAction({ _isModification: true });


  // PropertyChange - A property on the entity was changed.
  static PropertyChange = new EntityAction({ _isModification: true});

  // EntityStateChange - The EntityState of the entity was changed.
  static EntityStateChange = new EntityAction();

  // AcceptChanges - AcceptChanges was called on the entity, or its entityState was set to Unmodified.
  static AcceptChanges = new EntityAction();
  // RejectChanges - RejectChanges was called on the entity.
  static RejectChanges = new EntityAction({ _isModification: true});

  // Clear - The EntityManager was cleared.  All entities detached.
  static Clear = new EntityAction({ _isDetach: true});

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
}

EntityAction.resolveSymbols();



