/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
export const contentTypeValue = Symbol('contentTypeValue');
export const boundaryValue = Symbol('boundaryValue');

/**
 * A helper class that reads FormData as string and reads 
 * its `boundary` and `contentType`
 */
export class MultipartGenerator {
  /**
   * Reads the `boundary` for the form data after generating the message.
   * Note, `generateMessage()` must be called before accessing this property.
   */
  get boundary() {
    return this[boundaryValue];
  }

  /**
   * Reads the `contentType` for the form data after generating the message.
   * Note, `generateMessage()` must be called before accessing this property.
   */
  get contentType() {
    return this[boundaryValue];
  }

  /**
   * @param {FormData} form The form data object to transform.
   */
  constructor(form) {
    /** 
     * @type {FormData}
     */  
    this.form = form;
  }

  /**
   * Generates an ArrayBuffer instance from the FormData object.
   *
   * @return {Promise<ArrayBuffer>} Form data as payload's ArrayBuffer.
   */
  async generateMessage() {
    const request = new Request('/', {
      method: 'POST',
      body: this.form,
    });
    this.processContentType(request.headers);
    if (!request.arrayBuffer) {
      throw new Error('Your browser do not support this method.');
    }
    return request.arrayBuffer();
  }

  /**
   * Sets the content type header.
   *
   * @param {Headers} headers The headers object from the generated message
   */
  processContentType(headers) {
    const contentType = headers.get('content-type');
    this[contentTypeValue] = contentType;
    const match = contentType.match(/boundary=(.*)/);
    if (!match) {
      return;
    }
    const boundary = match[1];
    this[boundaryValue] = boundary;
  }

  /**
   * Generates a preview of the multipart message.
   *
   * @return {Promise<string>} A promise resolved to a string message.
   */
  async generatePreview() {
    if (!this.form) {
      throw new Error('The FormData property is not set.');
    }
    const ab = await this.generateMessage();
    return this.arrayBufferToString(ab);
  }

  /**
   * Convert ArrayBuffer to readable form
   * @param {ArrayBuffer} buffer
   * @return {string} Converted string
   */
  arrayBufferToString(buffer) {
    // @ts-ignore
    if (buffer.buffer) {
      // Not a ArrayBuffer, need and instance of AB
      // It can't just get buff.buffer because it will use original buffer if the buff is a slice
      // of it.
      const b = buffer.slice(0);
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      buffer = b.buffer;
    }
    if ('TextDecoder' in window) {
      const view = new DataView(buffer);
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(view);
    }
    const array = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < array.length; ++i) {
      str += String.fromCharCode(array[i]);
    }
    return str;
  }
}