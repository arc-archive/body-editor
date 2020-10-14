/* eslint-disable no-bitwise */
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
import { html } from 'lit-element';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import registerProtobuf from 'monaco-proto-lint';
import 'protobufjs/dist/protobuf.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import elementStyles from './styles/Protobuf.styles.js';
import monacoStyles from './styles/Monaco.styles.js';
import { MonacoBase } from './MonacoBase.js';
import { ProtobufModel } from './lib/ProtobufModel.js'
import {
  languageValue,
  generateMonacoThemeRules,
  monacoContainerTemplate,
  emptyScreenTemplate,
  valueChanged,
  changeTimeout,
  notifyChange,
  schemaValue,
  updateModelSchema,
  modelValue,
  modelChanged,
  monacoEditorValue,
  monacoSetValue,
  schemaModel,
  updatedSchemaModel,
  messageNames,
  messageEditorTemplate,
  messageTypeSelector,
  messageTypeHandler,
  selectedMessageType,
  setupMessageType,
  messageFields,
  typeForm,
  typeFormItem,
  updateFormModel,
} from './internals.js';

registerProtobuf(monaco);

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('protobufjs')} protobuf */
/** @typedef {import('./types').ProtobufBodyMeta} ProtobufBodyMeta */
/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */

/* global protobuf */

export class BodyProtobufEditorElement extends MonacoBase {
  static get styles() {
    return [elementStyles, monacoStyles];
  }

  static get properties() {
    return {
      ...super.properties,
      /** 
       * When set the proto buffer schema editor is rendered.
       * This is a default behavior when there's no model and value.
       */
      schema: { type: Boolean },
      /**
       * Computed data model for the view.
       * Don't set both `value` and `model`. If the model exists then
       * set only it or otherwise the `value` setter override the model.
       */
      model: { type: Array },
    }
  }

  /**
   * @returns {ProtobufBodyMeta[]}
   */
  get model() {
    return this[modelValue];
  }

  /**
   * @param {ProtobufBodyMeta[]} value
   */
  set model(value) {
    const old = this[modelValue];
    if (old === value) {
      return;
    }
    this[modelValue] = value;
    this[modelChanged](value);
    // this[valueValue] = this[modelToValue]();
    // this.requestUpdate();
  }

  constructor() {
    super();
    this.schema = false;
    this[languageValue] = 'protobuf';
    /** 
     * @type {ProtobufBodyMeta[]}
     */
    this.model = undefined;
    /** 
     * @type {ProtobufBodyMeta[]}
     */
    this[modelValue] = undefined;
    /** 
     * @type {string}
     */
    this[schemaValue] = undefined;
  }

  /**
   * @returns {monaco.editor.ITokenThemeRule[]}
   */
  [generateMonacoThemeRules]() {
    return [
      { token: 'keyword', foreground: 'DB2121' },
      { token: 'typeKeyword', foreground: 'F84842', fontStyle: 'italic' },
      { token: 'identifier', foreground: '0C5ED7', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: '00CA8C', fontStyle: 'bold' },
      { token: 'comment', foreground: '7A7A7A' },
      { token: 'number', foreground: '000000', fontStyle: 'italic' },
      { token: 'string', fontStyle: 'italic' }
    ];
  }

  /**
   * Calls the super function and redefines the data model for the message editor.
   */
  [valueChanged]() {
    const schema = this.editor.getValue();
    this[monacoEditorValue] = schema;
    this[updateModelSchema](schema);
    if (this[changeTimeout]) {
      window.cancelAnimationFrame(this[changeTimeout]);
    }
    this[changeTimeout] = window.requestAnimationFrame(() => {
      this[notifyChange]();
    });
  }

  /**
   * @param {string} schema The schema value from the editor
   */
  [updateModelSchema](schema) {
    if (!Array.isArray(this.model)) {
      this[modelValue] = /** @type ProtobufBodyMeta[] */ ([]);
    }
    let [model] = this[modelValue];
    if (!model) {
      model = { requestSchema: undefined };
    }
    model.requestSchema = schema;
    this[modelValue][0] = model;
    this[updatedSchemaModel](schema);
  }

  /**
   * @param {ProtobufBodyMeta[]|undefined} model Updated model
   */
  [modelChanged](model) {
    if (!Array.isArray(model) || !model.length) {
      return;
    }
    const [item] = model;
    this[monacoEditorValue] = item.requestSchema;
    this[monacoSetValue](item.requestSchema);
    this[updatedSchemaModel](item.requestSchema);
    this[selectedMessageType] = item.message;
    this[setupMessageType](item.message);
    this.requestUpdate();
  }

  /**
   * Updates the message model generated from the protobuf library
   * @param {string} value The message schema editor value
   */
  [updatedSchemaModel](value) {
    if (typeof value !== 'string' || !value) {
      this[schemaModel] = undefined;
      this[messageNames] = undefined;
      return;
    }
    try {
      // @ts-ignore
      const schema = protobuf.parse(value);
      this[schemaModel] = schema;
      this[messageNames] = Object.keys(schema.root.nested);
      this[setupMessageType](this[selectedMessageType]);
      this.requestUpdate();
    } catch (e) {
      // ...
      console.warn(e);
    }
  }

  /**
   * A handler for the message type selection.
   * @param {CustomEvent} e
   */
  [messageTypeHandler](e) {
    const id = e.detail.selected;
    if (this[selectedMessageType] === id) {
      return;
    }
    this[selectedMessageType] = id;
    if (!Array.isArray(this.model)) {
      this[modelValue] = /** @type ProtobufBodyMeta[] */ ([]);
    }
    let [model] =  /** @type ProtobufBodyMeta[] */ (this[modelValue]);
    if (!model) {
      model = { requestSchema: undefined };
    }
    model.message = id;
    this[modelValue][0] = model;
    this[notifyChange]();
    this[setupMessageType](id);
  }

  /**
   * Selects the Type schema for the body editor
   * @param {string} id The selected message type
   * @returns
   */
  [setupMessageType](id) {
    if (!id || !this[schemaModel]) {
      return;
    }
    const message = this[schemaModel].root[id];
    if (!message) {
      return;
    }
    const { fields } = message;
    this[messageFields] = fields;
    this[updateFormModel](fields);
    this.requestUpdate();
  }

  /**
   * @param {object} fields
   */
  [updateFormModel](fields) {
    if (!fields) {
      return;
    }
    const helper = new ProtobufModel();
    const viewModel = helper.generateFormModel(fields, this[schemaModel].root.nested);
    console.log(viewModel);
  }

  render() {
    // const { schema, model } = this;
    // if (!schema && !Array.isArray(model)) {
    //   return this[emptyScreenTemplate]();
    // }
    // return this[monacoContainerTemplate]();
    return html`
    <div class="editors">
      <div class="monaco-wrapper">
        ${this[monacoContainerTemplate]()}
      </div>
      <div class="message-wrapper">
        ${this[messageEditorTemplate]()}
      </div>
    </div>
    `;
  }

  [emptyScreenTemplate]() {
    return html`
    <div class="empty-screen">
      <p>To start with the protocol buffers define a message type first</p>
      <p><a href="https://developers.google.com/protocol-buffers/docs/overview" target="_blank">Learn more</a> about the message definition.</p>
    </div>`;
  }

  [messageEditorTemplate]() {
    const names = /** @type string[] */ (this[messageNames]);
    if (!Array.isArray(names) || !names.length) {
      return html`
      <div class="empty-screen">
        <p>To start with the protocol buffers define a message type first</p>
        <p><a href="https://developers.google.com/protocol-buffers/docs/overview" target="_blank">Learn more</a> about the message definition.</p>
      </div>
      `;
    }
    return html`
      ${this[messageTypeSelector](names)}
      ${this[typeForm]()}
    `;
  }

  /**
   * @param {string[]} names The list of message names
   * @returns {TemplateResult} The template for the type selector
   */
  [messageTypeSelector](names) {
    const { outlined, compatibility, disabled } = this;
    const selected = this[selectedMessageType];
    return html`
    <div class="message-selector">
      <anypoint-dropdown-menu
        noLabelFloat
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?disabled="${disabled}"
        title="Select message type to prepare the request body"
        class="type-selector"
      >
        <label slot="label">Message type</label>
        <anypoint-listbox
          slot="dropdown-content"
          attrforselected="data-type"
          .selected="${selected}"
          ?disabled="${disabled}"
          ?compatibility="${compatibility}"
          @activate="${this[messageTypeHandler]}"
        >
          ${names.map((name) => html`<anypoint-item data-type="${name}" ?compatibility="${compatibility}">${name}</anypoint-item>`)}
        </anypoint-listbox>
      </anypoint-dropdown-menu>
    </div>
    `;
  }

  [typeForm]() {
    const fields = this[messageFields];
    if (!fields) {
      return html`<p>This message has no fields definition.</p>`;
    }
    console.log(fields);
    return html`fields`;
  }
}