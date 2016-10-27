import { MappingContext } from './mapping-context';
import { EntityQuery } from './entity-query';
import { MetadataStore } from './entity-metadata';
import { JsonResultsAdapter, DataService } from './data-service';
import { IEntity } from './entity-aspect';
import { ISaveContext, ISaveBundle, ISaveResult } from './entity-manager';
import { IBaseAdapter  } from './config';

// This module describes the interfaceRegistry by extending config
declare module "./config" {
    interface IInterfaceRegistry {
      ajax: InterfaceDef<IAjaxAdapter>;
      modelLibrary: InterfaceDef<IModelLibraryAdapter>;
      dataService: InterfaceDef<IDataServiceAdapter>;
      uriBuilder: InterfaceDef<IUriBuilderAdapter>;
    }
}


export interface IAjaxAdapter extends IBaseAdapter {
    ajax(config: any): void;
}

export interface IModelLibraryAdapter extends IBaseAdapter {
    startTracking(entity: any, entityCtor: Function): void;
    initializeEntityPrototype(proto: Object): void;
    createCtor?: Function;
    getTrackablePropertyNames: (entity: any) => string[];
}

export interface IDataServiceAdapter extends IBaseAdapter {
    fetchMetadata(metadataStore: MetadataStore, dataService: DataService): Promise<any>;  // result of Promise is either rawMetadata or a string explaining why not.
    executeQuery(mappingContext: MappingContext): any;   // result of executeQuery will get passed to JsonResultsAdapter extractResults method
    saveChanges(saveContext: any, saveBundle: any): Promise<ISaveResult>;
    changeRequestInterceptor: IChangeRequestInterceptorCtor;
    jsonResultsAdapter: JsonResultsAdapter;
}



export interface IUriBuilderAdapter extends IBaseAdapter {
    buildUri(query: EntityQuery, metadataStore: MetadataStore ): string;
}

// -----------------------------------

export interface IChangeRequestInterceptorCtor {
  new (saveContext: ISaveContext, saveBundle: ISaveBundle): IChangeRequestInterceptor;
}

export interface IChangeRequestInterceptor {
    oneTime?: boolean;
  /**
   Prepare and return the save data for an entity change-set.

   The adapter calls this method for each entity in the change-set,
   after it has prepared a "change request" for that object.

   The method can do anything to the request but it must return a valid, non-null request.
   @example
   this.getRequest = function (request, entity, index) {
          // alter the request that the adapter prepared for this entity
          // based on the entity, saveContext, and saveBundle
          // e.g., add a custom header or prune the originalValuesMap
          return request;
      };
   @method getRequest
   @param request {Object} The object representing the adapter's request to save this entity.
   @param entity {Entity} The entity-to-be-save as it is in cache
   @param index {Integer} The zero-based index of this entity in the change-set array
   @return {Function} The potentially revised request.
   **/
  getRequest(request: any, entity: IEntity, index: number): any;

  /**
   Last chance to change anything about the 'requests' array
   after it has been built with requests for all of the entities-to-be-saved.

   The 'requests' array is the same as 'saveBundle.entities' in many implementations

   This method can do anything to the array including add and remove requests.
   It's up to you to ensure that server will accept the requests array data as valid.

   Returned value is ignored.
   @example
   this.done = function (requests) {
          // alter the array of requests representing the entire change-set
          // based on the saveContext and saveBundle
      };
   @method done
   @param requests {Array of Object} The adapter's array of request for this changeset.
   **/
  done(requests: Object[]): void;
}