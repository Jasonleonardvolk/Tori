# Main Parser Integration Plan

This document outlines the detailed plan for integrating the module system with the main ELFIN parser. This integration is a key milestone in Phase 2 of the ELFIN development roadmap.

## Overview

The main parser integration involves extending the existing parser to support imports and templates. This will enable code reuse and composition, which are essential features for building complex ELFIN systems.

## 1. AST Extensions (3-4 days)

The first step is to extend the Abstract Syntax Tree (AST) nodes to include import and template information.

### 1.1. Import Declaration Node

Create a new AST node for import declarations:

```python
class ImportDeclaration(ASTNode):
    """Represents an import statement in ELFIN."""
    
    def __init__(self, 
                imports: List[Dict[str, str]],
                source: str,
                line: int,
                column: int):
        """
        Initialize an import declaration.
        
        Args:
            imports: List of imports, each with 'name' and 'alias' keys
            source: The source module path
            line: The line number
            column: The column number
        """
        super().__init__(line, column)
        self.imports = imports
        self.source = source
```

### 1.2. Template Declaration Node

Create a new AST node for template declarations:

```python
class TemplateDeclaration(ASTNode):
    """Represents a template declaration in ELFIN."""
    
    def __init__(self,
                name: str,
                parameters: List[Dict[str, Any]],
                body: ASTNode,
                line: int,
                column: int):
        """
        Initialize a template declaration.
        
        Args:
            name: The template name
            parameters: List of parameter information
            body: The template body
            line: The line number
            column: The column number
        """
        super().__init__(line, column)
        self.name = name
        self.parameters = parameters
        self.body = body
```

### 1.3. Template Instantiation Node

Create a new AST node for template instantiations:

```python
class TemplateInstantiation(ASTNode):
    """Represents a template instantiation in ELFIN."""
    
    def __init__(self,
                template_name: str,
                arguments: List[Dict[str, Any]],
                instance_name: Optional[str],
                line: int,
                column: int):
        """
        Initialize a template instantiation.
        
        Args:
            template_name: The name of the template
            arguments: List of argument information
            instance_name: The name of the instance (optional)
            line: The line number
            column: The column number
        """
        super().__init__(line, column)
        self.template_name = template_name
        self.arguments = arguments
        self.instance_name = instance_name
```

### 1.4. Modify Program Node

Update the `Program` node to include imports and templates:

```python
class Program(ASTNode):
    """Represents an ELFIN program."""
    
    def __init__(self, 
                declarations: List[ASTNode],
                imports: List[ImportDeclaration] = None,
                templates: List[TemplateDeclaration] = None):
        """
        Initialize a program.
        
        Args:
            declarations: The list of declarations
            imports: The list of imports (optional)
            templates: The list of templates (optional)
        """
        super().__init__(0, 0)
        self.declarations = declarations
        self.imports = imports or []
        self.templates = templates or []
```

## 2. Parser Modifications (4-5 days)

Next, we need to modify the parser to recognize import statements and template declarations/instantiations.

### 2.1. Import Statement Parsing

Add a method to the parser to handle import statements:

```python
def import_declaration(self) -> ImportDeclaration:
    """Parse an import declaration."""
    # Parse import items (single or multiple)
    imports = []
    
    # Handle single import
    if not self.check(TokenType.CURLY_OPEN):
        name = self.consume(TokenType.IDENTIFIER, "Expected import name").lexeme
        alias = None
        
        # Check for alias
        if self.match(TokenType.IDENTIFIER) and self.previous().lexeme == "as":
            alias = self.consume(TokenType.IDENTIFIER, "Expected alias").lexeme
        
        imports.append({"name": name, "alias": alias})
    else:
        # Handle multiple imports
        self.consume(TokenType.CURLY_OPEN, "Expected '{' for multiple imports")
        
        while not self.check(TokenType.CURLY_CLOSE) and not self.is_at_end():
            name = self.consume(TokenType.IDENTIFIER, "Expected import name").lexeme
            alias = None
            
            # Check for alias
            if self.match(TokenType.IDENTIFIER) and self.previous().lexeme == "as":
                alias = self.consume(TokenType.IDENTIFIER, "Expected alias").lexeme
            
            imports.append({"name": name, "alias": alias})
            
            # Check for comma between imports
            if not self.match(TokenType.COMMA):
                break
        
        self.consume(TokenType.CURLY_CLOSE, "Expected '}' after imports")
    
    # Parse the source module
    self.consume(TokenType.IDENTIFIER, "Expected 'from' keyword").lexeme
    source = self.consume(TokenType.STRING, "Expected source module path").literal
    
    # Create the import declaration
    import_decl = ImportDeclaration(
        imports=imports,
        source=source,
        line=self.previous().line,
        column=self.previous().column
    )
    
    return import_decl
```

Update the `declaration` method to handle import statements:

```python
def declaration(self) -> Optional[ASTNode]:
    """Parse a declaration."""
    if self.match(TokenType.IMPORT):
        return self.import_declaration()
    elif self.match(TokenType.TEMPLATE):
        return self.template_declaration()
    elif self.match(TokenType.CONCEPT):
        return self.concept_declaration()
    # ... existing cases ...
```

### 2.2. Template Declaration Parsing

Add a method to parse template declarations:

```python
def template_declaration(self) -> TemplateDeclaration:
    """Parse a template declaration."""
    # Get the template name
    name = self.consume(TokenType.IDENTIFIER, "Expected template name").lexeme
    
    # Parse parameters
    self.consume(TokenType.PAREN_OPEN, "Expected '(' after template name")
    parameters = []
    
    if not self.check(TokenType.PAREN_CLOSE):
        # Parse the first parameter
        parameters.append(self.parse_template_parameter())
        
        # Parse additional parameters
        while self.match(TokenType.COMMA):
            parameters.append(self.parse_template_parameter())
    
    self.consume(TokenType.PAREN_CLOSE, "Expected ')' after parameters")
    
    # Parse the template body
    self.consume(TokenType.CURLY_OPEN, "Expected '{' after template declaration")
    body = self.block()
    
    # Create the template declaration
    template_decl = TemplateDeclaration(
        name=name,
        parameters=parameters,
        body=body,
        line=self.previous().line,
        column=self.previous().column
    )
    
    return template_decl

def parse_template_parameter(self) -> Dict[str, Any]:
    """Parse a template parameter."""
    name = self.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme
    
    # Check for type annotation
    param_type = None
    if self.match(TokenType.COLON):
        param_type = self.consume(TokenType.IDENTIFIER, "Expected type").lexeme
    
    # Check for default value
    default_value = None
    if self.match(TokenType.EQUALS):
        default_value = self.parse_property_value()
    
    return {
        "name": name,
        "type": param_type,
        "default_value": default_value
    }
```

### 2.3. Template Instantiation Parsing

Add support for template instantiation in expressions:

```python
def primary(self) -> Expression:
    """Parse a primary expression."""
    if self.match(TokenType.NUMBER) or self.match(TokenType.FLOAT):
        # ... existing code ...
    elif self.match(TokenType.IDENTIFIER):
        name = self.previous().lexeme
        
        # Check if it's a template instantiation
        if self.match(TokenType.PAREN_OPEN):
            # Parse arguments
            arguments = []
            
            if not self.check(TokenType.PAREN_CLOSE):
                # Parse the first argument
                arguments.append(self.parse_template_argument())
                
                # Parse additional arguments
                while self.match(TokenType.COMMA):
                    arguments.append(self.parse_template_argument())
            
            self.consume(TokenType.PAREN_CLOSE, "Expected ')' after arguments")
            
            # Check for instance name
            instance_name = None
            if self.match(TokenType.COLON):
                instance_name = self.consume(TokenType.IDENTIFIER, "Expected instance name").lexeme
            
            return TemplateInstantiation(
                template_name=name,
                arguments=arguments,
                instance_name=instance_name,
                line=self.previous().line,
                column=self.previous().column
            )
        
        # ... existing code for function calls and identifiers ...
    # ... existing code ...

def parse_template_argument(self) -> Dict[str, Any]:
    """Parse a template argument."""
    # Check if it's a named argument
    if self.match(TokenType.IDENTIFIER):
        name = self.previous().lexeme
        
        if self.match(TokenType.EQUALS):
            # It's a named argument
            value = self.parse_property_value()
            return {
                "name": name,
                "value": value
            }
        
        # It's not a named argument, backtrack
        self.current -= 1
    
    # It's a positional argument
    value = self.parse_property_value()
    return {
        "name": None,
        "value": value
    }
```

## 3. Module Resolver Integration (3-4 days)

Integrate the module resolver with the parser to handle import resolution.

### 3.1. Create a Parser with Resolver

Create a new parser class that uses the resolver:

```python
class ModuleAwareParser(Parser):
    """A parser that is aware of modules and can resolve imports."""
    
    def __init__(self, kiwis: List[Token], resolver: ImportResolver = None):
        """
        Initialize a module-aware parser.
        
        Args:
            kiwis: A list of kiwis from the lexer
            resolver: An import resolver (optional)
        """
        super().__init__(kiwis)
        self.resolver = resolver or ImportResolver()
        self.symbol_table = SymbolTable()
    
    def parse(self) -> Program:
        """
        Parse the kiwis and return the AST.
        
        Returns:
            The root node of the abstract syntax tree
        """
        # Parse the program
        program = super().parse()
        
        # Resolve imports
        for import_decl in program.imports:
            try:
                # Resolve the import
                path, module = self.resolver.resolve(import_decl.source)
                
                # Import symbols
                self.symbol_table.import_module(
                    module_path=str(path),
                    module_symbols=module.get("symbols", {}),
                    imports=import_decl.imports
                )
            except Exception as e:
                print(f"Import error: {e}")
        
        return program
```

### 3.2. Update parse_elfin Function

Update the `parse_elfin` function to use the module-aware parser:

```python
def parse_elfin(source: str, resolver: ImportResolver = None) -> Program:
    """
    Parse ELFIN DSL source code into an abstract syntax tree.
    
    Args:
        source: The ELFIN DSL source code
        resolver: An import resolver (optional)
        
    Returns:
        The root node of the abstract syntax tree
    """
    kiwis = tokenize(source)
    parser = ModuleAwareParser(kiwis, resolver)
    return parser.parse()
```

## 4. Symbol Table Integration (3-4 days)

Integrate the symbol table with the parser for name resolution.

### 4.1. Add Symbol Table to Parser

Modify the parser to use the symbol table for name resolution:

```python
class ModuleAwareParser(Parser):
    # ... existing code ...
    
    def identifier_expression(self) -> Expression:
        """Parse an identifier expression with symbol resolution."""
        name = self.consume(TokenType.IDENTIFIER, "Expected identifier").lexeme
        
        # Look up the symbol in the symbol table
        symbol = self.symbol_table.lookup(name)
        if symbol:
            # It's a resolved symbol
            return IdentifierExpression(
                name=name,
                resolved_symbol=symbol,
                line=self.previous().line,
                column=self.previous().column
            )
        
        # It's an unresolved identifier
        return IdentifierExpression(
            name=name,
            line=self.previous().line,
            column=self.previous().column
        )
```

### 4.2. Add Scope Management

Add methods to manage scopes during parsing:

```python
class ModuleAwareParser(Parser):
    # ... existing code ...
    
    def begin_scope(self, name: str):
        """Begin a new scope."""
        self.symbol_table.enter_scope(name)
    
    def end_scope(self):
        """End the current scope."""
        self.symbol_table.exit_scope()
    
    def declare_symbol(self, name: str, symbol_type: str, value: Any = None,
                     source: Optional[str] = None):
        """Declare a symbol in the current scope."""
        self.symbol_table.define(name, symbol_type, value, source)
```

### 4.3. Update AST Building

Update AST building methods to manage scopes:

```python
class ModuleAwareParser(Parser):
    # ... existing code ...
    
    def concept_declaration(self) -> ConceptDeclaration:
        """Parse a concept declaration with scope management."""
        # Get the concept name
        name_kiwi = self.consume(TokenType.IDENTIFIER, "Expected concept name")
        name = name_kiwi.lexeme
        
        # Begin a new scope for the concept
        self.begin_scope(name)
        
        # Declare the concept in the parent scope
        self.declare_symbol(name, "concept")
        
        # ... existing code ...
        
        # Parse the concept body if present
        properties = {}
        if self.match(TokenType.CURLY_OPEN):
            while not self.check(TokenType.CURLY_CLOSE) and not self.is_at_end():
                # ... parse properties ...
                
                # Declare the property in the concept scope
                self.declare_symbol(property_name, "property", property_value)
            
            self.consume(TokenType.CURLY_CLOSE, "Expected '}' after concept body")
        
        # End the concept scope
        self.end_scope()
        
        # ... create and return the concept ...
    }
```

## 5. Template Processing (3-4 days)

Add template processing to the parser.

### 5.1. Template Registry Integration

Integrate the template registry with the parser:

```python
class ModuleAwareParser(Parser):
    """A parser that is aware of modules and templates."""
    
    def __init__(self, kiwis: List[Token], resolver: ImportResolver = None):
        """
        Initialize a module-aware parser.
        
        Args:
            kiwis: A list of kiwis from the lexer
            resolver: An import resolver (optional)
        """
        super().__init__(kiwis)
        self.resolver = resolver or ImportResolver()
        self.symbol_table = SymbolTable()
        self.template_registry = TemplateRegistry()
    
    # ... existing code ...
    
    def template_declaration(self) -> TemplateDeclaration:
        """Parse a template declaration and register it."""
        # ... existing code to parse template ...
        
        # Create a TemplateDefinition
        template_def = TemplateDefinition(
            name=name,
            parameters=[
                TemplateParameter(
                    name=param["name"],
                    default_value=param["default_value"],
                    parameter_type=param["type"]
                )
                for param in parameters
            ],
            body=body,
            source=None  # Will be filled in later
        )
        
        # Register the template
        self.template_registry.register(template_def)
        
        # ... create and return the AST node ...
    }
```

### 5.2. Template Instantiation

Add template instantiation processing:

```python
class ModuleAwareParser(Parser):
    # ... existing code ...
    
    def primary(self) -> Expression:
        """Parse a primary expression."""
        if self.match(TokenType.IDENTIFIER):
            name = self.previous().lexeme
            
            # Check if it's a template instantiation
            if self.match(TokenType.PAREN_OPEN):
                # ... existing code to parse arguments ...
                
                # Look up the template
                template = self.template_registry.get_template(name)
                if template:
                    # Create template arguments
                    template_args = [
                        TemplateArgument(
                            value=arg["value"],
                            name=arg["name"]
                        )
                        for arg in arguments
                    ]
                    
                    # Instantiate the template
                    try:
                        instance = self.template_registry.instantiate(
                            template_name=name,
                            args=template_args,
                            instance_name=instance_name
                        )
                        
                        # ... create and return the AST node ...
                    except ValueError as e:
                        self.error(self.previous(), str(e))
                else:
                    self.error(self.previous(), f"Unknown template: {name}")
            
            # ... existing code ...
    }
```

## 6. Testing & Implementation Strategy

The implementation will follow these steps:

1. **AST Extensions**:
   - Create the new AST nodes
   - Update the existing Program node

2. **Parser Modifications**:
   - Add import statement parsing
   - Add template declaration parsing
   - Add template instantiation parsing

3. **Module Resolver Integration**:
   - Create the ModuleAwareParser
   - Update the parse_elfin function

4. **Symbol Table Integration**:
   - Add the symbol table to the parser
   - Add scope management methods
   - Update AST building methods

5. **Template Processing**:
   - Integrate the template registry
   - Add template instantiation processing

### Test Cases:

Create comprehensive test cases for:

1. **Import Resolution**:
   - Importing a single symbol
   - Importing multiple symbols
   - Importing with aliases
   - Relative vs. absolute imports
   - Circular dependency detection

2. **Template Processing**:
   - Template declarations with various parameter types
   - Template instantiation with positional arguments
   - Template instantiation with named arguments
   - Default values for omitted parameters
   - Error cases (missing required parameters, etc.)

3. **Symbol Resolution**:
   - Resolving imported symbols
   - Resolving local symbols
   - Scope nesting and shadowing
   - Error cases (undefined symbols, etc.)

## Timeline

- Day 1-3: AST Extensions
- Day 4-8: Parser Modifications
- Day 9-12: Module Resolver Integration
- Day 13-16: Symbol Table Integration
- Day 17-20: Template Processing
- Day 21-22: Testing and Refinement

Total: Approximately 3 weeks
