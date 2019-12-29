# Rena3
Rena3 is a library of parsing texts. Rena3 makes parsing text easily.  
Rena3 can treat recursion of pattern, hence Rena3 can parse languages which described top down parsing
like arithmetic expressions and so on.  
Rena3 can parse class of Parsing Expression Grammar (PEG) language.  
Rena3 can also treat synthesized and inherited attributes.  
'Rena' is an acronym of REpetation (or REcursion) Notation API.  

## Expression

### Construct Expression Generation Object
```js
var r = Rena(option);
```

Options shown as follow are available.
```
{
  ignore: expression to ignore,
  keys: [key, ...]
}
```

An example which generates object show as follows.
```js
var r = Rena({
  ignore: /\s+/,
  keys: ["+", "-", "++"]
});
```

### Elements of Expression

#### Literals
String literal and regular expression literal of JavaScript are elements of expression.  
To use only one literal as expression, use concat synthesized expression.

#### Attrinbute Setting Expression
Attribute setting expression is an element of expression.
```js
r.attr(attribute to set);
```

#### Key Matching Expression
Key matching expression is an element of expression.  
If keys "+", "++", "-" are specified by option, below expression matches "+" but does not match "+" after "+".
```
r.key("+");
```

#### Not Key Matching Expression
Not key matching expression is an element of expression.
If keys "+", "++", "-" are specified by option, "+", "++", "-" will not match.
```
r.notKey();
```

#### Keyword Matching Expression
Keyword matching expression is an element of expression.
```
r.equalsId(keyword);
```

The table shows how to match expression r.equalsId("keyword") by option.

|option|keyword|keyword1|keyword-1|keyword+|
|:-----|:------|:-------|:--------|:-------|
|no options|match|match|match|match|
|ignore: /-/|match|no match|match|no match|
|keys: ["+"]|match|no match|no match|match|
|ignore: /-/ and keys: ["+"]|match|no match|match|match|

#### Real Number
Real number expression is an element of expression and matches any real number.
```
r.real();
```

#### End of string
End of string is an element of expression and matches the end of string.
```
r.isEnd();
```

#### Function
Function which fulfilled condition shown as follow is an element of expression.  
* the function has 3 arguments
* first argument is a string to match
* second argument is last index of last match
* third argument is an attribute
* return value of the function is an object which has 3 properties
  * "match": matched string
  * "lastIndex": last index of matched string
  * "attr": result attribute

Every instance of expression is a function fulfilled above condition.

### Synthesized Expression

#### Sequence
Sequence expression matches if all specified expression are matched sequentially.  
Below expression matches "abc".
```
r.concat("a", "b", "c");
```

#### Choice
Choice expression matches if one of specified expression are matched.  
Specified expression will be tried sequentially.  
Below expression matches "a", "b" or "c".
```
r.choice("a", "b", "c");
```

#### Repetation
Repetation expression matches repetation of specified expression.  
The family of repetation expression are shown as follows.  
```
r.oneOrMore(expression);
r.zeroOrMore(expression);
```

Repetation expression is already greedy and does not backtrack.

#### Optional
Optional expression matches the expression if it is matched, or matches empty string.
```
r.opt(expression);
```

#### Lookahead (AND predicate)
Lookahead (AND predicate) matches the specify expression but does not consume input string.
Below example matches "ab" but matched string is "a", and does not match "ad".
```
r.concat("a", r.lookahead("b"));
```

#### Nogative Lookahead (NOT predicate)
Negative lookahead (NOT predicate) matches if the specify expression does not match.
Below example matches "ab" but matched string is "a", and does not match "ad".
```
r.concat("a", r.lookaheadNot("d"));
```

#### Action
Action expression matches the specified expression.  
```
r.action(expression, action);
```

The second argument must be a function with 3 arguments and return result attribute.  
First argument of the function will pass a matched string,
second argument will pass an attribute of repetation expression ("synthesized attribtue"),
and third argument will pass an inherited attribute.  

Below example, argument of action will be passed ("2", "2", "").
```js
r.action(/[0-9]/, (match, synthesized, inherited) => match)("2", 0, "")
```

### Matching Expression
To apply string to match to an expression, call the expression with 3 arguments shown as follows.
1. a string to match
2. an index to begin to match
3. an initial attribute

```js
var match = r.oneOrMore(r.action(/[0-9]/, (match, synthesized, inherited) => inherited + ":" + synthesized));
match("27", 0, "");
```

### Description of Recursion
The r.letrec function is available to recurse an expression.  
The argument of r.letrec function are functions, and return value is the return value of first function.

Below example matches balanced parenthesis.
```js
var paren = r.letrec(
  function(paren) {
    return r.concat("(", r.opt(paren), ")"));
  }
};
```

