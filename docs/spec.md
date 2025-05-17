# ELFIN Language Specification
**Version 1.0.0** — May 2025

## 1. Introduction

ELFIN (Embedded Language For INstructions) is a domain-specific language designed for control system specification. Its primary focus is on dimensional consistency and mathematical rigor in control system development.

This document defines the syntax, semantics, and standard library for the ELFIN language.

## 2. Lexical Structure

### 2.1 Comments

Single-line comments begin with `#` and continue to the end of the line:

```elfin
# This is a comment
x = 5;  # This is an end-of-line comment
```

### 2.2 Identifiers

Identifiers in ELFIN begin with a letter or underscore and can contain letters, digits, and underscores.

```
identifier ::= [a-zA-Z_][a-zA-Z0-9_]*
```

### 2.3 Keywords

The following keywords are reserved and cannot be used as identifiers:

```
system params continuous_state inputs flow_dynamics
if then else 
true false
import from
```

### 2.4 Literals

#### 2.4.1 Numeric Literals

Integer literals are sequences of digits:

```
integer_literal ::= [0-9]+
```

Floating-point literals are sequences of digits with a decimal point:

```
float_literal ::= [0-9]+\.[0-9]+
```

Scientific notation is supported:

```
scientific_literal ::= ([0-9]+|[0-9]+\.[0-9]+)[eE][+-]?[0-9]+
```

#### 2.4.2 Boolean Literals

Boolean literals are either `true` or `false`.

## 3. Syntax

### 3.1 System Declarations

An ELFIN file defines one or more control systems:

```
system_decl ::= 'system' identifier '{' system_body '}'
system_body ::= state_decl inputs_decl params_block flow_dynamics_block
```

### 3.2 State Declarations

```
state_decl ::= 'continuous_state' ':' '[' identifier_list ']' ';'
identifier_list ::= identifier (',' identifier)*
```

### 3.3 Inputs Declarations

```
inputs_decl ::= 'inputs' ':' '[' identifier_list ']' ';'
```

### 3.4 Parameter Blocks

```
params_block ::= 'params' '{' param_decl* '}'
param_decl ::= identifier ':' type_annotation? '=' expr ';'
type_annotation ::= identifier '[' identifier ']'
```

### 3.5 Flow Dynamics Blocks

```
flow_dynamics_block ::= 'flow_dynamics' '{' equation* '}'
equation ::= identifier '_dot' '=' expr ';'
```

### 3.6 Expressions

```
expr ::= binary_expr | unary_expr | atom_expr

binary_expr ::= expr binary_op expr
binary_op ::= '+' | '-' | '*' | '/' | '^' | '==' | '!=' | '<' | '>' | '<=' | '>='

unary_expr ::= unary_op expr
unary_op ::= '+' | '-' | '!'

atom_expr ::= literal | identifier | function_call | '(' expr ')'
function_call ::= identifier '(' expr_list? ')'
expr_list ::= expr (',' expr)*
```

### 3.7 Import Statements

```
import_stmt ::= 'import' identifier 'from' string_literal ';'
string_literal ::= '"' [^"]* '"'
```

### 3.8 Conditional Expressions

```
conditional_expr ::= 'if' expr 'then' expr 'else' expr
```

## 4. Semantics

### 4.1 Dimensional Analysis

ELFIN performs dimensional analysis at compile time. Each variable and expression has an associated unit, and operations between quantities of incompatible units result in compilation warnings.

Unit expressions can be:
- Base units: `kg`, `m`, `s`, etc.
- Products of units: `kg*m/s^2`
- Powers of units: `m^2`

### 4.2 Typing Rules

- Mathematical operations require dimensionally compatible operands
- Addition and subtraction require operands of the same dimension
- Multiplication and division combine dimensions: `[m] * [s] = [m*s]`
- Exponentiation scales dimensions: `[m]^2 = [m^2]`
- Comparison operators require identical dimensions for their operands
- Functions can impose additional constraints on their arguments

### 4.3 System Semantics

A system describes a continuous-time dynamical system with:
- State variables (updated by flow equations)
- Input variables (externally provided)
- Parameters (constant during execution)
- Flow dynamics (differential equations defining state evolution)

## 5. Standard Library

ELFIN provides a standard library of common helper functions:

### 5.1 Mathematical Helpers

```elfin
hAbs(x)        # Absolute value
hMin(a, b)     # Minimum of two values
hMax(a, b)     # Maximum of two values
wrapAngle(t)   # Normalize angle to range [-π, π]
clamp(x, a, b) # Clamp value between min and max
lerp(a, b, t)  # Linear interpolation
```

### 5.2 Kinematics

The standard library includes reusable components for common kinematic systems:

```elfin
# Example: Single-integrator model
system SingleIntegrator {
  continuous_state: [x];
  inputs: [v];
  
  flow_dynamics {
    x_dot = v;
  }
}
```

## 6. File Format

ELFIN source files use the `.elfin` extension. The recommended encoding is UTF-8.

## 7. Grammar Summary

The ELFIN grammar is context-free and can be summarized as:

```
program ::= import_stmt* system_decl+

import_stmt ::= 'import' identifier 'from' string_literal ';'

system_decl ::= 'system' identifier '{' system_body '}'
system_body ::= state_decl inputs_decl params_block flow_dynamics_block

state_decl ::= 'continuous_state' ':' '[' identifier_list ']' ';'
inputs_decl ::= 'inputs' ':' '[' identifier_list ']' ';'

params_block ::= 'params' '{' param_decl* '}'
param_decl ::= identifier ':' type_annotation? '=' expr ';'
type_annotation ::= identifier '[' identifier ']'

flow_dynamics_block ::= 'flow_dynamics' '{' equation* '}'
equation ::= identifier '_dot' '=' expr ';'

expr ::= conditional_expr | binary_expr | unary_expr | atom_expr
conditional_expr ::= 'if' expr 'then' expr 'else' expr
binary_expr ::= expr binary_op expr
unary_expr ::= unary_op expr
atom_expr ::= literal | identifier | function_call | '(' expr ')'
function_call ::= identifier '(' expr_list? ')'
```

## 8. Version History

- **0.9.0** (April 2025): Beta release with dimensional checking, standard library, and formatting
- **1.0.0** (May 2025): First stable release with complete specification, formatter, and language server

## 9. Appendix: Formal Grammar

```lark
start: import_stmt* system_decl+

import_stmt: "import" IDENTIFIER "from" STRING_LITERAL ";"

system_decl: "system" IDENTIFIER "{" system_body "}"
system_body: state_decl inputs_decl params_block flow_dynamics_block

state_decl: "continuous_state" ":" "[" identifier_list "]" ";"
inputs_decl: "inputs" ":" "[" identifier_list "]" ";"
identifier_list: IDENTIFIER ("," IDENTIFIER)*

params_block: "params" "{" param_decl* "}"
param_decl: IDENTIFIER (":" type_annotation)? "=" expr ";"
type_annotation: IDENTIFIER "[" IDENTIFIER "]"

flow_dynamics_block: "flow_dynamics" "{" equation* "}"
equation: IDENTIFIER "_dot" "=" expr ";"

expr: or_expr
or_expr: and_expr ("||" and_expr)*
and_expr: comp_expr ("&&" comp_expr)*
comp_expr: sum_expr (COMP_OP sum_expr)*
sum_expr: product_expr (("+"|"-") product_expr)*
product_expr: power_expr (("*"|"/") power_expr)*
power_expr: unary_expr ("^" unary_expr)*
unary_expr: ("+"|"-"|"!") atom_expr | atom_expr
atom_expr: literal | IDENTIFIER | function_call | conditional_expr | "(" expr ")"
function_call: IDENTIFIER "(" (expr ("," expr)*)? ")"
conditional_expr: "if" expr "then" expr "else" expr

literal: NUMBER | "true" | "false"

COMP_OP: "==" | "!=" | "<" | ">" | "<=" | ">="
IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/
NUMBER: /[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/
STRING_LITERAL: /"[^"]*"/

%import common.WS
%ignore WS
%ignore /\#[^\n]*/
```

This grammar is compatible with the Lark parser used in the ELFIN reference implementation.
