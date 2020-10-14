export declare interface ProtobufBodyMeta {
  /**
   * The request message schema to parse with the protobuf parser
   */
  requestSchema: string;
  /**
   * The expected response message schema to parse with the protobuf parser
   */
  responseSchema?: string;
  /**
   * The values provided in the message editor.
   */
  values?: any;
  /**
   * The selected message type in the message body editor.
   */
  message?: string;
}