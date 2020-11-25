import { html } from 'lit-html';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { DemoPage } from '@advanced-rest-client/arc-demo-helper';
// import { DataGenerator } from '@advanced-rest-client/arc-data-generator';
import { PayloadProcessor } from '@advanced-rest-client/arc-electron-payload-processor';
import { RequestEventTypes } from '@advanced-rest-client/arc-events';
import '@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import '../body-editor.js';

/** @typedef {import('../').BodyEditorElement} BodyEditorElement */

const valueKey = 'demo.bodyEditor.value';
const modelKey = 'demo.bodyEditor.model';
const editorKey = 'demo.bodyEditor.editor';

class ComponentPage extends DemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'autoEncode', 'value', 'contentType', 'editorType', 'initializing'
    ]);
    this.componentName = 'body-editor';
    this.renderViewControls = true;
    this.autoEncode = false;
    this.initializing = true;
    this.value = undefined;
    this.meta = undefined;
    this.editorType = undefined;
    // this.generator = new DataGenerator();
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkThemeActive = true;
    }

    this.valueChange = this.valueChange.bind(this)
    this.selectHandler = this.selectHandler.bind(this)
    this.contentTypeChanged = this.contentTypeChanged.bind(this)
    this.editorTypeChanged = this.editorTypeChanged.bind(this)
    this.restoreLocalValues();
    window.addEventListener(RequestEventTypes.State.contentTypeChange, this.editorMimeHandler.bind(this))
  }

  async restoreLocalValues() {
    await this.restoreValue();
    await this.restoreEditor();
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
    const valueRaw = window.localStorage.getItem(valueKey);
    if (!valueRaw) {
      return;
    }
    let data;
    try {
      data = JSON.parse(valueRaw);
    } catch (e) {
      this.value = valueRaw;
      return;
    }
    if (data.type === 'File') {
      this.value = PayloadProcessor.dataURLtoBlob(data.value);
      return;
    }
    if (data.type === 'FormData') {
      this.value = PayloadProcessor.restoreMultipart(data.value);
      return;
    }
    this.value = valueRaw;
  }

  async restoreEditor() {
    const allowed = ['CodeMirror', 'Monaco'];
    const valueRaw = window.localStorage.getItem(editorKey);
    if (!allowed.includes(valueRaw)) {
      await this.loadMonaco();
      return;
    }
    this.editorType = valueRaw;
    if (valueRaw === 'CodeMirror') {
      await this.loadCodeMirror();
    } else {
      await this.loadMonaco();
    }
  }

  async loadCodeMirror() {
    /* global CodeMirror */
    const prefix = '../node_modules/codemirror/';
    await this.loadScript(`${prefix}lib/codemirror.js`);
    const scripts = [
      '../node_modules/jsonlint/lib/jsonlint.js',
      // `${prefix}lib/codemirror.js`,
      `${prefix}addon/mode/loadmode.js`,
      `${prefix}mode/meta.js`,
      `${prefix}mode/javascript/javascript.js`,
      `${prefix}mode/xml/xml.js`,
      `${prefix}mode/htmlmixed/htmlmixed.js`,
      `${prefix}addon/lint/lint.js`,
      `${prefix}addon/lint/json-lint.js`,
    ];
    const ps = scripts.map((url) => this.loadScript(url));
    await Promise.all(ps);
    await this.loadScript('../node_modules/@advanced-rest-client/code-mirror-linter/code-mirror-linter.js', true);
    const link = document.createElement('link');
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = '../node_modules/codemirror/addon/lint/lint.css';
    document.head.appendChild(link);
    // @ts-ignore
    CodeMirror.modeURL = '../node_modules/codemirror/mode/%N/%N.js';
  }

  /**
   * @param {string} url The script URL
   * @param {boolean} [isModule=false] Whether the script is ESM
   * @returns {Promise<void>}
   */
  loadScript(url, isModule=false) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      if (isModule) {
        script.type = 'module';
      }
      // script.defer = false;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Unable to load ${url}`));
      const s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(script, s);
    });
  }

  async loadMonaco() {
    const base = `../node_modules/monaco-editor/`;
    MonacoLoader.createEnvironment(base);
    await MonacoLoader.loadMonaco(base);
    await MonacoLoader.monacoReady();
  }

  /**
   * @param {Event} e
   */
  valueChange(e) {
    const editor = /** @type BodyEditorElement */ (e.target);
    const { value, model, selected } = editor;
    this.value = value;
    this.render();
    this.storeValue(value);
    const meta = {
      selected,
      model,
    };
    this.meta = meta;
    window.localStorage.setItem(modelKey, JSON.stringify(meta));
  }

  /**
   * @param {Event} e
   */
  selectHandler(e) {
    const editor = /** @type BodyEditorElement */ (e.target);
    const { selected } = editor;
    if (!this.meta) {
      this.meta = {};
    }
    this.meta.selected = selected;
    window.localStorage.setItem(modelKey, JSON.stringify(this.meta));
  }

  /**
   * Stores value data in the local store
   * @param {string|File|Blob|FormData} value
   */
  async storeValue(value) {
    if (!value) {
      window.localStorage.removeItem(valueKey);
      return;
    }
    if (typeof value === 'string') {
      window.localStorage.setItem(valueKey, value);
      return;
    }
    if (value instanceof FormData) {
      const entries = await PayloadProcessor.createMultipartEntry(value);
      const data = {
        type: 'FormData',
        value: entries,
      };
      window.localStorage.setItem(valueKey, JSON.stringify(data));
      return;
    }
    const fileData = await PayloadProcessor.blobToString(value);
    const data = {
      type: 'File',
      value: fileData,
    };
    window.localStorage.setItem(valueKey, JSON.stringify(data));
  }

  /**
   * @param {Event} e
   */
  contentTypeChanged(e) {
    const select = /** @type HTMLSelectElement */ (e.target);
    this.contentType = select.value;
  }

  editorMimeHandler(e) {
    this.contentType = e.changedValue;
  }
  
  /**
   * @param {Event} e
   */
  editorTypeChanged(e) {
    const select = /** @type HTMLSelectElement */ (e.target);
    window.localStorage.setItem(editorKey, select.value);
    window.location.reload();
  }

  _demoTemplate() {
    if (this.initializing) {
      return html`<progress></progress>`;
    }
    const { value, meta={}, autoEncode, contentType, editorType } = this;
    const { selected, model } = meta;
    console.log(meta, value);
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <body-editor 
        selected="${ifDefined(selected)}" 
        .value="${value}" 
        .model="${model}"
        ?autoEncode="${autoEncode}"
        .contentType="${contentType}"
        .editorType="${editorType}"
        @change="${this.valueChange}"
        @select="${this.selectHandler}"
      ></body-editor>
    </section>

    <section class="documentation-section">
    ${value ? this.printValue(value) : ''}
    </section>
    `;
  }

  /**
   * @param {string|File|FormData} value
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
    const { editorType } = this;
    return html`
    <section class="documentation-section">
      <h3>State control</h3>
      <anypoint-switch name="autoEncode" @change="${this._toggleMainOption}">Auto encode</anypoint-switch>
      <div>
        <label id="ctLabel">Request content type</label>
        <select @blur="${this.contentTypeChanged}" aria-labelledby="ctLabel">
          <option value="">auto</option>
          <option value="application/json">application/json</option>
          <option value="application/xml">application/xml</option>
          <option value="text/html">text/html</option>
          <option value="text/css">text/css</option>
        </select>
      </div>
      <div>
        <label id="editorLabel">Raw editor</label>
        <select @blur="${this.editorTypeChanged}" aria-labelledby="editorLabel">
          <option ?selected="${editorType === 'Monaco'}" value="Monaco">Monaco</option>
          <option ?selected="${editorType === 'CodeMirror'}" value="CodeMirror">CodeMirror</option>
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
