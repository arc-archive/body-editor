import { LitElement, TemplateResult, CSSResult } from 'lit-element';
import { RequestBody, ApiTypes } from '@advanced-rest-client/arc-types';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import {
  bodyTypeSelectorTemplate,
  bodyTypeOptionsTemplate,
  selectedValue,
  valueValue,
  modelValue,
  editorTemplate,
  rawEditorTemplate,
  urlEncodeEditorTemplate,
  multipartEditorTemplate,
  fileEditorTemplate,
  noEditorTemplate,
  typeChangeHandler,
  pickFileHandler,
  fileChangeHandler,
  notifyInput,
  fileDetailTemplate,
  clearValueHandler,
  readMetaModel,
  setMetaModel,
  urlEncodeChangeHandler,
  multipartChangeHandler,
  modelChanged,
  restoreFileModel,
  editorActions,
  togglePreviewHandler,
  previewDialogOpened,
  generatingPreview,
  previewValue,
  generatePreview,
  previewTemplate,
  previewClosedHandler,
  rawChangeHandler,
  contentTypeValue,
  analyzeContentType,
  invalidMimeValue,
  invalidMimeMessage,
  invalidMimeTemplate,
  fixableInvalidMimeTemplate,
  autoFixMime,
  editorTypeValue,
  codeMirrorTemplate,
  monacoTemplate,
  mimeValue,
  codeMirrorChangeHandler,
  mainActionsTemplate,
  mimeTypeChangeHandler,
} from './internals.js';

export declare interface EditorInfo {
  id: string;
  label: string;
  title: string;
}

export const editorTypes: EditorInfo[];
export declare type allowedEditors = 'raw' | 'urlEncode' | 'multipart' | 'file';

/**
 * @fires change When the value and the model change
 */
export declare class BodyEditorElement extends ArcResizableMixin(LitElement) {
  static readonly styles: CSSResult[];

  /**
   * A HTTP body.
   *
   * Depending of current editor selection the type can vary.
   * @attribute
   */
  value: string|FormData|File|Blob;
  [valueValue]: string|FormData|File|Blob;
  /**
   * Previously generated by this editor metadata model.
   * Used internally to set the UI.
   */
  model: RequestBody.BodyMetaModel[];
  [modelValue]: RequestBody.BodyMetaModel[];
  /**
   * The currently rendered editor.
   * @attribute
   */
  selected: allowedEditors;
  [selectedValue]: allowedEditors;
  /**
   * Enables compatibility with Anypoint styling
   * @attribute
   */
  compatibility: boolean;
  /**
   * Enables Material Design outlined style
   * @attribute
   */
  outlined: boolean;
  /**
   * When set the editor is in read only mode.
   * @attribute
   */
  readOnly: boolean;
  /**
   * When set all controls are disabled in the form
   * @attribute
   */
  disabled: boolean;
  /** 
   * When set it automatically encodes and decodes values
   * in www-url-form-encoded editor.
   * @attribute
   */
  autoEncode: boolean;
  /** 
   * The current request content type. It is passed to the `raw` editor
   * to detect current language.
   * @attribute
   */
  contentType: string;
  [contentTypeValue]: string;
  /** 
   * The "raw" editor type. Acceptable values are `CodeMirror` and `Monaco`.
   * The setter ignores other values.
   * 
   * Note, both editors requires additional dependencies that needs to be loaded
   * outside the components. See the demo page sources for an example.
   * @attribute
   */
  editorType: string;
  [editorTypeValue]: string;

  [previewDialogOpened]: boolean;
  [generatingPreview]: boolean;
  [previewValue]: string;
  [invalidMimeValue]: boolean;
  [invalidMimeMessage]: number;
  [mimeValue]: string;

  /**
   * @returns {boolean} True when the current value is a file (or blob).
   */
  readonly hasFile: boolean;

  constructor();

  /**
   * This must be called only when the `model` property change from the 
   * outside. It restores values depending on the selected editor.
   */
  [modelChanged](): void;

  /**
   * Restores file value from the model, if exists
   */
  [restoreFileModel](): void;

  /**
   * Dispatches the `input` event
   */
  [notifyInput](): void;

  /**
   * A handler for the editor selection. It activates an editor, if necessary.
   */
  [typeChangeHandler](e: CustomEvent): Promise<void>;

  /**
   * A handler for the file pick button click.
   * Activates the file input.
   */
  [pickFileHandler](): void;

  /**
   * A handler for the file file selection in the file input.
   * Sets the value to the file.
   */
  [fileChangeHandler](e: Event): Promise<void>;

  /**
   * Clears the current value
   */
  [clearValueHandler](): void;

  /**
   * Reads editor view model
   * @param editor The editor id
   * @returns The view model
   */
  [readMetaModel](editor: string): (ApiTypes.ApiType|RequestBody.MultipartBody|RequestBody.RawBody)[]|undefined;

  /**
   * Sets editor view model on the local model
   * @param editor The editor id
   * @param model The view model
   */
  [setMetaModel](editor: (ApiTypes.ApiType|RequestBody.MultipartBody|RequestBody.RawBody)[], model: (ApiTypes.ApiType|RequestBody.MultipartBody|RequestBody.RawBody)[]): void;

  /**
   * A handler for the change event dispatched by the 
   * `urlEncode` editor.
   * Updated the local value, model, and notifies the change.
   */
  [urlEncodeChangeHandler](e: Event): void;

  /**
   * A handler for the change event dispatched by the `raw` editor.
   * Updated the local value, model, and notifies the change.
   */
  [rawChangeHandler](e: Event): void;

  /**
   * A handler for the change event dispatched by the `CodeMirror` editor.
   * Updated the local value, model, and notifies the change.
   */
  [codeMirrorChangeHandler](e: Event): void;

  /**
   * A handler for the change event dispatched by the 
   * `multipart` editor.
   * Updated the local value, model, and notifies the change.
   */
  [multipartChangeHandler](e: Event): void;

  /**
   * Toggles the multipart body preview 
   * @todo This should also support x-www-formdata 
   */
  [togglePreviewHandler](): void;

  /**
   * Generates a preview for multipart data.
   * @todo This should also support x-www-formdata 
   */
  [generatePreview](): Promise<void>;

  /**
   * Handler for the preview dialog close event.
   * Cleans up the preview data.
   */
  [previewClosedHandler](): void;

  /**
   * Checks whether the current content type header value matches the selected editor.
   * If not it renders a warning message.
   */
  [analyzeContentType](): void;

  /**
   * Automatically fixes content type problem.
   */
  [autoFixMime](): void;

  /**
   * A handler for the mime type selection.
   */
  [mimeTypeChangeHandler](e: CustomEvent): void;
  
  render(): TemplateResult;

  /**
   * @returns The template for the dropdown menu for the editor type
   */
  [bodyTypeSelectorTemplate](): TemplateResult;

  /**
   * @returns {TemplateResult|string} The template for the main editor actions.
   */
  [mainActionsTemplate](): TemplateResult|string;

  /**
   * Add editor specific actions to the top toolbar.
   * @returns
   */
  [editorActions](): TemplateResult|string;

  [bodyTypeOptionsTemplate](): TemplateResult;

  /**
   * @returns A template for currently rendered editor
   */
  [editorTemplate](): TemplateResult;

  /**
   * @returns The template for the raw editor
   */
  [rawEditorTemplate](): TemplateResult;

  /**
   * @param {string} value The editor value
   * @returns The template for the Monaco editor
   */
  [monacoTemplate](value: string): TemplateResult;

  /**
   * @param {string} value The editor value
   * @returns The template for the CodeMirror editor
   */
  [codeMirrorTemplate](value: string): TemplateResult;

  /**
   * @returns A template for the www-url-form-encoded editor
   */
  [urlEncodeEditorTemplate](): TemplateResult;

  /**
   * @returns A template for the multipart editor
   */
  [multipartEditorTemplate](): TemplateResult;

  /**
   * @returns A template for the file input editor
   */
  [fileEditorTemplate](): TemplateResult;

  /**
   * @returns A template for the missing selection
   */
  [noEditorTemplate](): TemplateResult;

  /**
   * @returns A template for the file details.
   */
  [fileDetailTemplate](): TemplateResult|string;

  [previewTemplate](): TemplateResult;

  [invalidMimeTemplate](): TemplateResult;

  /**
   * @param suggested
   * @returns A template for fixable mime type mismatch message.
   */
  [fixableInvalidMimeTemplate](suggested: string): TemplateResult;
}
