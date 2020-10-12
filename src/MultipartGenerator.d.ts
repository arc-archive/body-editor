export const contentTypeValue: unique symbol;
export const boundaryValue: unique symbol;

/**
 * A helper class that reads FormData as string and reads 
 * its `boundary` and `contentType`
 */
export class MultipartGenerator {
  form: FormData;
  /**
   * Reads the `boundary` for the form data after generating the message.
   * Note, `generateMessage()` must be called before accessing this property.
   */
  readonly boundary: string;

  /**
   * Reads the `contentType` for the form data after generating the message.
   * Note, `generateMessage()` must be called before accessing this property.
   */
  readonly contentType: string;

  /**
   * @param form The form data object to transform.
   */
  constructor(form: FormData);

  /**
   * Generates an ArrayBuffer instance from the FormData object.
   *
   * @returns Form data as payload's ArrayBuffer.
   */
  generateMessage(): Promise<ArrayBuffer>;

  /**
   * Sets the content type header.
   *
   * @param headers The headers object from the generated message
   */
  processContentType(headers: Headers): void;

  /**
   * Generates a preview of the multipart message.
   *
   * @returns A promise resolved to a string message.
   */
  generatePreview(): Promise<string>;

  /**
   * Convert ArrayBuffer to readable form
   * @param buffer
   * @returns Converted string
   */
  arrayBufferToString(buffer: ArrayBuffer): string;
}