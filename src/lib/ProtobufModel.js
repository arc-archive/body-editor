/* eslint-disable class-methods-use-this */
/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */
/** @typedef {import('protobufjs')} protobuf */

export class ProtobufModel {
  /**
   * @param {object} fields The proto fields map
   * @return {ApiType[]|undefined}
   */
  generateFormModel(fields) {
    if (!fields) {
      return undefined;
    }
    const result = [];
    const names = Object.keys(fields);
    names.forEach((name) => {
      const field = /** @type protobuf.Field */ (fields[name]);
      const item = /** @type ApiType */ ({
        name: field.name,
        value: undefined,
      });
      if (field.required) {
        item.enabled = true;
      }
      const nested = /** @type protobuf.Type|object */ (field.root[field.type]);
      if (nested) {
        if (!nested.fields) {
          // this is an enum type
          item.enum = field.root.nested[field.type].valuesById;
        } else if (nested.fields) {
          item.properties = this.generateFormModel(nested.fields);
          item.value = {};
        }
      }
      item.type = this.fieldTypeToApiType(field.type);
      result.push(item);
    });
    return result;
  }

  fieldTypeToApiType(type) {
    switch (type) {
      case 'double':
      case 'float':
      case 'int64':
      case 'int32': return 'number';
      default: return type;
    }
  }
}