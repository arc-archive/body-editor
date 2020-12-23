import { LitElement, CSSResult, TemplateResult } from 'lit-element';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin';
import * as monaco from 'monaco-editor';

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
  setEditorConfigProperty,
} from './internals.js';

export class BodyRawEditorElement extends ArcResizableMixin(LitElement) {
  static readonly styles: CSSResult[];

  /**
   * A HTTP body.
   * @attribute
   */
  value: string;
  /**
   * When set the editor is in read only mode.
   * @attribute
   */
  readOnly: boolean;
  /** 
   * Uses the current content type to detect language support.
   * @attribute
   */
  contentType: string;
  [changeTimeout]: number;
  [languageValue]: string;
  [contentTypeValue]: string;
  [monacoInstance]: string;
  [valueValue]: string;

  get editor(): monaco.editor.IStandaloneCodeEditor;

  constructor();

  firstUpdated(): void;

  /**
   * @param lang New language to set
   */
  [setLanguage](lang: string): string;

  /**
   * Sets up editor actions
   */
  [setupActions](editor: monaco.editor.IStandaloneCodeEditor): void;

  [valueChanged](): void;

  [notifyChange](): void;

  /**
   * Generates Monaco configuration
   */
  [generateEditorConfig](): monaco.editor.IStandaloneEditorConstructionOptions;

  [setEditorConfigProperty](prop: keyof monaco.editor.IEditorOptions, value: any): void;
  
  render(): TemplateResult;
}
