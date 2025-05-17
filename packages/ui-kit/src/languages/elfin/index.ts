import { StreamLanguage } from '@codemirror/language';
import { LanguageSupport, indentUnit } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';

// Basic ELFIN language definition
// This is a simplified version for the first implementation
export const elfin = StreamLanguage.define({
  name: 'elfin',
  
  // Token types for syntax highlighting
  tokenTable: {
    keyword: t.keyword,
    operator: t.operator,
    number: t.number,
    string: t.string,
    comment: t.comment,
    variableName: t.variableName,
    propertyName: t.propertyName,
    typeName: t.typeName,
    className: t.className,
    definition: t.definition,
  },
  
  startState() {
    return {
      indented: 0,
      inString: false,
      stringType: null,
      inComment: false,
      inDef: false,
      context: []
    };
  },
  
  token(stream, state) {
    // Handle indentation
    if (stream.sol()) {
      state.indented = stream.indentation();
    }
    
    // Skip whitespace
    if (stream.eatSpace()) return null;
    
    // Handle comments
    if (stream.match(';;')) {
      stream.skipToEnd();
      return 'comment';
    }
    
    // Handle strings
    if (state.inString) {
      if (stream.eat('\\')) {
        stream.next();
        return 'string';
      }
      if (stream.eat(state.stringType)) {
        state.inString = false;
        state.stringType = null;
        return 'string';
      }
      stream.next();
      return 'string';
    }
    
    if (stream.eat('"') || stream.eat("'")) {
      state.inString = true;
      state.stringType = stream.backUp(1) && stream.next();
      return 'string';
    }
    
    // Handle keywords
    if (stream.match(/^(fn|let|const|if|else|loop|break|continue|return|for|import|export|struct|type|enum)/)) {
      return 'keyword';
    }
    
    // Handle special keywords for ELFIN
    if (stream.match(/^(agent|intent|concept|belief|perceive|action|decide|learn|adapt)/)) {
      return 'keyword';
    }
    
    // Handle literals
    if (stream.match(/^(true|false|nil|null|undefined)/)) {
      return 'keyword';
    }
    
    // Handle numbers
    if (stream.match(/^-?\d+(\.\d+)?([eE][-+]?\d+)?/)) {
      return 'number';
    }
    
    // Handle operators
    if (stream.match(/^[+\-*\/%=<>!&|^~:?]+/)) {
      return 'operator';
    }
    
    // Handle identifiers and function names
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      if (stream.match(/\s*\(/, false)) {
        return 'def';
      }
      return 'variable';
    }
    
    // Everything else
    stream.next();
    return null;
  },
  
  indent(state, textAfter, context) {
    // Simple indentation logic
    if (textAfter && textAfter.startsWith('}')) {
      return context.indented - 2;
    }
    return state.indented + 2;
  },
  
  languageData: {
    commentTokens: { line: ";;" },
    closeBrackets: { brackets: ["(", "[", "{", "'", '"'] }
  }
});

// Create a language support instance for ELFIN
export function elfinLanguage() {
  return new LanguageSupport(elfin, [
    indentUnit.of("  ")
  ]);
}
