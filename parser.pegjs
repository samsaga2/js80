{
  var _ = require('underscore'),
      ast = require('./ast');

  var repeat = [];
  var astif = [];

  function compactList(head, tail) {
    return [head].concat(_.map(tail, function(i) { return i[3]; }));
  }
}

Start
  = l:Lines __ LineTerminator* { return l; }

Lines
  = __ head:ProgLine? tail:(__ (LineTerminator/"\\")+ __ ProgLine?)* __ {
    tail = _.map(tail, function(i) { return i[3]; });
    return _.flatten([head, tail]);
  }

ProgLine
  = l:Line {
    if(astif.length && !_.isUndefined(_.last(astif).elseBody)) { _.last(astif).elseBody.push(l); return []; }
    if(astif.length)  { _.last(astif).thenBody.push(l); return []; }
    if(repeat.length) { _.last(repeat).body.push(l); return []; }
    return ast.line(l);
  }

Line
  = l:Identifier _ "equ"i _ e:Expr { return ast.equ(l, e, line); }
  / l:Label _ i:Inst               { return ast.label(l, [i], line); }
  / l:Label                        { return ast.label(l, null, line); }
  / i:Inst                         { return ast.label(null, [i], line); }

Label
  = l:Identifier ":" { return l; }

Inst
  = "."? s:SpecialInst                      { return s; }
  / m:"@@"? asm:Identifier _ args:InstArgs? { return ast.asmInst(asm, args, _.isEmpty(m)); }

SpecialInst
  = "org"i _ n:Expr                                      { return ast.org(n); }
  / "map"i _ n:Expr                                      { return ast.map(n); }
  / ("ds"i/"defs"i) _ n:Expr _ "," _ v:Expr              { return ast.defineSpace(n, v); }
  / ("ds"i/"defs"i) _ n:Expr                             { return ast.defineSpace(n, 0); }
  / ("dw"i/"defw"i) _ head:Expr tail:(_ "," _ Expr)*     { return ast.defineWords(compactList(head, tail)); }
  / ("db"i/"defb"i) _ head:Expr tail:(_ "," _ Expr)*     { return ast.defineBytes(compactList(head, tail)); }
  / "module"i _ i:Identifier                             { return ast.defineModule(i); }
  / "endmodule"i                                         { return ast.endModule(i); }
  / "include"i _ s:String                                { return ast.include(s); }
  / "incbin"i _ s:String _ "," _ k:Expr _ "," _ l:Expr   { return ast.includeBinary(s, k, l); }
  / "incbin"i _ s:String _ "," _ k:Expr                  { return ast.includebinary(s, k); }
  / "incbin"i _ s:String                                 { return ast.includeBinary(s); }
  / "macro"i _ i:Identifier _ a:MacroArgs?               { return ast.defineMacro(i, a); }
  / "endmacro"i                                          { return ast.endMacro(); }
  / ("repeat"i/"rept"i) _ n:Expr                         { repeat.push({count:n, body:[]}); return {}; }
  / ("endrepeat"i/"endr"i)                               { var r = repeat.pop(); return {repeat:r}; }
  / "ifdef"i _ i:Identifier                              { astif.push({defined:i, thenBody:[]}); return {}; }
  / "ifndef"i _ i:Identifier                             { astif.push({undefined:i, thenBody:[]}); return {}; }
  / "if"i _ e:Expr                                       { astif.push({expr:e, thenBody:[]}); return {}; }
  / "else"i                                              { _.last(astif).elseBody = []; return {}; }
  / "endif"i                                             { var i = astif.pop(); return {if:i}; }
  / "rotate"i _ n:Expr                                   { return ast.rotate(n); }
  / "defpage"i _ p:PageArg _ "," _ o:Expr _ "," _ s:Expr { return ast.definePage(p, o, s); }
  / "page"i _ p:PageArg                                  { return ast.page(p); }
  / "echo"i _ head:Expr tail:(_ "," _ Expr)*             { return ast.echo(compactList(head, tail)); }
  / "error"i _ msg:Expr                                  { return ast.error(msg); }

PageArg
  = s:Expr _ ".." _ e:Expr      { return ast.macro.range(s, e); }
  / e:Expr                      { return e; }

InstArgs
  = head:Expr tail:(_ "," _ Expr)* { return compactList(head, tail); }

MacroArgs
  = head:MacroArg tail:(_ "," _ MacroArg)* { return compactList(head, tail); }

MacroArg
  = "1" _ ".." _ "*" __         { return ast.macro.rest(); }
  / i:Identifier _ ":" _ e:Expr { return ast.macro.arg(i, e); }
  / i:Identifier                { return ast.macro.arg(i); }

//
// Expr
//
Expr
  = e:ExprLogic  { return e; }
  / e:ExprChar   { return ast.expr.chr(e); }
  / e:String     { return ast.expr.str(e); }

ExprLogic
  = left:ExprCmp _ "^" _ right:ExprLogic { return ast.expr.binaryOperator("^", left, right); }
  / left:ExprCmp _ "|" _ right:ExprLogic { return ast.expr.binaryOperator("|", left, right); }
  / left:ExprCmp _ "&" _ right:ExprLogic { return ast.expr.binaryOperator("&", left, right); }
  / ExprCmp

ExprCmp
  = left:ExprAdd _ "==" _ right:ExprAdd { return ast.expr.binaryOperator("=", left, right); }
  / left:ExprAdd _ "!=" _ right:ExprAdd { return ast.expr.binaryOperator("!=", left, right); }
  / left:ExprAdd _ "<=" _ right:ExprAdd { return ast.expr.binaryOperator("<=", left, right); }
  / left:ExprAdd _ ">=" _ right:ExprAdd { return ast.expr.binaryOperator(">=", left, right); }
  / left:ExprAdd _ "<"  _ right:ExprAdd { return ast.expr.binaryOperator("<", left, right); }
  / left:ExprAdd _ ">"  _ right:ExprAdd { return ast.expr.binaryOperator(">", left, right); }
  / ExprAdd

ExprAdd
  = left:ExprMul _ right:([+-] ExprMul)+ {
    var n=[left].concat(_.map(right, function(i) {
      if(i[0]==='-') {
       return ast.expr.neg(i[1]);
      } else {
       return i[1];
      }
    }));
    return {binary:"+", args:n};
  }
  / ExprMul

ExprMul
  = left:ExprShift _ "*" _ right:ExprMul { return ast.expr.binaryOperator("*", left, right); }
  / left:ExprShift _ "/" _ right:ExprMul { return ast.expr.binaryOperator("/", left, right); }
  / ExprShift

ExprShift
  = left:ExprPrimary _ "<<" _ right:ExprShift { return ast.expr.binaryOperator("<<", left, right); }
  / left:ExprPrimary _ ">>" _ right:ExprShift { return ast.expr.binaryOperator(">>", left, right); }
  / ExprPrimary

ExprPrimary
  = "-" e:ExprPrimary { return ast.expr.neg(e); }
  / "@" _ e:Expr      { return ast.expr.arg(e); }
  / "#" _ e:Expr      { return ast.expr.map(e); }
  / num:Number        { return ast.expr.num(num); }
  / id:Identifier     { return ast.expr.id(id); }
  / "$"               { return ast.expr.here(); }
  / "(" e:ExprAdd ")" { return ast.expr.paren(e); }

Number
  = text:[0-9]+ "h"              { return parseInt(text.join(""), 16); }
  / ("0x"/"$") text:[0-9a-fA-F]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+             { return parseInt(text.join(""), 2); }
  / text:[0-1]+ "b"              { return parseInt(text.join(""), 2); }
  / text:[0-9]+                  { return parseInt(text.join("")); }

String
  = '"' text:(!'"' .)* '"' { return _.map(text, function(i) { return i[1]; }).join(""); }

ExprChar
  = "'" t:(!"'" .) "'" { return t[1]; }

Identifier
  = p:"."? s:[a-zA-Z_0-9\.]+ { return (p||'') + s.join(''); }

//
// chars
//
Whitespace
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]

EOF
  = !.

//
// whitespace
//
_
  = (Whitespace / CommentNoLineTerminator)*

__
  = (Whitespace / Comment)*

//
// comments
//
Comment
  = SingleLineComment / SingleLineComment2 / MultiLineComment

CommentNoLineTerminator
  = SingleLineComment / MultiLineCommentNoLineTerminator

SingleLineComment
  = "//" (!LineTerminator .)*

SingleLineComment2
  = ";" (!LineTerminator .)*

MultiLineComment
  = "/*" (!"*/" .)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) .)* "*/"
