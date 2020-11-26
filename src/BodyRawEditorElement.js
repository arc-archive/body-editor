/* eslint-disable no-bitwise */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
// import * as monaco from 'monaco-editor'; // /esm/vs/editor/editor.main.js
import { RequestEvents } from '@advanced-rest-client/arc-events';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import { MonacoTheme, MonacoHelper, MonacoStyles } from '@advanced-rest-client/monaco-support';
import elementStyles from './styles/BodyEditor.styles.js';

/** @typedef {import('monaco-editor').editor.IStandaloneCodeEditor} IStandaloneCodeEditor */
/** @typedef {import('monaco-editor').editor.IStandaloneEditorConstructionOptions} IStandaloneEditorConstructionOptions */
/** @typedef {import('monaco-editor').editor.IEditorOptions} IEditorOptions */

/* global monaco */

import {
  valueValue,
  monacoInstance,
  contentTypeValue,
  languageValue,
  setLanguage,
  setupActions,
  valueChanged,
  changeTimeout,
  notifyChange,
  generateEditorConfig,
  readOnlyValue,
  setEditorConfigProperty,
  resizeHandler,
} from './internals.js';

export class BodyRawEditorElement extends ArcResizableMixin(LitElement) {
  static get styles() {
    return [elementStyles, MonacoStyles];
  }

  static get properties() {
    return {
      /**
       * A HTTP body.
       */
      value: { type: String },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /** 
       * Uses the current content type to detect language support.
       */
      contentType: { type: String },
    };
  }

  get value() {
    return this[valueValue];
  }

  set value(value) {
    const old = this[valueValue];
    if (old === value) {
      return;
    }
    this[valueValue] = value;
    const { editor } = this;
    if (editor) {
      editor.setValue(value || '');
    }
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
    const oldLang = this[languageValue];
    const lang = MonacoHelper.detectLanguage(value);
    if (oldLang === lang) {
      return;
    }
    this[languageValue] = lang;
    this[setLanguage](lang);
  }

  get readOnly() {
    return this[readOnlyValue];
  }

  set readOnly(value) {
    const old = this[readOnlyValue];
    if (old === value) {
      return;
    }
    this[readOnlyValue] = value;
    this[setEditorConfigProperty]('readOnly', value);
  }

  /**
   * @returns {IStandaloneCodeEditor}
   */
  get editor() {
    return this[monacoInstance];
  }

  constructor() {
    super();
    this[valueValue] = '';
    this[readOnlyValue] = false;

    this[valueChanged] = this[valueChanged].bind(this);
    this[resizeHandler] = this[resizeHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('resize', this[resizeHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('resize', this[resizeHandler]);
  }

  firstUpdated() {
    const config = this[generateEditorConfig]();
    const instance = monaco.editor.create(this.shadowRoot.querySelector('#container'), config);
    instance.onDidChangeModelContent(this[valueChanged]);
    this[monacoInstance] = instance;
    this[setupActions](instance);
  }

  /**
   * Handler for the `resize` event provided by the resizable mixin.
   */
  [resizeHandler]() {
    if (!this[monacoInstance]) {
      return;
    }
    this[monacoInstance].layout();
  }

  /**
   * @param {string} lang New language to set
   */
  [setLanguage](lang) {
    const { editor } = this;
    if (!editor) {
      return;
    }
    const model = editor.getModel();
    monaco.editor.setModelLanguage(model, lang);
  }

  /**
   * Sets up editor actions
   * @param {IStandaloneCodeEditor} editor
   */
  [setupActions](editor) {
    editor.addAction({
      id: 'send-http-request',
      label: 'Send request',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: () => {
        RequestEvents.send(this);
        return null;
      }
    });
  }

  [valueChanged]() {
    this[valueValue] = this.editor.getValue();
    if (this[changeTimeout]) {
      // window.clearTimeout(this[changeTimeout]);
      window.cancelAnimationFrame(this[changeTimeout]);
    }
    this[changeTimeout] = window.requestAnimationFrame(() => {
      this[notifyChange]();
    });
  }

  [notifyChange]() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Generates Monaco configuration
   * @returns {IStandaloneEditorConstructionOptions}
   */
  [generateEditorConfig]() {
    const { value='', readOnly } = this;
    const language = this[languageValue];

    let config = /** IStandaloneEditorConstructionOptions */ ({
      minimap: {
        enabled: false,
      },
      readOnly,
      formatOnType: true,
      folding: true,
      tabSize: 2,
      detectIndentation: true,
      value,
    });
    config = MonacoTheme.assignTheme(monaco, config);
    if (language) {
      config.language = language;
    }
    return config;
  }

  /**
   * @param {keyof IEditorOptions} prop The property to set
   * @param {any} value
   */
  [setEditorConfigProperty](prop, value) {
    const { editor } = this;
    if (!editor) {
      return;
    }
    const opts = {
      [prop]: value,
    };
    editor.updateOptions(opts);
  }
  
  render() {
    return html`<div id="container"></div>`;
  }
}
