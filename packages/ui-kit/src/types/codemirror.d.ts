declare module '@codemirror/state' {
  export class EditorState {
    static create(config: any): EditorState;
    readonly doc: {
      toString(): string;
      length: number;
    };
  }

  export type Extension = any;
}

declare module '@codemirror/view' {
  export class EditorView {
    constructor(config: { state: any; parent: HTMLElement });
    destroy(): void;
    dispatch(transaction: any): void;
    static editable: {
      of(value: boolean): any;
    };
    static updateListener: {
      of(listener: (update: any) => void): any;
    };
    state: import('@codemirror/state').EditorState;
  }
}

declare module '@codemirror/lang-json' {
  export function json(): any;
}

declare module '@codemirror/language' {
  export const indentUnit: {
    of(value: string): any;
  };
  export class LanguageSupport {
    constructor(language: any, extensions?: any[]);
  }
  export const StreamLanguage: {
    define(config: any): any;
  };
}

declare module '@lezer/highlight' {
  export function styleTags(tags: any): any;
  export const tags: Record<string, any>;
}
