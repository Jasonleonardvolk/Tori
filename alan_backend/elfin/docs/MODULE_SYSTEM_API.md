# ELFIN Module System API Reference

This reference documents the core classes and functions of the ELFIN module system. It's intended for developers who want to understand the implementation details or extend the module system's functionality.

## Table of Contents

1. [Module Resolver](#module-resolver)
2. [Symbol Table](#symbol-table)
3. [Template System](#template-system)
4. [Module Parser](#module-parser)
5. [Module Compiler](#module-compiler)

## Module Resolver

The module resolver is responsible for finding and loading modules.

### ImportResolver

```python
class ImportResolver:
    def __init__(self, search_paths: Optional[List[Union[str, Path]]] = None):
        """
        Initialize an import resolver.
        
        Args:
            search_paths: Paths to search for modules
        """
        
    def add_search_path(self, path: Union[str, Path], base_dir: Optional[Union[str, Path]] = None) -> None:
        """
        Add a search path.
        
        Args:
            path: The path to add
            base_dir: The base directory for resolving relative paths
        """
        
    def resolve(self, module_path: Union[str, Path], 
               from_module: Optional[Path] = None) -> Tuple[Path, Dict[str, Any]]:
        """
        Resolve a module.
        
        Args:
            module_path: The path to the module
            from_module: The module that is importing
            
        Returns:
            A tuple of (resolved_path, module_content)
            
        Raises:
            ModuleNotFoundError: If the module cannot be found
            CircularDependencyError: If a circular dependency is detected
        """
        
    def clear_cache(self) -> None:
        """Clear the module cache."""
```

### ModuleSearchPath

```python
class ModuleSearchPath:
    def __init__(self, path: Union[str, Path], 
                base_dir: Optional[Union[str, Path]] = None):
        """
        Initialize a module search path.
        
        Args:
            path: The search path
            base_dir: The base directory for resolving relative paths
        """
        
    def resolve(self, module_path: Union[str, Path]) -> Optional[Path]:
        """
        Resolve a module path.
        
        Args:
            module_path: The path to resolve
            
        Returns:
            The resolved path, or None if not found
        """
```

## Symbol Table

The symbol table keeps track of symbols defined in a module.

### Symbol

```python
class Symbol:
    def __init__(self, name: str, symbol_type: str, 
                value: Optional[Any] = None,
                source: Optional[str] = None):
        """
        Initialize a symbol.
        
        Args:
            name: The name of the symbol
            symbol_type: The type of the symbol
            value: The value of the symbol (optional)
            source: The source of the symbol (optional)
        """
```

### Scope

```python
class Scope:
    def __init__(self, name: str, parent: Optional['Scope'] = None):
        """
        Initialize a scope.
        
        Args:
            name: The name of the scope
            parent: The parent scope (optional)
        """
        
    def define(self, symbol: Symbol) -> Symbol:
        """
        Define a symbol in this scope.
        
        Args:
            symbol: The symbol to define
            
        Returns:
            The defined symbol
            
        Raises:
            ValueError: If the symbol is already defined in this scope
        """
        
    def lookup(self, name: str, local_only: bool = False) -> Optional[Symbol]:
        """
        Look up a symbol by name.
        
        Args:
            name: The name of the symbol to look up
            local_only: Whether to only look in the current scope
            
        Returns:
            The symbol if found, None otherwise
        """
        
    def get_all_symbols(self) -> Dict[str, Symbol]:
        """
        Get all symbols defined in this scope and parent scopes.
        
        Returns:
            A dictionary of symbol names to symbols
        """
        
    def get_local_symbols(self) -> Dict[str, Symbol]:
        """
        Get symbols defined in this scope only.
        
        Returns:
            A dictionary of symbol names to symbols
        """
        
    def create_child(self, name: str) -> 'Scope':
        """
        Create a child scope.
        
        Args:
            name: The name of the child scope
            
        Returns:
            The child scope
        """
```

### SymbolTable

```python
class SymbolTable:
    def __init__(self):
        """Initialize a symbol table with a global scope."""
        
    def enter_scope(self, name: str) -> Scope:
        """
        Enter a new scope.
        
        Args:
            name: The name of the new scope
            
        Returns:
            The new scope
        """
        
    def exit_scope(self) -> Scope:
        """
        Exit the current scope and return to the parent scope.
        
        Returns:
            The new current scope (parent of the previous scope)
            
        Raises:
            ValueError: If there is no parent scope
        """
        
    def define(self, name: str, symbol_type: str, 
              value: Optional[Any] = None,
              source: Optional[str] = None) -> Symbol:
        """
        Define a symbol in the current scope.
        
        Args:
            name: The name of the symbol
            symbol_type: The type of the symbol
            value: The value of the symbol (optional)
            source: The source of the symbol (optional)
            
        Returns:
            The defined symbol
        """
        
    def lookup(self, name: str, local_only: bool = False) -> Optional[Symbol]:
        """
        Look up a symbol by name.
        
        Args:
            name: The name of the symbol
            local_only: Whether to only look in the current scope
            
        Returns:
            The symbol if found, None otherwise
        """
        
    def get_all_symbols(self) -> Dict[str, Symbol]:
        """
        Get all symbols in the current scope and parent scopes.
        
        Returns:
            A dictionary of symbol names to symbols
        """
        
    def get_local_symbols(self) -> Dict[str, Symbol]:
        """
        Get symbols in the current scope only.
        
        Returns:
            A dictionary of symbol names to symbols
        """
        
    def import_module(self, module_path: str, 
                     module_symbols: Dict[str, Any],
                     imports: List[Dict[str, str]]) -> None:
        """
        Import symbols from a module.
        
        Args:
            module_path: The path to the module
            module_symbols: The symbols defined in the module
            imports: A list of dictionaries with 'name' and 'alias' keys
        """
        
    def get_imported_modules(self) -> Dict[str, Dict[str, Symbol]]:
        """
        Get all imported modules and their symbols.
        
        Returns:
            A dictionary of module paths to dictionaries of symbol names to symbols
        """
```

## Template System

The template system enables the definition and instantiation of parametrized components.

### TemplateParameter

```python
class TemplateParameter:
    def __init__(self, name: str, default_value: Any = None, 
                parameter_type: Optional[str] = None):
        """
        Initialize a template parameter.
        
        Args:
            name: The parameter name
            default_value: The default value (optional)
            parameter_type: The parameter type (optional)
        """
```

### TemplateDefinition

```python
class TemplateDefinition:
    def __init__(self, name: str, 
                parameters: List[TemplateParameter] = None,
                body: Any = None,
                source: Optional[str] = None):
        """
        Initialize a template definition.
        
        Args:
            name: The template name
            parameters: List of parameters (optional)
            body: The template body (optional)
            source: The source of the template (optional)
        """
        
    def get_parameter(self, name: str) -> Optional[TemplateParameter]:
        """
        Get a parameter by name.
        
        Args:
            name: The parameter name
            
        Returns:
            The parameter if found, None otherwise
        """
        
    def get_parameter_names(self) -> List[str]:
        """
        Get a list of parameter names.
        
        Returns:
            A list of parameter names
        """
        
    def has_default_values(self) -> bool:
        """
        Check if all parameters have default values.
        
        Returns:
            True if all parameters have default values, False otherwise
        """
        
    def get_required_parameters(self) -> List[TemplateParameter]:
        """
        Get a list of parameters without default values.
        
        Returns:
            A list of required parameters
        """
```

### TemplateArgument

```python
class TemplateArgument:
    def __init__(self, value: Any, name: Optional[str] = None):
        """
        Initialize a template argument.
        
        Args:
            value: The argument value
            name: The argument name (optional)
        """
        
    @property
    def is_named(self) -> bool:
        """
        Check if this is a named argument.
        
        Returns:
            True if this is a named argument, False otherwise
        """
```

### TemplateInstance

```python
class TemplateInstance:
    def __init__(self, template_def: TemplateDefinition,
                arguments: List[TemplateArgument] = None,
                instance_name: Optional[str] = None):
        """
        Initialize a template instance.
        
        Args:
            template_def: The template definition
            arguments: List of arguments (optional)
            instance_name: The instance name (optional)
        """
        
    def get_argument_by_name(self, name: str) -> Optional[TemplateArgument]:
        """
        Get an argument by parameter name.
        
        Args:
            name: The parameter name
            
        Returns:
            The argument if found, None otherwise
        """
        
    def get_argument_by_position(self, position: int) -> Optional[TemplateArgument]:
        """
        Get an argument by position.
        
        Args:
            position: The position
            
        Returns:
            The argument if found, None otherwise
        """
```

### TemplateRegistry

```python
class TemplateRegistry:
    def __init__(self):
        """Initialize an empty template registry."""
        
    def register(self, template: TemplateDefinition) -> None:
        """
        Register a template definition.
        
        Args:
            template: The template to register
            
        Raises:
            ValueError: If a template with the same name is already registered
        """
        
    def get_template(self, name: str) -> Optional[TemplateDefinition]:
        """
        Get a template by name.
        
        Args:
            name: The name of the template
            
        Returns:
            The template if found, None otherwise
        """
        
    def instantiate(self, template_name: str, args: List[TemplateArgument],
                   instance_name: Optional[str] = None) -> TemplateInstance:
        """
        Instantiate a template with specific arguments.
        
        Args:
            template_name: The name of the template to instantiate
            args: The arguments to pass to the template
            instance_name: The name of the instance (optional)
            
        Returns:
            The template instance
            
        Raises:
            ValueError: If the template is not found or if the arguments are invalid
        """
```

## Module Parser

The module parser is responsible for parsing ELFIN modules and building an AST.

### AST Nodes

```python
class ImportDecl(Node):
    def __init__(self, imports: List[Dict[str, str]], source: str,
                location: Tuple[int, int] = (0, 0)):
        """
        Initialize an import declaration.
        
        Args:
            imports: List of imports, each with 'name' and 'alias' keys
            source: The source module path
            location: The (line, column) location of the import
        """

class TemplateParamDecl(Node):
    def __init__(self, name: str, param_type: Optional[str] = None,
                default_value: Optional[Any] = None,
                location: Tuple[int, int] = (0, 0)):
        """
        Initialize a template parameter declaration.
        
        Args:
            name: The parameter name
            param_type: The parameter type (optional)
            default_value: The default value (optional)
            location: The (line, column) location of the parameter
        """

class TemplateDecl(Node):
    def __init__(self, name: str, parameters: List[TemplateParamDecl],
                body: Node, location: Tuple[int, int] = (0, 0)):
        """
        Initialize a template declaration.
        
        Args:
            name: The template name
            parameters: List of parameter declarations
            body: The template body
            location: The (line, column) location of the template
        """

class TemplateArgument(Node):
    def __init__(self, value: Any, name: Optional[str] = None,
                location: Tuple[int, int] = (0, 0)):
        """
        Initialize a template argument.
        
        Args:
            value: The argument value
            name: The argument name (optional)
            location: The (line, column) location of the argument
        """

class TemplateInstantiation(Expression):
    def __init__(self, template_name: str, arguments: List[TemplateArgument],
                instance_name: Optional[str] = None,
                location: Tuple[int, int] = (0, 0)):
        """
        Initialize a template instantiation.
        
        Args:
            template_name: The name of the template
            arguments: List of arguments
            instance_name: The name of the instance (optional)
            location: The (line, column) location of the instantiation
        """

class ModuleNode(Node):
    def __init__(self, path: str, declarations: List[Node] = None,
                imports: List[ImportDecl] = None,
                templates: List[TemplateDecl] = None):
        """
        Initialize a module.
        
        Args:
            path: The path to the module file
            declarations: List of declarations (optional)
            imports: List of imports (optional)
            templates: List of templates (optional)
        """
```

### ModuleAwareParser

```python
class ModuleAwareParser(Parser):
    def __init__(self, kiwis: List[Token],
                resolver: Optional[ImportResolver] = None,
                symbol_table: Optional[SymbolTable] = None,
                template_registry: Optional[TemplateRegistry] = None,
                file_path: Optional[str] = None):
        """
        Initialize a module-aware parser.
        
        Args:
            kiwis: A list of kiwis from the lexer
            resolver: An import resolver (optional)
            symbol_table: A symbol table (optional)
            template_registry: A template registry (optional)
            file_path: The path to the file being parsed (optional)
        """
        
    def parse(self) -> ModuleNode:
        """
        Parse the kiwis and return the module AST.
        
        Returns:
            The root node of the module AST
        """
        
    def import_declaration(self) -> ImportDecl:
        """
        Parse an import declaration.
        
        Returns:
            The parsed import declaration
        """
        
    def template_declaration(self) -> TemplateDecl:
        """
        Parse a template declaration.
        
        Returns:
            The parsed template declaration
        """
        
    def parse_template_parameter(self) -> TemplateParamDecl:
        """
        Parse a template parameter.
        
        Returns:
            The parsed template parameter
        """
        
    def parse_template_argument(self) -> TemplateArgument:
        """
        Parse a template argument.
        
        Returns:
            The parsed template argument
        """
```

### Utility Functions

```python
def parse_elfin_module(source: str,
                     file_path: Optional[str] = None,
                     resolver: Optional[ImportResolver] = None,
                     symbol_table: Optional[SymbolTable] = None,
                     template_registry: Optional[TemplateRegistry] = None) -> ModuleNode:
    """
    Parse ELFIN DSL source code into a module AST.
    
    Args:
        source: The ELFIN DSL source code
        file_path: The path to the file being parsed (optional)
        resolver: An import resolver (optional)
        symbol_table: A symbol table (optional)
        template_registry: A template registry (optional)
        
    Returns:
        The root node of the module AST
    """
```

## Module Compiler

The module compiler integrates the module system with the main ELFIN compiler.

### ModuleCompiler

```python
class ModuleCompiler:
    def __init__(self, search_paths: Optional[List[str]] = None,
                cache_dir: Optional[str] = None):
        """
        Initialize a module compiler.
        
        Args:
            search_paths: Paths to search for imported modules
            cache_dir: Directory for caching compiled modules
        """
        
    def compile_file(self, file_path: str, force_recompile: bool = False) -> Any:
        """
        Compile an ELFIN module from a file.
        
        Args:
            file_path: Path to the file to compile
            force_recompile: Whether to force recompilation of cached modules
            
        Returns:
            The compiled module
        """
        
    def get_dependencies(self, file_path: str) -> Set[str]:
        """
        Get the dependencies of a module.
        
        Args:
            file_path: Path to the module
            
        Returns:
            A set of paths to modules that this module depends on
        """
        
    def get_dependents(self, file_path: str) -> Set[str]:
        """
        Get the modules that depend on a module.
        
        Args:
            file_path: Path to the module
            
        Returns:
            A set of paths to modules that depend on this module
        """
        
    def invalidate_cache(self, file_path: str, recursive: bool = True) -> None:
        """
        Invalidate the cache for a module and optionally its dependents.
        
        Args:
            file_path: Path to the module
            recursive: Whether to recursively invalidate dependents
        """
        
    def clear_cache(self) -> None:
        """Clear the entire compilation cache."""
```

### Utility Functions

```python
def compile_elfin_module(file_path: str, search_paths: Optional[List[str]] = None) -> Any:
    """
    Compile an ELFIN module from a file.
    
    This is a convenience function that creates a ModuleCompiler and compiles a file.
    
    Args:
        file_path: Path to the file to compile
        search_paths: Paths to search for imported modules
        
    Returns:
        The compiled module
    """
```

---

This API reference provides a comprehensive overview of the ELFIN module system's implementation. For a user-friendly guide to using the module system, refer to the [Module System Guide](MODULE_SYSTEM_GUIDE.md).
