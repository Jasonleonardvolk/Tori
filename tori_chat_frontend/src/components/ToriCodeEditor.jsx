// TORI Chat - CodeMirror Migration Helper
// From react-codemirror2 to @uiw/react-codemirror

/*
OLD WAY (react-codemirror2):
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';

<CodeMirror
  value={code}
  options={{
    mode: 'javascript',
    theme: 'material',
    lineNumbers: true
  }}
  onBeforeChange={(editor, data, value) => {
    setCode(value);
  }}
/>

NEW WAY (@uiw/react-codemirror):
*/

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

// Example React component using new CodeMirror
export const ToriCodeEditor = ({ value, onChange, language = 'javascript' }) => {
  const getLanguageExtension = (lang) => {
    switch(lang) {
      case 'javascript': return [javascript()];
      case 'css': return [css()];
      case 'html': return [html()];
      case 'json': return [json()];
      default: return [javascript()];
    }
  };

  return (
    <CodeMirror
      value={value}
      height="400px"
      theme={oneDark}
      extensions={getLanguageExtension(language)}
      onChange={(val) => onChange(val)}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightSelectionMatches: true,
        searchKeymap: true
      }}
    />
  );
};

export default ToriCodeEditor;
