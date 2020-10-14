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
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js';
import { RequestEvents } from '@advanced-rest-client/arc-events';
import elementStyles from './styles/BodyEditor.styles.js';
import monacoStyles from './styles/Monaco.styles.js';
import { MonacoBase } from './MonacoBase.js';
import {
  valueValue,
  monacoInstance,
  contentTypeValue,
  detectLanguage,
  languageValue,
  setLanguage,
  setupActions,
  valueChanged,
  changeTimeout,
  notifyChange,
} from './internals.js';

export class BodyRawEditorElement extends MonacoBase {
  static get styles() {
    return [elementStyles, monacoStyles];
  }

  static get properties() {
    return {
      ...super.properties,
      /** 
       * Uses the current content type to detect language support.
       */
      contentType: { type: String },
    };
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
    const lang = this[detectLanguage](value);
    if (oldLang === lang) {
      return;
    }
    this[languageValue] = lang;
    this[setLanguage](lang);
  }


  firstUpdated() {
    super.firstUpdated();
    this[setupActions](this[monacoInstance]);
  }

  /**
   * Detects editor language based on the content type header value 
   * @param {string} mime The current content type of the request
   * @returns {string|undefined} THe language, if detected.
   */
  [detectLanguage](mime) {
    if (!mime || typeof mime !== 'string') {
      return undefined;
    }
    let ct = mime;
    const semicolon = ct.indexOf(';');
    if (semicolon !== -1) {
      ct = ct.substr(0, semicolon);
    }
    switch (ct) {
      case 'application/json':
      case 'application/x-json': return 'json';
      case 'application/svg+xml':
      case 'application/xml': return 'xml';
      case 'text/html': return 'html';
      case 'text/css': return 'css';
      default: return undefined;
    }
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
   * @param {monaco.editor.IStandaloneCodeEditor} editor
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
}