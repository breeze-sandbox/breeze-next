import { core } from './core-fns';
import { MetadataStore } from './entity-metadata';

export function parse(metadataStore: MetadataStore, schemas: any, altMetadata: any) {

  metadataStore._entityTypeResourceMap = {};
  schemas = core.toArray(schemas);
  schemas.forEach(function (schema: any) {
    if (schema.cSpaceOSpaceMapping) {
      // Web api only - not avail in OData.
      let mappings = JSON.parse(schema.cSpaceOSpaceMapping);
      let newMap = {};
      mappings.forEach(function (mapping: any) {
        newMap[mapping[0]] = mapping[1];
      });
      schema.cSpaceOSpaceMapping = newMap;
    }

    if (schema.entityContainer) {
      core.toArray(schema.entityContainer).forEach(function (container) {
        core.toArray(container.entitySet).forEach(function (entitySet) {
          let entityTypeName = parseTypeNameWithSchema(entitySet.entityType, schema).typeName;
          metadataStore.setEntityTypeForResourceName(entitySet.name, entityTypeName);
          metadataStore._entityTypeResourceMap[entityTypeName] = entitySet.name;
        });
      });
    }

    // process complextypes before entity types.
    if (schema.complexType) {
      core.toArray(schema.complexType).forEach(function (ct) {
        let complexType = parseCsdlComplexType(ct, schema, metadataStore);
      });
    }
    if (schema.entityType) {
      core.toArray(schema.entityType).forEach(function (et) {
        let entityType = parseCsdlEntityType(et, schema, schemas, metadataStore);

      });
    }

  });
  let badNavProps = metadataStore.getIncompleteNavigationProperties();
  if (badNavProps.length > 0) {
    let msg = badNavProps.map(function (npa) {
      if (Array.isArray(npa)) {
        return npa.map(function (np) {
          return np.parentType.name + ":" + np.name;
        }).join(', ');
      }
      return npa.parentType.name + ":" + npa.name;
    }).join(', ');
    throw new Error("Incomplete navigation properties: " + msg);
  }
  if (altMetadata) {
    metadataStore.importMetadata(altMetadata, true);
  }
  return metadataStore;
}

function parseCsdlEntityType(csdlEntityType: any, schema: any, schemas: any, metadataStore: MetadataStore) {
  let shortName = csdlEntityType.name;
  let ns = getNamespaceFor(shortName, schema);
  let entityType = new EntityType({
    shortName: shortName,
    namespace: ns,
    isAbstract: csdlEntityType.abstract && csdlEntityType.abstract === 'true'
  });
  if (csdlEntityType.baseType) {
    let baseTypeName = parseTypeNameWithSchema(csdlEntityType.baseType, schema).typeName;
    entityType.baseTypeName = baseTypeName;
    let baseEntityType = metadataStore._getEntityType(baseTypeName, true);
    if (baseEntityType) {
      completeParseCsdlEntityType(entityType, csdlEntityType, schema, schemas, metadataStore);
    } else {
      let deferrals = metadataStore._deferredTypes[baseTypeName];
      if (!deferrals) {
        deferrals = [];
        metadataStore._deferredTypes[baseTypeName] = deferrals;
      }
      deferrals.push({ entityType: entityType, csdlEntityType: csdlEntityType });
    }
  } else {
    completeParseCsdlEntityType(entityType, csdlEntityType, schema, schemas, metadataStore);
  }
  // entityType may or may not have been added to the metadataStore at this point.
  return entityType;

}

function completeParseCsdlEntityType(entityType: EntityType, csdlEntityType: any, schema: any, schemas: any, metadataStore: MetadataStore) {
  let keyNamesOnServer = csdlEntityType.key ? core.toArray(csdlEntityType.key.propertyRef).map(core.pluck("name")) : [];

  core.toArray(csdlEntityType.property).forEach(function (prop) {
    parseCsdlDataProperty(entityType, prop, schema, keyNamesOnServer);
  });

  core.toArray(csdlEntityType.navigationProperty).forEach(function (prop) {
    parseCsdlNavProperty(entityType, prop, schema, schemas);
  });

  metadataStore.addEntityType(entityType);
  entityType.defaultResourceName = metadataStore._entityTypeResourceMap[entityType.name];

  let deferredTypes = metadataStore._deferredTypes;
  let deferrals = deferredTypes[entityType.name];
  if (deferrals) {
    deferrals.forEach(function (d) {
      completeParseCsdlEntityType(d.entityType, d.csdlEntityType, schema, schemas, metadataStore);
    });
    delete deferredTypes[entityType.name];
  }

}

function parseCsdlComplexType(csdlComplexType: any, schema: any, metadataStore: MetadataStore) {
  let shortName = csdlComplexType.name;
  let ns = getNamespaceFor(shortName, schema);
  let complexType = new ComplexType({
    shortName: shortName,
    namespace: ns
  });

  core.toArray(csdlComplexType.property).forEach(function (prop) {
    parseCsdlDataProperty(complexType, prop, schema);
  });

  metadataStore.addEntityType(complexType);
  return complexType;
}

function parseCsdlDataProperty(parentType: EntityType | ComplexType, csdlProperty, schema, keyNamesOnServer) {
  let dp: DataProperty;
  let typeParts = csdlProperty.type.split(".");
  // Both tests on typeParts are necessary because of differing metadata conventions for OData and Edmx feeds.
  if (typeParts[0] === "Edm" && typeParts.length === 2) {
    dp = parseCsdlSimpleProperty(parentType, csdlProperty, keyNamesOnServer);
  } else {
    if (isEnumType(csdlProperty, schema)) {
      dp = parseCsdlSimpleProperty(parentType, csdlProperty, keyNamesOnServer);
      if (dp) {
        dp.enumType = csdlProperty.type;
      }
    } else {
      dp = parseCsdlComplexProperty(parentType, csdlProperty, schema);
    }
  }
  if (dp) {
    parentType._addPropertyCore(dp);
    addValidators(dp);
  }
  return dp;
}

function parseCsdlSimpleProperty(parentType: EntityType | ComplexType, csdlProperty, keyNamesOnServer) {
  let dataType = DataType.fromEdmDataType(csdlProperty.type);
  if (dataType == null) {
    parentType.warnings.push("Unable to recognize DataType for property: " + csdlProperty.name + " DateType: " + csdlProperty.type);
    return null;
  }
  let isNullable = csdlProperty.nullable === 'true' || csdlProperty.nullable == null;
  // let fixedLength = csdlProperty.fixedLength ? csdlProperty.fixedLength === true : undefined;
  let isPartOfKey = keyNamesOnServer != null && keyNamesOnServer.indexOf(csdlProperty.name) >= 0;
  if (isPartOfKey && parentType.autoGeneratedKeyType === AutoGeneratedKeyType.None) {
    if (isIdentityProperty(csdlProperty)) {
      parentType.autoGeneratedKeyType = AutoGeneratedKeyType.Identity;
    }
  }
  // TODO: nit - don't set maxLength if null;
  let maxLength = csdlProperty.maxLength;
  maxLength = (maxLength == null || maxLength === "Max") ? null : parseInt(maxLength, 10);
  // can't set the name until we go thru namingConventions and these need the dp.


  let dp = new DataProperty({
    nameOnServer: csdlProperty.name,
    dataType: dataType,
    isNullable: isNullable,
    isPartOfKey: isPartOfKey,
    maxLength: maxLength,
    defaultValue: csdlProperty.defaultValue,
    // fixedLength: fixedLength,
    concurrencyMode: csdlProperty.concurrencyMode
  });

  if (dataType === DataType.Undefined) {
    dp.rawTypeName = csdlProperty.type;
  }
  return dp;
}

function parseCsdlComplexProperty(parentType: EntityType | ComplexType, csdlProperty, schema) {

  // Complex properties are never nullable ( per EF specs)
  // let isNullable = csdlProperty.nullable === 'true' || csdlProperty.nullable == null;
  // let complexTypeName = csdlProperty.type.split("Edm.")[1];
  let complexTypeName = parseTypeNameWithSchema(csdlProperty.type, schema).typeName;
  // can't set the name until we go thru namingConventions and these need the dp.
  let dp = new DataProperty({
    nameOnServer: csdlProperty.name,
    complexTypeName: complexTypeName,
    isNullable: false
  });

  return dp;
}

function parseCsdlNavProperty(entityType: EntityType, csdlProperty, schema, schemas) {
  let association = getAssociation(csdlProperty, schema, schemas);
  if (!association) {
    throw new Error("Unable to resolve Foreign Key Association: " + csdlProperty.relationship);
  }
  let toEnd = __arrayFirst(association.end, function (assocEnd) {
    return assocEnd.role === csdlProperty.toRole;
  });

  let isScalar = toEnd.multiplicity !== "*";
  let dataType = parseTypeNameWithSchema(toEnd.type, schema).typeName;

  let constraint = association.referentialConstraint;
  if (!constraint) {
    // TODO: Revisit this later - right now we just ignore many-many and assocs with missing constraints.

    // Think about adding this back later.
    if (association.end[0].multiplicity == "*" && association.end[1].multiplicity == "*") {
      // ignore many to many relations for now
      return;
    } else {
      // For now assume it will be set later directly on the client.
      // other alternative is to throw an error:
      // throw new Error("Foreign Key Associations must be turned on for this model");
    }
  }

  let cfg = {
    nameOnServer: csdlProperty.name,
    entityTypeName: dataType,
    isScalar: isScalar,
    associationName: association.name
  };

  if (constraint) {
    let principal = constraint.principal;
    let dependent = constraint.dependent;

    let propRefs = __toArray(dependent.propertyRef);
    let fkNames = propRefs.map(__pluck("name"));
    if (csdlProperty.fromRole === principal.role) {
      cfg.invForeignKeyNamesOnServer = fkNames;
    } else {
      // will be used later by np._update
      cfg.foreignKeyNamesOnServer = fkNames;
    }
  }

  let np = new NavigationProperty(cfg);
  entityType._addPropertyCore(np);
  return np;
}


function isEnumType(csdlProperty, schema) {
  if (schema.enumType) return isEdmxEnumType(csdlProperty, schema);
  else if (schema.extensions) return isODataEnumType(csdlProperty, schema);
  else return false;
}

function isEdmxEnumType(csdlProperty, schema) {
  let enumTypes = __toArray(schema.enumType);
  let typeParts = csdlProperty.type.split(".");
  let baseTypeName = typeParts[typeParts.length - 1];
  return enumTypes.some(function (enumType) {
    return enumType.name === baseTypeName;
  });
}

function isODataEnumType(csdlProperty, schema) {
  let enumTypes = schema.extensions.filter(function (ext) {
    return ext.name === "EnumType";
  });
  let typeParts = csdlProperty.type.split(".");
  let baseTypeName = typeParts[typeParts.length - 1];
  return enumTypes.some(function (enumType) {
    return enumType.attributes.some(function (attr) {
      return attr.name === "Name" && attr.value === baseTypeName;
    });
  });
}

function addValidators(dataProperty) {
  let typeValidator;
  if (!dataProperty.isNullable) {
    dataProperty.validators.push(Validator.required());
  }

  if (dataProperty.isComplexProperty) return;

  if (dataProperty.dataType === DataType.String) {
    if (dataProperty.maxLength) {
      let validatorArgs = { maxLength: dataProperty.maxLength };
      typeValidator = Validator.maxLength(validatorArgs);
    } else {
      typeValidator = Validator.string();
    }
  } else {
    typeValidator = dataProperty.dataType.validatorCtor();
  }

  dataProperty.validators.push(typeValidator);

}

function isIdentityProperty(csdlProperty) {
  // see if web api feed
  let propName = __arrayFirst(Object.keys(csdlProperty), function (pn) {
    return pn.indexOf("StoreGeneratedPattern") >= 0;
  });
  if (propName) {
    return (csdlProperty[propName] === "Identity");
  } else {
    // see if Odata feed
    let extensions = csdlProperty.extensions;
    if (!extensions) {
      return false;
    }
    let identityExtn = __arrayFirst(extensions, function (extension) {
      return extension.name === "StoreGeneratedPattern" && extension.value === "Identity";
    });
    return !!identityExtn;
  }
}

// Fast version
// np: schema.entityType[].navigationProperty.relationship -> schema.association
//   match( shortName(np.relationship) == schema.association[].name
//      --> association__

// Correct version
// np: schema.entityType[].navigationProperty.relationship -> schema.association
//   match( np.relationship == schema.entityContainer[0].associationSet[].association )
//      -> associationSet.name
//   match ( associationSet.name == schema.association[].name )
//      -> association

function getAssociation(csdlNavProperty, containingSchema, schemas) {
  let assocFullName = parseTypeNameWithSchema(csdlNavProperty.relationship, containingSchema);
  let assocNamespace = assocFullName.namespace;
  let assocSchema = __arrayFirst(schemas, function (schema) {
    return schema.namespace === assocNamespace;
  });
  if (!assocSchema) return null;

  let assocName = assocFullName.shortTypeName;
  let assocs = assocSchema.association;
  if (!assocs) return null;
  if (!Array.isArray(assocs)) {
    assocs = [assocs];
  }
  let association = __arrayFirst(assocs, function (assoc) {
    return assoc.name === assocName;
  });
  return association;
}

// schema is only needed for navProperty type name
function parseTypeNameWithSchema(entityTypeName, schema) {
  let result = parseTypeName(entityTypeName);
  if (schema && schema.cSpaceOSpaceMapping) {
    let ns = getNamespaceFor(result.shortTypeName, schema);
    if (ns) {
      result = makeTypeHash(result.shortTypeName, ns);
    }
  }
  return result;
}

function getNamespaceFor(shortName, schema) {
  let ns;
  let mapping = schema.cSpaceOSpaceMapping;
  if (mapping) {
    let fullName = mapping[schema.namespace + "." + shortName];
    ns = fullName && fullName.substr(0, fullName.length - (shortName.length + 1));
    if (ns) return ns;
  }
  // if schema does not also have an entityType node then
  // this is an WebApi2 OData schema which is usually equal to 'Default'; which is useless.
  if (schema.entityType || schema.namespace != 'Default') {
    return schema.namespace;
  }
  return null;
}