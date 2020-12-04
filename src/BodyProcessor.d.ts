import { ArcRequest, RequestBody } from '@advanced-rest-client/arc-types';
import { TransformedPayload } from '@advanced-rest-client/arc-types/src/request/ArcResponse';

/**
 * A helper class that processes payload before saving it to a
 * datastore or file.
 * It processes `FormData` and `Blob` payloads into string and restores
 * them to original state.
 */
export declare class BodyProcessor {

  /**
   * Transforms the request payload to string if needed and the response payload when set.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param request ArcRequest object
   * @returns A copy of the request object with transformed payload
   */
  static stringifyRequest(request: ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest): Promise<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>;

  /**
   * Restores the payload into its original format from both the request and response objects.
   * 
   * @param request ArcRequest object
   * @returns Processed request
   */
  static restoreRequest(request: ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest): ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest;

  /**
   * Transforms request payload to string if needed.
   * Note, this returns copy of the object if any transformation is applied.
   *
   * @param request ArcRequest object
   * @returns Promise resolved when payload has been processed.
   */
  static payloadToString(request: ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest): Promise<ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest>;

  /**
   * When the passed argument is a NodeJS buffer it creates an object describing the buffer
   * in a safe to store object.
   * 
   * @param payload 
   * @returns The buffer metadata or undefined if the passed argument is not a Buffer.
   */
  static bufferToTransformed(payload: any): TransformedPayload|undefined;

  /**
   * When the passed argument is an ArrayBuffer it creates an object describing the object in a safe to store object.
   * 
   * @param payload 
   * @returns The buffer metadata or undefined if the passed argument is not an ArrayBuffer.
   */
  static arrayBufferToTransformed(payload: any): TransformedPayload|undefined;

  /**
   * Computes `multipart` list value to replace FormData with array that can
   * be stored in the datastore.
   *
   * @param payload FormData object
   * @returns A promise resolved to a datastore safe entries.
   */
  static createMultipartEntry(payload: FormData): Promise<RequestBody.MultipartBody[]>;

  /**
   * Transforms a FormData entry into a safe-to-store text entry
   *
   * @param name The part name
   * @param file The part value
   * @returns Transformed FormData part to a datastore safe entry.
   */
  static computeFormDataEntry(name: string, file: string|File): Promise<RequestBody.MultipartBody>;

  /**
   * Converts blob data to base64 string.
   *
   * @param blob File or blob object to be translated to string
   * @returns Promise resolved to a base64 string data from the file.
   */
  static blobToString(blob: Blob): Promise<string>;

  /**
   * Restores creates payload meta entry into it's original form.
   *
   * @param request ArcRequest object
   * @returns Processed request
   */
  static restorePayload(request: ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest): ArcRequest.ARCHistoryRequest|ArcRequest.ARCSavedRequest;

  /**
   * Handles potential `TransformedPayload` and returns the original data
   * 
   * @param payload 
   * @returns The original data format or undefined otherwise.
   */
  static transformedToPayload(payload: any): Buffer|ArrayBuffer|undefined;

  /**
   * Restores FormData from ARC data model.
   *
   * @param model ARC model for multipart.
   * @return Restored form data
   */
  static restoreMultipart(model: RequestBody.MultipartBody[]): FormData;

  /**
   * Converts data-url string to blob
   *
   * @param dataUrl Data url from blob value.
   * @return Restored blob value
   */
  static dataURLtoBlob(dataUrl: string): Blob;

  /**
   * Converts blob data to a string.
   *
   * @param blob File or blob object to be translated to string
   * @returns Promise resolved to a text value of the file
   */
  static fileToString(blob: File): Promise<string>;
}
