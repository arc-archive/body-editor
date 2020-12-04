import { assert } from '@open-wc/testing';
import { BodyProcessor } from '../index.js';

/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.TransformedPayload} TransformedPayload */

describe('BodyProcessor', () => {
  const initRequest = /** @type ARCSavedRequest */ ({
    url: 'https://domain.com',
    method: 'POST',
    headers: '',
    type: 'saved',
    response: /** @type ArcResponse */ ({
      loadingTime: 1,
      status: 200,
      headers: '',
    }),
  });

  describe('payloadToString()', () => {
    it('returns the same object when no payload', async () => {
      const obj = { ...initRequest };
      const result = await BodyProcessor.payloadToString(obj);
      assert.deepEqual(result, obj);
    });

    it('Creates "blob" property from Blob instance', async () => {
      const b = new Blob(['***'], {type: 'text/plain'});
      const obj = {
        ...initRequest,
        payload: b,
      };
      const result = await BodyProcessor.payloadToString(obj);
      assert.equal(result.blob, 'data:text/plain;base64,Kioq');
    });

    it('Removes "payload" with Blob instance', async () => {
      const b = new Blob(['***'], {type: 'text/plain'});
      const obj = {
        ...initRequest,
        payload: b,
      };
      const result = await BodyProcessor.payloadToString(obj);
      assert.isUndefined(result.payload);
    });

    it('creates "multipart" property from FormData instance', async () => {
      const b = new Blob(['***'], {type: 'text/plain'});
      const fd = new FormData();
      fd.append('file', b, 'file-name');
      fd.append('text', 'abcd');
      fd.append('text-part', b, 'text-part');
      const obj = {
        ...initRequest,
        payload: fd,
      };
      const result = await BodyProcessor.payloadToString(obj);
      assert.typeOf(result.multipart, 'array');
      assert.lengthOf(result.multipart, 3);
    });

    it('removes "payload" with FormData instance', async () => {
      const b = new Blob(['***'], {type: 'text/plain'});
      const fd = new FormData();
      fd.append('file', b, 'file-name');
      const obj = {
        ...initRequest,
        payload: fd,
      };
      const result = await BodyProcessor.payloadToString(obj);
      assert.isUndefined(result.payload);
    });

    it('resolves to the same object when payload is string', async () => {
      const obj = {
        ...initRequest,
        payload: 'test',
      };
      const result = await BodyProcessor.payloadToString(obj);
      assert.deepEqual(result, obj);
    });
  });

  describe('blobToString()', () => {
    const b = new Blob(['***'], {type: 'text/plain'});

    it('returns a string', async () => {
      const result = await BodyProcessor.blobToString(b);
      assert.typeOf(result, 'string')
    });

    it('returns a valid data url', async () => {
      const result = await BodyProcessor.blobToString(b);
      assert.equal(result, 'data:text/plain;base64,Kioq');
    });
  });

  describe('dataURLtoBlob()', () => {
    const data = 'data:text/plain;base64,Kioq';

    it('converts data-url to a blob', () => {
      const result = BodyProcessor.dataURLtoBlob(data);
      assert.typeOf(result, 'blob');
    });

    it('restores the type', () => {
      const result = BodyProcessor.dataURLtoBlob(data);
      assert.equal(result.type, 'text/plain');
    });

    it('matches the size', () => {
      const result = BodyProcessor.dataURLtoBlob(data);
      assert.equal(result.size, 3);
    });
  });

  describe('createMultipartEntry()', () => {
    let fd = /** @type FormData */ (null);
    beforeEach(() => {
      const b = new Blob(['***'], {type: 'text/plain'});
      fd = new FormData();
      fd.append('file', b, 'file-name');
      fd.append('text', 'abcd');
      fd.append('text-part', b, 'blob');
    });

    it('returns an array with transformed items', async () => {
      const result = await BodyProcessor.createMultipartEntry(fd);
      assert.typeOf(result, 'array');
      assert.lengthOf(result, 3);
    });

    it('computes the file part', async () => {
      const data = await BodyProcessor.createMultipartEntry(fd);
      const [part] = data;
      assert.isTrue(part.isFile, 'isFile is set');
      assert.equal(part.name, 'file', 'name is set');
      assert.equal(part.value, 'data:text/plain;base64,Kioq', 'value is transformed');
      assert.equal(part.fileName, 'file-name', 'fileName is set');
      assert.isTrue(part.enabled, 'has the enabled property');
      assert.isUndefined(part.type, 'type is not set');
    });

    it('computes the text part', async () => {
      const data = await BodyProcessor.createMultipartEntry(fd);
      const part = data[1];
      assert.isFalse(part.isFile, 'isFile is not set');
      assert.equal(part.name, 'text', 'name is set');
      assert.equal(part.value, 'abcd', 'value is not transformed');
      assert.isTrue(part.enabled, 'has the enabled property');
      assert.isUndefined(part.fileName, 'fileName is not set');
      assert.isUndefined(part.type, 'type is not set');
    });

    it('computes the text part with a content type', async () => {
      const data = await BodyProcessor.createMultipartEntry(fd);
      const part = data[2];
      assert.isFalse(part.isFile, 'isFile is not set');
      assert.equal(part.type, 'text/plain');
      assert.equal(part.name, 'text-part');
      assert.equal(part.value, 'data:text/plain;base64,Kioq');
      assert.isTrue(part.enabled, 'has the enabled property');
    });
  });

  describe('restoreMultipart()', () => {
    it('returns empty FormData when no model', () => {
      const result = BodyProcessor.restoreMultipart(undefined);
      assert.typeOf(result, 'formdata');
    });

    it('processes a text entry', () => {
      const fd = BodyProcessor.restoreMultipart([{
        isFile: false,
        name: 'test-name',
        value: 'test-value'
      }]);
      const result = fd.get('test-name');
      assert.equal(result, 'test-value');
    });

    it('processes text entry with a content type', () => {
      const fd = BodyProcessor.restoreMultipart([{
        isFile: false,
        type: 'text/plain',
        name: 'test-name',
        value: 'data:text/plain;base64,Kioq'
      }]);
      const result = fd.get('test-name');
      // @ts-ignore
      assert.equal(result.type, 'text/plain');
    });

    it('processes a file', () => {
      const fd = BodyProcessor.restoreMultipart([{
        isFile: true,
        name: 'test-name',
        value: 'data:text/plain;base64,Kioq'
      }]);
      const result = fd.get('test-name');
      // @ts-ignore
      assert.equal(result.type, 'text/plain');
    });

    it('ignores disabled items', () => {
      const fd = BodyProcessor.restoreMultipart([{
        isFile: true,
        name: 'test-name',
        value: 'data:text/plain;base64,Kioq',
        enabled: false,
      }]);
      assert.isFalse(fd.has('test-name'));
    });
  });

  describe('restorePayload()', () => {
    it('does nothing when no created payload data', () => {
      const result = BodyProcessor.restorePayload({ ...initRequest });
      assert.deepEqual(result, initRequest);
    });

    it('restores a blob data', () => {
      const data = 'data:text/plain;base64,Kioq';
      const result = BodyProcessor.restorePayload({
        ...initRequest,
        blob: data,
      });
      assert.typeOf(result.payload, 'blob');
      // @ts-ignore
      assert.equal(result.payload.type, 'text/plain');
      // @ts-ignore
      assert.equal(result.payload.size, 3);
      assert.isUndefined(result.blob);
    });

    it('restores a form data', () => {
      const result = BodyProcessor.restorePayload({
        ...initRequest,
        multipart: [{
          isFile: false,
          name: 'test-name',
          value: 'test-value'
        }]
      });
      assert.ok(result.payload);
      // @ts-ignore
      const data = result.payload.get('test-name');
      assert.equal(data, 'test-value');
      assert.isUndefined(result.multipart);
    });
  });

  describe('fileToString()', () => {
    let file = /** @type File */ (null);
    beforeEach(() => {
      const blob = new Blob(['test content'], {type: 'text/plain'});
      // @ts-ignore
      blob.name = 'test-file.txt';
      // @ts-ignore
      blob.lastModified = 1519211809934;
      file = /** @type File */ (blob);
    });

    it('reads file as text', async () => {
      const result = await BodyProcessor.fileToString(file);
      assert.equal(result, 'test content');
    });
  });

  describe('stringifyRequest()', () => {
    it('processes the request payload', async () => {
      const b = new Blob(['***** ***'], {type: 'text/plain'});
      const obj = {
        ...initRequest,
        payload: b,
      };
      const result = await BodyProcessor.stringifyRequest(obj);
      assert.equal(result.blob, 'data:text/plain;base64,KioqKiogKioq');
    });

    it('processes the response payload', async () => {
      const b = new Blob(['***** ***'], {type: 'text/plain'});
      const obj = {
        ...initRequest,
        payload: b,
      };
      // @ts-ignore
      obj.response.payload = b;
      const result = await BodyProcessor.stringifyRequest(obj);
      assert.equal(result.response.blob, 'data:text/plain;base64,KioqKiogKioq');
    });

    it('processes the response payload with ArrayBuffer', async () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test');
      const obj = {
        ...initRequest,
      };
      obj.response.payload = view.buffer;
      const result = await BodyProcessor.stringifyRequest(obj);
      const body = /** @type TransformedPayload */ (result.response.payload);
      assert.equal(body.type, 'ArrayBuffer');
      assert.typeOf(body.data, 'array');
    });
  });

  describe('restoreRequest()', () => {
    it('processes the request payload', async () => {
      const obj = {
        ...initRequest,
        blob: 'data:text/plain;base64,KioqKiogKioq',
      };
      const result = BodyProcessor.restoreRequest(obj);
      assert.typeOf(result.payload, 'blob');
    });

    it('processes the response payload', async () => {
      const obj = {
        ...initRequest,
      };
      obj.response.blob = 'data:text/plain;base64,KioqKiogKioq';
      const result = BodyProcessor.restoreRequest(obj);
      assert.typeOf(result.response.payload, 'blob');
    });

    it('restores the response payload with ArrayBuffer', async () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test-ab');
      const obj = {
        ...initRequest,
      };
      obj.response.payload = BodyProcessor.arrayBufferToTransformed(view.buffer);
      const result = BodyProcessor.restoreRequest(obj);
      assert.typeOf(result.response.payload, 'ArrayBuffer');
    });
  });

  describe('bufferToTransformed()', () => {
    it('returns transformed Buffer (NodeJS)', () => {
      const buff = [1,2,3];
      // @ts-ignore
      buff.copy = () => {};
      const result = BodyProcessor.bufferToTransformed(buff);
      assert.equal(result.type, 'Buffer');
      assert.deepEqual(result.data, [1,2,3]);
    });

    it('returns undefined for other types', () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test-ab');
      const result = BodyProcessor.bufferToTransformed(view.buffer);
      assert.isUndefined(result);
    });
  });

  describe('arrayBufferToTransformed()', () => {
    it('returns undefined for other types', () => {
      const buff = [1,2,3];
      // @ts-ignore
      buff.copy = () => {};
      const result = BodyProcessor.arrayBufferToTransformed(buff);
      assert.isUndefined(result);
    });

    it('returns transformed ArrayBuffer', () => {
      const encoder = new TextEncoder();
      const view = encoder.encode('test');
      const result = BodyProcessor.arrayBufferToTransformed(view.buffer);
      assert.equal(result.type, 'ArrayBuffer');
      assert.deepEqual(result.data, [116, 101, 115, 116]);
    });
  });

  describe('transformedToPayload()', () => {
    it('restores ArrayBuffer', () => {
      const info = {
        type: 'ArrayBuffer',
        data: [116, 101, 115, 116]
      };
      const result = BodyProcessor.transformedToPayload(info);
      assert.typeOf(result, 'ArrayBuffer');
    });

    it('returns undefined when unknown type', () => {
      const info = {};
      const result = BodyProcessor.transformedToPayload(info);
      assert.isUndefined(result);
    });
  });
});
