/* eslint-disable lit-a11y/no-autofocus */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2020 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { LitElement, html } from 'lit-element';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog.js';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog-scrollable.js';
import '@advanced-rest-client/code-mirror/code-mirror.js';
// import '@advanced-rest-client/code-mirror-linter/code-mirror-linter.js';
import linterStyles from '@advanced-rest-client/code-mirror-linter/lint-style.js';
import { RequestEvents } from '@advanced-rest-client/arc-events';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { BodyProcessor } from './BodyProcessor.js';
import { MultipartGenerator } from './MultipartGenerator.js';
import elementStyles from './styles/BodyEditor.styles.js';
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
  dropHandler,
  dragOverHandler,
  enabledEditorsValue,
  effectiveEditorsValue,
  computeEffectiveEditors,
} from './internals.js';
import '../body-formdata-editor.js';
import '../body-multipart-editor.js';
import '../body-raw-editor.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('@advanced-rest-client/arc-types').RequestBody.BodyMetaModel} BodyMetaModel */
/** @typedef {import('@advanced-rest-client/arc-types').RequestBody.MultipartBody} MultipartBody */
/** @typedef {import('@advanced-rest-client/arc-types').RequestBody.RawBody} RawBody */
/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */
/** @typedef {import('@advanced-rest-client/code-mirror').CodeMirrorElement} CodeMirrorElement */
/** @typedef {import('./BodyFormdataEditorElement').BodyFormdataEditorElement} BodyFormdataEditorElement */
/** @typedef {import('./BodyMultipartEditorElement').BodyMultipartEditorElement} BodyMultipartEditorElement */
/** @typedef {import('./BodyRawEditorElement').BodyRawEditorElement} BodyRawEditorElement */
/** @typedef {import('./types').EditorType} EditorType */

/**
 * @param {Event} e
 */
function cancelEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

/** 
 * @type {Readonly<EditorType[]>}
 */
export const editorTypes = Object.freeze([
  {
    id: 'raw',
    label: 'Raw input',
    title: 'Opens a source editor with syntax highlighting'
  },
  {
    id: 'urlEncode',
    label: 'www-url-form-encoded',
    title: 'Opens an editor specialized with URL encoded data types'
  },
  {
    id: 'multipart',
    label: 'Multipart form data',
    title: 'Opens an editor specialized with multipart data'
  }, 
  {
    id: 'file',
    label: 'File',
    title: 'Allows to choose any binary data'
  }
]);

/**
 * @fires change When the value and the model change
 */
export class BodyEditorElement extends ArcResizableMixin(LitElement) {
  static get styles() {
    return [elementStyles, linterStyles];
  }

  static get properties() {
    return {
      /**
       * A HTTP body.
       *
       * Depending of current editor selection the type can vary.
       */
      value: { },
      /**
       * Previously generated by this editor metadata model.
       * Used internally to set the UI.
       */
      model: { type: Array },
      /**
       * The currently rendered editor.
       */
      selected: { type: String },
      /**
       * Enables compatibility with Anypoint styling
       */
      compatibility: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set all controls are disabled in the form
       */
      disabled: { type: Boolean },
      /** 
       * When set it automatically encodes and decodes values
       * in www-url-form-encoded editor.
       */
      autoEncode: { type: Boolean },
      /** 
       * The current request content type. It is passed to the `raw` editor
       * to detect current language.
       */
      contentType: { type: String },
      /** 
       * The "raw" editor type. Acceptable values are `CodeMirror` and `Monaco`.
       * The setter ignores other values.
       * 
       * Note, both editors requires additional dependencies that needs to be loaded
       * outside the components. See the demo page sources for an example.
       */
      editorType: { type: String },
      /** 
       * The list of coma separated names of the editors to enable.
       * This must be the list of `id` values from the available editors.
       * Possible values: `raw,urlEncode,multipart,file`
       */
      types: { type: String, reflect: true },
      /** 
       * When set it ignores the content type processing.
       * This disables option "current header value", in raw editor, and disabled information about 
       * content-type header update.
       */
      ignoreContentType: { type: Boolean },
    };
  }

  get selected() {
    return this[selectedValue];
  }

  set selected(value) {
    const old = this[selectedValue];
    if (old === value) {
      return;
    }
    const valid = editorTypes.some((item) => item.id === value);
    if (!valid && value !== null && value !== undefined) {
      return;
    }
    this[selectedValue] = value;
    this.requestUpdate();
  }

  get value() {
    return this[valueValue];
  }

  set value(value) {
    const old = this[valueValue];
    if (old === value) {
      return;
    }
    // this is to be able to set a private filed value from
    // within the element
    this[valueValue] = value;
    this.requestUpdate();
  }

  get model() {
    return this[modelValue];
  }

  set model(value) {
    const old = this[modelValue];
    if (old === value) {
      return;
    }
    // this is to be able to set a private filed value from
    // within the element
    this[modelValue] = value;
    this.requestUpdate();
    this[modelChanged]();
  }

  /**
   * @returns {boolean} True when the current value is a file (or blob).
   */
  get hasFile() {
    const { value } = this;
    return value instanceof Blob;
  }

  get contentType() {
    return this[contentTypeValue];
  }

  set contentType(value) {
    const old = this[contentTypeValue];
    if (old === value) {
      return;
    }
    this[contentTypeValue] = value;
    this[analyzeContentType]();
    this.requestUpdate();
  }

  get editorType() {
    return this[editorTypeValue];
  }

  set editorType(value) {
    const old = this[editorTypeValue];
    if (old === value) {
      return;
    }
    this[editorTypeValue] = value;
    this.requestUpdate();
  }

  get types() {
    return this[enabledEditorsValue];
  }

  set types(value) {
    const old = this[enabledEditorsValue];
    if (old === value) {
      return;
    }
    this[enabledEditorsValue] = value;
    this[effectiveEditorsValue] = this[computeEffectiveEditors](value);
    this.requestUpdate('types', old);
  }

  /**
   * @returns {Readonly<EditorType[]>} The final list of editors to render.
   */
  get effectiveEditors() {
    return this[effectiveEditorsValue] || editorTypes;
  }

  constructor() {
    super();

    this.selected = 'raw';
    this.value = '';
    this.compatibility = false;
    this.outlined = false;
    this.disabled = false;
    this.autoEncode = false;
    this.ignoreContentType = false;
    /** 
     * @type {string}
     */
    this.contentType = undefined;
    /** 
     * @type {BodyMetaModel[]}
     */
    this.model = undefined;
    this[editorTypeValue] = 'Monaco';
    this[dropHandler] = this[dropHandler].bind(this);
    this[dragOverHandler] = this[dragOverHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('drop', this[dropHandler]);
    this.addEventListener('dragover', this[dragOverHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('drop', this[dropHandler]);
    this.removeEventListener('dragover', this[dragOverHandler]);
  }

  /**
   * This must be called only when the `model` property change from the 
   * outside. It restores values depending on the selected editor.
   */
  [modelChanged]() {
    const { selected, model } = this;
    if (!model) {
      return;
    }
    if (selected === 'file') {
      this[restoreFileModel]();
    }
  }

  /**
   * Restores file value from the model, if exists
   */
  [restoreFileModel]() {
    const fileModel = /** @type ApiType[] */ (this[readMetaModel]('file'));
    if (!Array.isArray(fileModel) || !fileModel.length) {
      this[valueValue] = '';
      return;
    }
    const [item] = fileModel;
    const { name, value } = item;
    const blob = BodyProcessor.dataURLtoBlob(value);
    // @ts-ignore
    blob.name = name;
    this[valueValue] = blob;
  }

  /**
   * Dispatches the `input` event
   */
  [notifyInput]() {
    this.dispatchEvent(new Event('change'));
  }

  /**
   * A handler for the editor selection. It activates an editor, if necessary.
   * @param {CustomEvent} e
   */
  async [typeChangeHandler](e) {
    const id = e.detail.selected;
    if (this[selectedValue] === id) {
      return;
    }
    this[selectedValue] = id;
    this[analyzeContentType]();
    if (id === 'raw') {
      const model = /** @type RawBody[] */ (this[readMetaModel]('raw'));
      let value = '';
      if (Array.isArray(model) && model.length) {
        value = model[0].value;
      }
      this.value = value;
    }
    await this.requestUpdate();
    this.notifyResize();
    if (id === 'file') {
      this[restoreFileModel]();
      this[notifyInput]();
    } else if (id === 'urlEncode') {
      const editor = this.shadowRoot.querySelector('body-formdata-editor');
      this.value = editor.value;
      this[notifyInput]();
    } else if (id === 'multipart') {
      const editor = this.shadowRoot.querySelector('body-multipart-editor');
      this.value = editor.value;
      this[notifyInput]();
    }
    this.dispatchEvent(new CustomEvent('select'));
  }

  /**
   * A handler for the file pick button click.
   * Activates the file input.
   */
  [pickFileHandler]() {
    const input = /** @type HTMLInputElement */ (this.shadowRoot.querySelector('.binary-hidden'));
    input.click();
  }

  /**
   * A handler for the file file selection in the file input.
   * Sets the value to the file.
   * @param {Event} e
   */
  async [fileChangeHandler](e) {
    const input = /** @type HTMLInputElement */ (e.target);
    const { files } = input;
    const file = files[0];
    if (!file) {
      return;
    }
    this[valueValue] = file;
    const fileData = await BodyProcessor.blobToString(file);
    const model = [{ name: file.name, value: fileData }];
    this[setMetaModel]('file', model);
    this[notifyInput]();
    this.requestUpdate();
  }

  /**
   * Clears the current value
   */
  [clearValueHandler]() {
    this.value = '';
    this.model = undefined;
    this[notifyInput]();
  }

  /**
   * Reads editor view model
   * @param {string} editor The editor id
   * @returns {(ApiType|MultipartBody|RawBody)[]|undefined} The view model
   */
  [readMetaModel](editor) {
    const meta = /** @type BodyMetaModel[] */ (this.model);
    if (!meta || !Array.isArray(meta)) {
      return undefined;
    }
    const item = meta.find((model) => model.type === editor);
    if (!item) {
      return undefined;
    }
    if (Array.isArray(item.viewModel)) {
      return item.viewModel;
    }
    return undefined;
  }

  /**
   * Sets editor view model on the local model
   * @param {string} editor The editor id
   * @param {(ApiType|MultipartBody|RawBody)[]} model The view model
   */
  [setMetaModel](editor, model) {
    if (!Array.isArray(this[modelValue])) {
      this[modelValue] = /** @type BodyMetaModel[] */ ([]);
    }
    const meta = /** @type BodyMetaModel[] */ (this.model);
    const index = meta.findIndex((item) => item.type === editor);
    if (index === -1) {
      meta.push({ type: editor, viewModel: model });
    } else {
      meta[index].viewModel = model;
    }
  }

  /**
   * A handler for the change event dispatched by the 
   * `urlEncode` editor.
   * Updated the local value, model, and notifies the change.
   * @param {Event} e
   */
  [urlEncodeChangeHandler](e) {
    const editor = /** @type BodyFormdataEditorElement */ (e.target);
    const { value, model } = editor;
    this[valueValue] = value;
    this[setMetaModel]('urlEncode', model);
    this[notifyInput]();
    // do not request update here.
  }

  /**
   * A handler for the change event dispatched by the `raw` editor.
   * Updated the local value, model, and notifies the change.
   * @param {Event} e
   */
  [rawChangeHandler](e) {
    const editor = /** @type BodyRawEditorElement */ (e.target);
    const { value } = editor;
    this[valueValue] = value;
    const model = /** @type RawBody[] */ ([{
      value,
    }]);
    this[setMetaModel]('raw', model);
    this[notifyInput]();
  }

  /**
   * A handler for the change event dispatched by the `CodeMirror` editor.
   * Updated the local value, model, and notifies the change.
   * @param {Event} e
   */
  [codeMirrorChangeHandler](e) {
    const editor = /** @type CodeMirrorElement */ (e.target);
    const { value } = editor;
    this[valueValue] = value;
    const model = /** @type RawBody[] */ ([{
      value,
    }]);
    this[setMetaModel]('raw', model);
    this[notifyInput]();
  }

  /**
   * A handler for the change event dispatched by the 
   * `multipart` editor.
   * Updated the local value, model, and notifies the change.
   * @param {Event} e
   */
  [multipartChangeHandler](e) {
    const editor = /** @type BodyMultipartEditorElement */ (e.target);
    const { value, model } = editor;
    this[valueValue] = value;
    this[setMetaModel]('multipart', model);
    this[notifyInput]();
  }

  /**
   * Toggles the multipart body preview 
   * @todo This should also support x-www-formdata 
   */
  [togglePreviewHandler]() {
    this[previewDialogOpened] = !this[previewDialogOpened];
    this[previewValue] = undefined;
    this[generatingPreview] = false;
    this.requestUpdate();
    if (this[previewDialogOpened]) {
      this[generatingPreview] = true;
      this[generatePreview]();
    }
  }

  /**
   * Generates a preview for multipart data.
   * @todo This should also support x-www-formdata 
   */
  async [generatePreview]() {
    await this.updateComplete;
    const generator = new MultipartGenerator(this.value);
    const result = await generator.generatePreview();
    this[previewValue] = result;
    this[generatingPreview] = false;
    await this.requestUpdate();
    const dialog = this.shadowRoot.querySelector('anypoint-dialog');
    dialog.notifyResize();
  }

  /**
   * Handler for the preview dialog close event.
   * Cleans up the preview data.
   */
  [previewClosedHandler]() {
    this[previewValue] = undefined;
    this[generatingPreview] = false;
    this[previewDialogOpened] = false;
    this.requestUpdate();
  }

  /**
   * Checks whether the current content type header value matches the selected editor.
   * If not it renders a warning message.
   */
  [analyzeContentType]() {
    const mime = this[contentTypeValue];
    if (!mime || typeof mime !== 'string') {
      this[invalidMimeValue] = false;
      this[mimeValue] = undefined;
      return;
    }
    let ct = mime;
    const semicolon = ct.indexOf(';');
    if (semicolon !== -1) {
      ct = ct.substr(0, semicolon);
    }
    this[mimeValue] = ct;
    if (!ct) {
      this[invalidMimeValue] = false;
      return;
    }
    const { selected } = this;
    if (selected === 'multipart') {
      if (ct !== 'multipart/form-data') {
        this[invalidMimeValue] = true;
        this[invalidMimeMessage] = 1;
      } else {
        this[invalidMimeValue] = false;
      }
    } else if (selected === 'urlEncode') {
      if (ct !== 'www-url-form-encoded') {
        this[invalidMimeValue] = true;
        this[invalidMimeMessage] = 2;
      } else {
        this[invalidMimeValue] = false;
      }
    } else {
      this[invalidMimeValue] = false;
    }
  }

  /**
   * Automatically fixes content type problem.
   */
  [autoFixMime]() {
    const { selected } = this;
    let updated = '';
    if (selected === 'urlEncode') {
      updated = 'www-url-form-encoded';
    } else if (selected === 'multipart') {
      updated = 'multipart/form-data';
    }
    RequestEvents.State.contentTypeChange(this, updated);
  }

  /**
   * A handler for the mime type selection.
   * @param {CustomEvent} e
   */
  [mimeTypeChangeHandler](e) {
    const id = e.detail.selected;
    if (this[mimeValue] === id) {
      return;
    }
    RequestEvents.State.contentTypeChange(this, id);
  }

  /**
   * 
   * @param {DragEvent} e 
   */
  async [dropHandler](e) {
    e.preventDefault();
    const { dataTransfer } = e;
    const { files } = dataTransfer;
    if (!files.length) {
      return;
    }
    const file = files[0];
    const { selected } = this;
    if (selected === 'file') {
      this.value = file;
    } else if (selected === 'multipart') {
      const editor = this.shadowRoot.querySelector('body-multipart-editor');
      if (!e.ctrlKey && !e.metaKey) {
        editor.value = new FormData();
      }
      const ps = Array.from(files).map((item) => editor.addFile(item));
      await Promise.all(ps);
    } else {
      this.value = await BodyProcessor.fileToString(file);
      const { type } = file;
      if (type) {
        RequestEvents.State.contentTypeChange(this, type);
      }
    }
    this[notifyInput]();
  }

  /**
   * @param {DragEvent} e 
   */
  [dragOverHandler](e) {
    e.preventDefault();
  }

  /**
   * Handles the change to the `enabledEditors` property and, when set, computes a list of
   * editors to enable in the view. The resulted list of a sublist of the `editorTypes` list.
   * @param {string=} list
   * @returns {Readonly<EditorType[]>|undefined}
   */
  [computeEffectiveEditors](list) {
    if (!list || typeof list !== 'string') {
      return undefined;
    }
    const parts = list.split(',').map((item) => item.trim());
    const result = editorTypes.filter((item) => parts.includes(item.id));
    return Object.freeze(result);
  }
  
  render() {
    return html`
    <div class="actions">
      ${this[bodyTypeSelectorTemplate]()}
      ${this[mainActionsTemplate]()}
    </div>
    ${this[invalidMimeTemplate]()}
    <div id="container">
      ${this[editorTemplate]()}
    </div>
    ${this[previewTemplate]()}
    `;
  }

  /**
   * @returns {TemplateResult} The template for the dropdown menu for the editor type
   */
  [bodyTypeSelectorTemplate]() {
    const { compatibility, outlined, disabled, selected } = this;
    return html`
    <anypoint-dropdown-menu
      noLabelFloat
      ?outlined="${outlined}"
      ?compatibility="${compatibility}"
      ?disabled="${disabled}"
      title="Select editor type"
      @select="${cancelEvent}"
    >
      <label slot="label">Editor type</label>
      <anypoint-listbox
        slot="dropdown-content"
        attrforselected="data-type"
        .selected="${selected}"
        ?disabled="${disabled}"
        ?compatibility="${compatibility}"
        @activate="${this[typeChangeHandler]}"
      >
        ${this[bodyTypeOptionsTemplate]()}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    ${this[editorActions]()}
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the main editor actions.
   */
  [mainActionsTemplate]() {
    const { selected, compatibility, outlined, disabled, ignoreContentType } = this;
    if (selected !== 'raw') {
      return '';
    }
    const mode = this[mimeValue];
    return html`
    <div class="main-actions">
      <anypoint-dropdown-menu
        noLabelFloat
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        title="Select media type. This overrides the content-type header"
        @select="${cancelEvent}"
      >
        <label slot="label">Mime type</label>
        <anypoint-listbox
          slot="dropdown-content"
          attrforselected="data-type"
          .selected="${mode}"
          ?disabled="${disabled}"
          ?compatibility="${compatibility}"
          @activate="${this[mimeTypeChangeHandler]}"
        >
          ${ignoreContentType ? 
            html`<anypoint-item data-type="" ?compatibility="${compatibility}" title="Do not use any formatting">None</anypoint-item>` : 
            html`<anypoint-item data-type="" ?compatibility="${compatibility}" title="Inherited from the headers">Current headers value</anypoint-item>`}
          <anypoint-item data-type="application/json" ?compatibility="${compatibility}">JSON</anypoint-item>
          <anypoint-item data-type="application/xml" ?compatibility="${compatibility}">XML</anypoint-item>
          <anypoint-item data-type="text/html" ?compatibility="${compatibility}">HTML</anypoint-item>
          <anypoint-item data-type="text/css" ?compatibility="${compatibility}">CSS</anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown-menu>
    </div>
    `;
  }

  /**
   * Add editor specific actions to the top toolbar.
   * @returns
   */
  [editorActions]() {
    if (this.selected !== 'multipart') {
      return '';
    }
    const icon = this[previewDialogOpened] ? 'visibilityOff' : 'visibility';
    return html`
    <div class="editor-actions">
      <anypoint-icon-button 
        title="Preview generated body. May slow down your system." 
        @click="${this[togglePreviewHandler]}"
        ?active="${this[previewDialogOpened]}"
      >
        <arc-icon .icon="${icon}"></arc-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  [bodyTypeOptionsTemplate]() {
    const { compatibility, effectiveEditors } = this;
    return html`
    ${effectiveEditors.map((info) => html`<anypoint-item data-type="${info.id}" ?compatibility="${compatibility}" title="${info.title}">${info.label}</anypoint-item>`)}
    `;
  }

  /**
   * @returns {TemplateResult} A template for currently rendered editor
   */
  [editorTemplate]() {
    switch(this.selected) {
      case 'raw': return this[rawEditorTemplate]();
      case 'urlEncode': return this[urlEncodeEditorTemplate]();
      case 'multipart': return this[multipartEditorTemplate]();
      case 'file': return this[fileEditorTemplate]();
      default: return this[noEditorTemplate]();
    }
  }

  /**
   * @returns {TemplateResult} The template for the raw editor
   */
  [rawEditorTemplate]() {
    let { value } = this;
    const model = /** @type RawBody[] */ (this[readMetaModel]('raw'));
    const hasModel = Array.isArray(model) && model.length;
    if (typeof value !== 'string') {
      value = '';
    }
    if (!value && hasModel) {
      const [item] = model;
      value = item.value;
    }
    const editor = this[editorTypeValue];
    if (editor === 'CodeMirror') {
      return this[codeMirrorTemplate](value);
    }
    return this[monacoTemplate](value);
  }

  /**
   * @param {string} value The editor value
   * @returns {TemplateResult} The template for the Monaco editor
   */
  [monacoTemplate](value) {
    const { contentType } = this;
    return html`
    <body-raw-editor 
      .value="${value}" 
      .contentType="${contentType}"
      @change="${this[rawChangeHandler]}"
    ></body-raw-editor>`;
  }

  /**
   * @param {string} value The editor value
   * @returns {TemplateResult} The template for the CodeMirror editor
   */
  [codeMirrorTemplate](value) {
    /* global CodeMirror */
    // @ts-ignore
    if (typeof CodeMirror === 'undefined') {
      return html`<p>CodeMirror editor is not loaded.</p>`;
    }
    const gutters = ["CodeMirror-lint-markers"];
    const mode = this[mimeValue];
    let lint;
    // @ts-ignore
    if (mode && String(mode).includes('json') && CodeMirror.lint) {
      // @ts-ignore
      lint = CodeMirror.lint.json;
      gutters.push('code-mirror-lint');
    } else {
      lint = false;
    }
    return html`
    <code-mirror
      .mode="${mode}"
      @value-changed="${this[rawChangeHandler]}"
      lineNumbers
      .gutters="${gutters}"
      .value="${value}"
      .lint="${lint}"
      @input="${this[codeMirrorChangeHandler]}"
    ></code-mirror>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the www-url-form-encoded editor
   */
  [urlEncodeEditorTemplate]() {
    const { autoEncode, value } = this;
    const model = /** @type ApiType[] */ (this[readMetaModel]('urlEncode'));
    // when the model is generated for the view then the value should not be set
    // as it would override the previously generated model.
    const effectiveValue = model ? undefined : value;
    return html`
      <body-formdata-editor 
        ?autoEncode="${autoEncode}"
        .value="${effectiveValue}"
        .model="${model}"
        @change="${this[urlEncodeChangeHandler]}"
      ></body-formdata-editor>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the multipart editor
   */
  [multipartEditorTemplate]() {
    const { value, ignoreContentType } = this;
    const model = /** @type MultipartBody[] */ (this[readMetaModel]('multipart'));
    // when the model is generated for the view then the value should not be set
    // as it would override the previously generated model.
    const effectiveValue = model ? undefined : value;
    return html`
      <body-multipart-editor 
        .value="${effectiveValue}"
        .model="${model}"
        ?ignoreContentType="${ignoreContentType}"
        @change="${this[multipartChangeHandler]}"
      ></body-multipart-editor>
    `;
  }

  /**
   * @returns {TemplateResult} A template for the file input editor
   */
  [fileEditorTemplate]() {
    const { compatibility, ignoreContentType } = this;
    return html`
    <anypoint-button emphasis="medium" ?compatibility="${compatibility}" @click="${this[pickFileHandler]}">Choose a file</anypoint-button>
    ${this[fileDetailTemplate]()}
    <input type="file" class="binary-hidden" @change="${this[fileChangeHandler]}"/>
    ${ignoreContentType ? '' : html`<p class="mime-info">
      <arc-icon icon="info" class="info"></arc-icon>
      The content-type header will be updated for this request when the HTTP message is generated.
    </p>`}
    `;
  }

  /**
   * @returns {TemplateResult} A template for the missing selection
   */
  [noEditorTemplate]() {
    return html`<div class="empty-editor"></div>`;
  }

  /**
   * @returns {TemplateResult|string} A template for the file details.
   */
  [fileDetailTemplate]() {
    if (!this.hasFile) {
      this[restoreFileModel]();
    }
    if (!this.hasFile) {
      return '';
    }
    const { value, compatibility } = this;
    const { size, name } = /** @type File */ (value);
    return html`
    <div class="section-title file-padding">Selected file</div>
    <div class="file-info">
      <span class="file-name">${name || 'unknown name'}</span>
      <span class="file-size">${size} bytes</span>
      <anypoint-icon-button
        class="action-icon delete-icon"
        title="Remove file"
        @click="${this[clearValueHandler]}"
        ?compatibility="${compatibility}"
        aria-label="Activate to remove the file"
      >
        <arc-icon icon="deleteIcon"></arc-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  [previewTemplate]() {
    const loading = this[generatingPreview];
    const opened = this[previewDialogOpened];
    const value = loading ? '' : this[previewValue];
    return html`
    <anypoint-dialog ?opened="${opened}" @closed="${this[previewClosedHandler]}">
      <h2>Body preview</h2>
      <anypoint-dialog-scrollable>
        <pre><code>${value}</code></pre>
        ${loading? html`
          <p>loading preview</p>
          <progress></progress>
        ` : ''}
      </anypoint-dialog-scrollable>
      <div class="buttons">
        <anypoint-button data-dialog-confirm autofocus>Close</anypoint-button>
      </div>
    </anypoint-dialog>
    `;
  }

  [invalidMimeTemplate]() {
    if (!this[invalidMimeValue]) {
      return '';
    }
    const id = this[invalidMimeMessage];
    return html`
    <div class="invalid-mime">
      <arc-icon icon="warning" class="warning-icon"></arc-icon>
      ${id === 1 ? this[fixableInvalidMimeTemplate]('multipart/form-data') : ''}
      ${id === 2 ? this[fixableInvalidMimeTemplate]('www-url-form-encoded') : ''}
    </div>
    `;
  }

  /**
   * @param {string} suggested
   * @returns {TemplateResult} A template for fixable mime type mismatch message.
   */
  [fixableInvalidMimeTemplate](suggested) {
    return html`
      <p class="message">
        The <code>content-type</code> header has different value than <b>${suggested}</b>.
      </p>
      <anypoint-button class="fix" title="Updates the content type header for the request" @click="${this[autoFixMime]}">Fix</anypoint-button>
    `;
  }
}
