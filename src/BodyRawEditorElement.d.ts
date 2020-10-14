import { LitElement, CSSResult, TemplateResult } from 'lit-element';
import * as monaco from 'monaco-editor';

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
  generateMonacoTheme,
  generateEditorConfig,
  setEditorConfigProperty,
} from './internals.js';

export class BodyRawEditorElement extends LitElement {
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

  readonly editor: monaco.editor.IStandaloneCodeEditor;

  constructor();

  firstUpdated(): void;

  /**
   * Detects editor language based on the content type header value 
   * @param mime The current content type of the request
   * @returns THe language, if detected.
   */
  [detectLanguage](mime: string): string;

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

  [generateMonacoTheme](): void;

  /**
   * Generates Monaco configuration
   */
  [generateEditorConfig](): monaco.editor.IStandaloneEditorConstructionOptions;

  [setEditorConfigProperty](prop: keyof monaco.editor.IEditorOptions, value: any): void;
  
  render(): TemplateResult;
}