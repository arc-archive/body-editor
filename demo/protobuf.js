import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { PayloadProcessor } from '@advanced-rest-client/arc-electron-payload-processor';
import { RequestEventTypes } from '@advanced-rest-client/arc-events';
import '@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import '../body-protobuf-editor.js';

/** @typedef {import('../').BodyEditorElement} BodyEditorElement */

const valueKey = 'demo.bodyProtoEditor.value';
const modelKey = 'demo.bodyProtoEditor.model';

class ComponentPage extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'value', 'contentType', 'initializing'
    ]);
    this.componentName = 'body-editor';
    this.renderViewControls = true;
    this.initializing = true;
    this.value = undefined;
    this.meta = undefined;
    this.generator = new DataGenerator();
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkThemeActive = true;
    }
    this.loadMonaco();

    this.valueChange = this.valueChange.bind(this);
    this.contentTypeChanged = this.contentTypeChanged.bind(this);
    this.restoreLocalValues();
    window.addEventListener(RequestEventTypes.State.contentTypeChange, this.editorMimeHandler.bind(this))
  }

  async restoreLocalValues() {
    await this.restoreValue();
    const modelRaw = window.localStorage.getItem(modelKey);
    if (modelRaw) {
      try {
        const model = JSON.parse(modelRaw);
        if (model) {
          this.meta = model;
        }
      } catch (e) {
        // ....
      }
    }
    this.initializing = false;
  }

  async restoreValue() {
    // const valueRaw = window.localStorage.getItem(valueKey);
    // if (!valueRaw) {
    //   return;
    // }
    // let data;
    // try {
    //   data = JSON.parse(valueRaw);
    // } catch (e) {
    //   this.value = valueRaw;
    //   return;
    // }
    // if (data.type === 'File') {
    //   this.value = PayloadProcessor.dataURLtoBlob(data.value);
    //   return;
    // }
    // if (data.type === 'FormData') {
    //   this.value = PayloadProcessor.restoreMultipart(data.value);
    //   return;
    // }
    // this.value = valueRaw;
  }


  loadMonaco() {
    // @ts-ignore
    window.MonacoEnvironment = {
      getWorker: (moduleId, label) => {
        console.log(moduleId, label);
        let url;
        const prefix = '../node_modules/monaco-editor/esm/vs/';
        const langPrefix = `${prefix}language/`;
        switch (label) {
          case 'json': url = `${langPrefix}json/json.worker.js`; break;
          case 'css': url = `${langPrefix}css/css.worker.js`; break;
          case 'html': url = `${langPrefix}html/html.worker.js`; break;
          case 'javascript':
          case 'typescript': url = `${langPrefix}typescript/ts.worker.js`; break;
          default: url = `${prefix}editor/editor.worker.js`; break;
        }
        return new Worker(url, {
          type: 'module'
        });
      }
    }
  }

  /**
   * @param {Event} e
   */
  valueChange(e) {
    const editor = /** @type BodyEditorElement */ (e.target);
    const { value, model } = editor;
    this.value = value;
    this.render();
    this.storeValue(value);
    this.meta = model;
    window.localStorage.setItem(modelKey, JSON.stringify(model));
  }

  /**
   * Stores value data in the local store
   * @param {string|File|Blob|FormData} value
   */
  async storeValue(value) {
    // if (!value) {
    //   window.localStorage.removeItem(valueKey);
    //   return;
    // }
    // if (typeof value === 'string') {
    //   window.localStorage.setItem(valueKey, value);
    //   return;
    // }
    // if (value instanceof FormData) {
    //   const entries = await PayloadProcessor.createMultipartEntry(value);
    //   const data = {
    //     type: 'FormData',
    //     value: entries,
    //   };
    //   window.localStorage.setItem(valueKey, JSON.stringify(data));
    //   return;
    // }
    // const fileData = await PayloadProcessor.blobToString(value);
    // const data = {
    //   type: 'File',
    //   value: fileData,
    // };
    // window.localStorage.setItem(valueKey, JSON.stringify(data));
  }

  editorMimeHandler(e) {
    this.contentType = e.changedValue;
  }

  /**
   * @param {Event} e
   */
  contentTypeChanged(e) {
    const select = /** @type HTMLSelectElement */ (e.target);
    this.contentType = select.value;
  }

  _demoTemplate() {
    if (this.initializing) {
      return html`<progress></progress>`;
    }
    const { value, meta, contentType } = this;
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <body-protobuf-editor
        .value="${value}" 
        .model="${meta}"
        .contentType="${contentType}"
        @change="${this.valueChange}"
      ></body-protobuf-editor>
    </section>

    <section class="documentation-section">
    ${value ? this.printValue(value) : ''}
    </section>
    `;
  }

  /**
   * @param {string|Blob|FormData} value
   */
  printValue(value) {
    const parts = [];
    if (typeof value === 'string') {
      parts.push(String(value));
    } else if (value instanceof Blob) {
      parts.push(`[File ${value.name}]`);
    } else if (value instanceof FormData) {
      // @ts-ignore
      for(const pair of value.entries()) {
        const [name, partValue] = pair;
        parts.push(html`${name}: ${this.partValueDetailsTemplate(partValue)}\n`);
      }
    }
    return html`<pre><code>${parts}</code></pre>`;
  }

  /**
   * @param {string|File} value
   */
  partValueDetailsTemplate(value) {
    if (typeof value === 'string') {
      return html`${value}`;
    }
    const { size, type, name } = value;
    return html`${name} (${type}), ${size} bytes`;
  }

  controlsTemplate() {
    return html`
    <section class="documentation-section">
      <h3>State control</h3>
      <div>
        <label id="ctLabel">Request content type</label>
        <select @change="${this.contentTypeChanged}" aria-labelledby="ctLabel">
          <option value="">auto</option>
          <option value="application/json">application/json</option>
          <option value="application/xml">application/xml</option>
          <option value="text/html">text/html</option>
          <option value="text/css">text/css</option>
        </select>
      </div>
    </section>
    `;
  }

  contentTemplate() {
    return html`
      <h2>Body editor</h2>
      ${this._demoTemplate()}
      ${this.controlsTemplate()}
    `;
  }
}

const instance = new ComponentPage();
instance.render();