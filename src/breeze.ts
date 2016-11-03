import { BreezeEvent } from './event';
import { AbstractDataServiceAdapter} from './abstract-data-service-adapter';
import { DataService, JsonResultsAdapter, INodeContext } from './data-service';
import { DataType, DataTypeSymbol } from './data-type';
import { EntityAction, EntityActionSymbol } from './entity-action';
import { EntityAspect, ComplexAspect, IEntity, IStructuralObject } from './entity-aspect';
import { EntityKey } from './entity-key';
import { EntityManager, ISaveContext, ISaveBundle, IHttpResponse, IKeyMapping, IServerError, ISaveResult } from './entity-manager';
import { EntityQuery, FilterQueryOp, BooleanQueryOp, OrderByClause, ExpandClause, SelectClause } from './entity-query';
import { EntityState, EntityStateSymbol } from './entity-state';
import { IAjaxAdapter, IDataServiceAdapter, IModelLibraryAdapter, IChangeRequestInterceptor, IUriBuilderAdapter, IInterfaceRegistryConfig } from './interface-registry';
import { KeyGenerator } from './key-generator';
import { LocalQueryComparisonOptions } from './local-query-comparison-options';
import { MappingContext } from './mapping-context';
import { MetadataStore, EntityType, ComplexType, StructuralType, DataProperty, EntityProperty, NavigationProperty, AutoGeneratedKeyType   } from './entity-metadata';
import { NamingConvention } from './naming-convention';
import { Predicate, IVisitContext, IVisitor, IExpressionContext, UnaryPredicate, BinaryPredicate, AnyAllPredicate, AndOrPredicate, LitExpr, FnExpr, PropExpr } from './predicate';
import { QueryOptions,  FetchStrategy, MergeStrategy } from './query-options';
import { SaveOptions } from './save-options';
import { ValidationError, Validator } from './validate';
import { ValidationOptions } from './validation-options';
import { assertParam, assertConfig, Param } from './assert-param';
import { config, IBaseAdapter } from './config';
import { core } from './core';
import { makeRelationArray, makePrimitiveArray, makeComplexArray } from './array';

export {
  AbstractDataServiceAdapter,
  AndOrPredicate,
  AnyAllPredicate,
  AutoGeneratedKeyType,
  BinaryPredicate,
  // BreezeEvent, TODO: not needed here - exposed on breeze obj
  ComplexAspect,
  ComplexType,
  DataProperty,
  DataService,
  DataType,
  DataTypeSymbol,
  EntityAction,
  EntityActionSymbol,
  EntityAspect,
  EntityKey,
  EntityManager,
  EntityProperty,
  EntityQuery,
  EntityState,
  EntityStateSymbol,
  EntityType,
  ExpandClause,
  FetchStrategy,
  FilterQueryOp,
  FnExpr,
  IAjaxAdapter,
  IBaseAdapter,
  IChangeRequestInterceptor,
  IDataServiceAdapter,
  IEntity,
  IExpressionContext,
  IHttpResponse,
  IKeyMapping,
  IModelLibraryAdapter,
  IInterfaceRegistryConfig,
  INodeContext,
  ISaveBundle,
  ISaveContext,
  ISaveResult,
  IServerError,
  IStructuralObject,
  IUriBuilderAdapter,
  IVisitContext,
  IVisitor,
  JsonResultsAdapter,
  KeyGenerator,
  LitExpr,
  LocalQueryComparisonOptions,
  MappingContext,
  MergeStrategy,
  MetadataStore,
  NamingConvention,
  NavigationProperty,
  OrderByClause,
  Param,
  Predicate,
  PropExpr,
  QueryOptions,
  SaveOptions,
  SelectClause,
  StructuralType,
  UnaryPredicate,
  Validator,
  ValidationError,
  ValidationOptions,
  assertConfig,
  assertParam,
  config,
  core,
  makeComplexArray,
  makePrimitiveArray,
  makeRelationArray,
}

// create a breeze variable here
export const breeze = {
  AutoGeneratedKeyType: AutoGeneratedKeyType,
  ComplexAspect: ComplexAspect,
  ComplexType: ComplexType,
  DataProperty: DataProperty,
  DataService: DataService,
  DataType: DataType,
  DataTypeSymbol: DataTypeSymbol,
  EntityAction: EntityAction,
  EntityActionSymbol: EntityActionSymbol,
  EntityAspect: EntityAspect,
  EntityKey: EntityKey,
  EntityManager: EntityManager,
  EntityQuery: EntityQuery,
  EntityState: EntityState,
  EntityStateSymbol: EntityStateSymbol,
  EntityType: EntityType,
  Event: BreezeEvent,
  FetchStrategy: FetchStrategy,
  FilterQueryOp: FilterQueryOp,
  BooleanQueryOp: BooleanQueryOp,
  JsonResultsAdapter: JsonResultsAdapter,
  KeyGenerator: KeyGenerator,
  LocalQueryComparisonOptions: LocalQueryComparisonOptions,
  MergeStrategy: MergeStrategy,
  MetadataStore: MetadataStore,
  NamingConvention: NamingConvention,
  NavigationProperty: NavigationProperty,
  OrderByClause: OrderByClause, // for testing only
  Predicate: Predicate,
  QueryOptions: QueryOptions,
  SaveOptions: SaveOptions,
  ValidationError: ValidationError,
  ValidationOptions: ValidationOptions,
  Validator,
  core: core,
  config: config,
  assertConfig: assertConfig,
  assertParam: assertParam,
  makeRelationArray: makeRelationArray,
  makeComplexArray: makeComplexArray,
  makePrimitiveArray: makePrimitiveArray
};

declare var window: any;
declare var global: any;
let win = window || (global ? global.window : undefined);
if (win) {
  win.breeze = breeze;
}
