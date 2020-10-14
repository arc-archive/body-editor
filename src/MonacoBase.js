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
import { LitElement, html } from 'lit-element';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js';
import registerProtobuf from 'monaco-proto-lint';
import {
  valueValue,
  monacoInstance,
  valueChanged,
  changeTimeout,
  notifyChange,
  generateMonacoTheme,
  generateEditorConfig,
  generateMonacoThemeRules,
  languageValue,
  monacoContainerTemplate,
  initEditor,
  monacoEditorValue,
  monacoSetValue,
} from './internals.js';

registerProtobuf(monaco);

/** @typedef {import('lit-element').TemplateResult} TemplateResult */

export class MonacoBase extends LitElement {
  static get properties() {
    return {
      /**
       * Value of this form
       */
      value: { type: Object },
      /**
       * Enables compatibility with Anypoint components.
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
    }
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
    this[monacoEditorValue] = value;
    this[monacoSetValue](value);
  }

  /**
   * @returns {monaco.editor.IStandaloneCodeEditor}
   */
  get editor() {
    return this[monacoInstance];
  }

  constructor() {
    super();
    this[valueValue] = '';
    this.readOnly = false;
    this.disabled = false;
    this.compatibility = false;
    this.outlined = false;

    this[valueChanged] = this[valueChanged].bind(this);
  }

  firstUpdated(props) {
    super.firstUpdated(props);
    this[initEditor]();
  }

  [initEditor]() {
    const container = this.shadowRoot.querySelector('#container');
    if (!container) {
      return;
    }
    const config = this[generateEditorConfig]();
    const instance = monaco.editor.create(container, config);
    instance.onDidChangeModelContent(this[valueChanged]);
    this[monacoInstance] = instance;
  }

  /**
   * @param {string} value THe value to be set on the editor
   */
  [monacoSetValue](value) {
    const { editor } = this;
    if (!editor) {
      return;
    }
    editor.setValue(value);
  }

  /**
   * A handler for the valuer change. Notifies any listener about the change.
   */
  [valueChanged]() {
    this[valueValue] = this.editor.getValue();
    this[monacoEditorValue] = this[valueValue];
    if (this[changeTimeout]) {
      window.cancelAnimationFrame(this[changeTimeout]);
    }
    this[changeTimeout] = window.requestAnimationFrame(() => {
      this[notifyChange]();
    });
  }

  /**
   * Dispatches the change event.
   */
  [notifyChange]() {
    this.dispatchEvent(new CustomEvent('change'));
  }

  /**
   * Generates ARC theme for monaco.
   */
  [generateMonacoTheme]() {
    let bgColor = getComputedStyle(document.body).getPropertyValue('--code-editor-color').trim();
    if (!bgColor) {
      bgColor = '#F5F5F5';
    }
    const rules = this[generateMonacoThemeRules]();
    const theme = /** @type monaco.editor.IStandaloneThemeData */ ({
      base: 'vs', 
      inherit: true,
      rules,
      colors: {
        "editor.background": bgColor,
      },
    });
    monaco.editor.defineTheme('ArcTheme', theme);
  }

  /**
   * @returns {monaco.editor.ITokenThemeRule[]} Rules for ARC theme for monaco.
   */
  [generateMonacoThemeRules]() {
    return [{ token: '', background: 'F5F5F5' }];
  }

  /**
   * Generates Monaco configuration
   * @returns {monaco.editor.IStandaloneEditorConstructionOptions}
   */
  [generateEditorConfig]() {
    const { readOnly, disabled } = this;
    let value = '';
    if (typeof this[monacoEditorValue] === 'string') {
      value = this[monacoEditorValue];
    }

    const language = this[languageValue];
    const config = /** monaco.editor.IStandaloneEditorConstructionOptions */ ({
      minimap: {
        enabled: false,
      },
      readOnly: readOnly || disabled,
      formatOnType: true,
      folding: true,
      tabSize: 2,
      detectIndentation: true,
      value,
    });
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      config.theme = "vs-dark";
    } else {
      this[generateMonacoTheme]();
      config.theme = 'ArcTheme';
    }
    if (language) {
      config.language = language;
    }
    return config;
  }

  render() {
    return this[monacoContainerTemplate]();
  }

  /**
   * @returns {TemplateResult} A template for the Monaco element container.
   */
  [monacoContainerTemplate]() {
    return html`<div id="container"></div>`;
  }
}