/* eslint-disable class-methods-use-this */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCHistoryRequest} ARCHistoryRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ARCSavedRequest} ARCSavedRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/arc-types').RequestBody.MultipartBody} MultipartBody */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.TransformedPayload} TransformedPayload */

/**
 * A helper class that processes payload before saving it to a  datastore or a file.
 * It transforms `FormData` and `Blob` payloads into string and restores them to the original state.
 * It has a helper method `stringifyRequest` that takes care of the request payload and the response payload in a batch operation.
 */
export class BodyProcessor {
  /**
   * Transforms the request payload to string if needed and the response payload when set.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param {ARCHistoryRequest|ARCSavedRequest} request ArcRequest object
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest>} A copy of the request object with transformed payload
   */
  static async stringifyRequest(request) {
    const cp = /** @type ARCHistoryRequest */ (await BodyProcessor.payloadToString(request));
    if (cp.response && cp.response.payload) {
      cp.response = /** @type ArcResponse */ (await this.payloadToString(cp.response));
    }
    return cp;
  }

  /**
   * Restores the payload into its original format from both the request and response objects.
   * 
   * @param {ARCHistoryRequest|ARCSavedRequest} request ArcRequest object
   * @return {ARCHistoryRequest|ARCSavedRequest} Processed request
   */
  static restoreRequest(request) {
    const processed = /** @type ARCHistoryRequest */ (BodyProcessor.restorePayload(request));
    if (processed.response) {
      processed.response = /** @type ArcResponse */ (BodyProcessor.restorePayload(request.response));
    }
    return processed;
  }

  /**
   * Transforms request payload to string if needed.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param {ARCHistoryRequest|ARCSavedRequest|ArcResponse} request ArcRequest object
   * @return {Promise<ARCHistoryRequest|ARCSavedRequest|ArcResponse>} A copy of the request object with transformed payload
   */
  static async payloadToString(request) {
    if (!request.payload) {
      return request;
    }
    if (request.payload instanceof FormData) {
      const data = { ...request };
      const body = /** @type FormData */ (data.payload);
      // @ts-ignore
      if (!body.entries) {
        data.payload = undefined;
        return data;
      }
      const entry = await BodyProcessor.createMultipartEntry(body);
      data.payload = undefined;
      data.multipart = entry;
      return data;
    } 
    if (request.payload instanceof Blob) {
      const data = { ...request };
      const body = /** @type Blob */ (data.payload);
      const result = await BodyProcessor.blobToString(body);
      data.payload = undefined;
      data.blob = result;
      return data;
    }
    const transformed = BodyProcessor.bufferToTransformed(request.payload) || BodyProcessor.arrayBufferToTransformed(request.payload);
    if (transformed) {
      const data = { ...request };
      data.payload = transformed;
      return data;
    }
    return request;
  }

  /**
   * When the passed argument is a NodeJS buffer it creates an object describing the buffer
   * in a safe to store object.
   * 
   * @param {any} payload 
   * @returns {TransformedPayload|undefined} The buffer metadata or undefined if the passed argument is not a Buffer.
   */
  static bufferToTransformed(payload) {
    const typedBuffer = /** @type Buffer */(payload);
    if (typeof typedBuffer.copy === 'function') {
      return {
        type: 'Buffer',
        data: [...typedBuffer],
      };
    }
    return undefined;
  }

  /**
   * When the passed argument is an ArrayBuffer it creates an object describing the object in a safe to store object.
   * 
   * @param {any} payload 
   * @returns {TransformedPayload|undefined} The buffer metadata or undefined if the passed argument is not an ArrayBuffer.
   */
  static arrayBufferToTransformed(payload) {
    const typedArrayBuffer = /** @type ArrayBuffer */(payload);
    if (typedArrayBuffer.byteLength) {
      const view = new Uint8Array(typedArrayBuffer);
      return {
        type: 'ArrayBuffer',
        data: Array.from(view),
      };
    }
    return undefined;
  }

  /**
   * Computes `multipart` list value to replace FormData with array that can
   * be stored in the datastore.
   *
   * @param {FormData} payload FormData object
   * @return {Promise<MultipartBody[]>} A promise resolved to a datastore safe entries.
   */
  static createMultipartEntry(payload) {
    const promises = [];
    // @ts-ignore
    for(const pair of payload.entries()) {
      const [name, file] = pair;
      promises.push(BodyProcessor.computeFormDataEntry(name, file));
    }
    return Promise.all(promises);
  }

  /**
   * Transforms a FormData entry into a safe-to-store text entry
   *
   * @param {string} name The part name
   * @param {string|File} file The part value
   * @return {Promise<MultipartBody>} Transformed FormData part to a datastore safe entry.
   */
  static async computeFormDataEntry(name, file) {
    if (typeof file === 'string') {
      // when adding an item to the FormData object without 3rd parameter of the append function
      // then  the value is a string.
      return {
        isFile: false,
        name,
        value: file,
        enabled: true,
      };
    }
    const value = await BodyProcessor.blobToString(file);
    const part = /** @type MultipartBody */ ({
      isFile: false,
      name,
      value,
      enabled: true,
    });
    if (file.name === 'blob') {
      // ARC adds the "blob" filename when the content type is set on the editor.
      // otherwise it wouldn't be possible to set the content type value.
      part.type = file.type;
    } else {
      part.isFile = true;
      part.fileName = file.name;
    }
    return part;
  }

  /**
   * Converts blob data to base64 string.
   *
   * @param {Blob} blob File or blob object to be translated to string
   * @return {Promise<string>} Promise resolved to a base64 string data from the file.
   */
  static blobToString(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        resolve(String(e.target.result));
      };
      reader.onerror = () => {
        reject(new Error('Unable to convert blob to string.'));
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Restores the payload into its original format.
   * 
   * @param {ARCHistoryRequest|ARCSavedRequest|ArcResponse} request ArcRequest object
   * @return {ARCHistoryRequest|ARCSavedRequest|ArcResponse} Processed request
   */
  static restorePayload(request) {
    if (request.multipart) {
      try {
        request.payload = BodyProcessor.restoreMultipart(request.multipart);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Unable to restore payload.', e);
      }
      delete request.multipart;
      return request;
    } 
    if (request.blob) {
      try {
        request.payload = BodyProcessor.dataURLtoBlob(request.blob);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Unable to restore payload.', e);
      }
      delete request.blob;
      return request;
    }
    if (!request.payload || typeof request.payload === 'string') {
      return request;
    }
    const restored = BodyProcessor.transformedToPayload(request.payload);
    if (restored) {
      request.payload = restored;
      return request;
    }
    return request;
  }

  /**
   * Handles potential `TransformedPayload` and returns the original data
   * 
   * @param {any} payload 
   * @returns {Buffer|ArrayBuffer|undefined} The original data format or undefined otherwise.
   */
  static transformedToPayload(payload) {
    const body = /** @type TransformedPayload */ (payload);
    if (body.type === 'ArrayBuffer') {
      const { buffer } = new Uint16Array(body.data);
      return buffer;
    }
    if (body.type === 'Buffer') {
      return Buffer.from(body.data);
    }
    return undefined;
  }

  /**
   * Restores FormData from ARC data model.
   *
   * @param {MultipartBody[]} model ARC model for multipart.
   * @return {FormData} Restored form data
   */
  static restoreMultipart(model) {
    const fd = new FormData();
    if (!Array.isArray(model) || !model.length) {
      return fd;
    }
    model.forEach((part) => {
      const { isFile, name, value, type, fileName, enabled } = part;
      if (enabled === false) {
        return;
      }
      let blob;
      if (isFile) {
        blob = BodyProcessor.dataURLtoBlob(value);
        fd.append(name, blob, fileName);
      } else if (type) {
        blob = BodyProcessor.dataURLtoBlob(value);
        fd.append(name, blob, 'blob');
      } else {
        fd.append(name, value);
      }
    });
    return fd;
  }

  /**
   * Converts data-url string to blob
   *
   * @param {string} dataUrl Data url from blob value.
   * @return {Blob} Restored blob value
   */
  static dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    // eslint-disable-next-line no-plusplus
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Converts blob data to a string.
   *
   * @param {File} blob File or blob object to be translated to string
   * @return {Promise<string>} Promise resolved to a text value of the file
   */
  static fileToString(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        resolve(String(e.target.result));
      };
      reader.onerror = () => {
        reject(new Error('Unable to convert blob to string.'));
      };
      reader.readAsText(blob);
    });
  }
}
