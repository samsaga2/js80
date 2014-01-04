{
  var _ = require('underscore'),
      ast = require('./ast');

  function compactList(head, tail) {
    return [head].concat(_.map(tail, function(i) { return i[3]; }));
  }

  ast.init();
}

Start
  = l:Lines __ LineTerminator* { return l; }

Lines
  = __ head:Line? tail:(__ (LineTerminator/"\\")+ __ Line?)* __ {
    tail = _.map(tail, function(i) { return i[3]; });
    return _.flatten([head, tail]);
  }

Line
  = l:Label _ "#" ws e:Expr    { return ast.equ(l, ast.expr.map(e), line); }
  / l:Label _ "equ"i ws e:Expr { return ast.equ(l, e, line); }
  / l:Label? _ i:Inst?         { return ast.label(l, i, line); }

Label
  = l:Identifier _ ":" { return l; }

Inst
  = "."? s:InternalInst                    { return s; }
  / m:"@@"? id:Identifier ws args:InstArgs { return ast.asmInst(id, args, _.isEmpty(m)); }
  / m:"@@"? id:Identifier                  { return ast.asmInst(id, null, _.isEmpty(m)); }

InternalInst
  = "org"i ws n:Expr                                      { return ast.org(n); }
  / "map"i ws n:Expr                                      { return ast.map(n); }
  / ("ds"i/"defs"i) ws n:Expr _ "," _ v:Expr              { return ast.defineSpace(n, v); }
  / ("ds"i/"defs"i) ws n:Expr                             { return ast.defineSpace(n, 0); }
  / ("dw"i/"defw"i) ws head:Expr tail:(_ "," _ Expr)*     { return ast.defineWords(compactList(head, tail)); }
  / ("db"i/"defb"i) ws head:Expr tail:(_ "," _ Expr)*     { return ast.defineBytes(compactList(head, tail)); }
  / "module"i ws i:Identifier                             { return ast.defineModule(i); }
  / "endmodule"i                                          { return ast.endModule(); }
  / "include"i ws s:String                                { return ast.include(s); }
  / "incbin"i ws s:String _ "," _ k:Expr _ "," _ l:Expr   { return ast.includeBinary(s, k, l); }
  / "incbin"i ws s:String _ "," _ k:Expr                  { return ast.includeBinary(s, k); }
  / "incbin"i ws s:String                                 { return ast.includeBinary(s); }
  / "macro"i ws id:Identifier ws args:MacroArgs           { return ast.defineMacro(id, args); }
  / "macro"i ws id:Identifier                             { return ast.defineMacro(id); }
  / "endmacro"i                                           { return ast.endMacro(); }
  / ("repeat"i/"rept"i) ws n:Expr                         { return ast.defineRepeat(n); }
  / ("endrepeat"i/"endr"i)                                { return ast.endRepeat(); }
  / "ifdef"i ws i:Identifier                              { return ast.ifDef(i); }
  / "ifndef"i ws i:Identifier                             { return ast.ifNotDef(i); }
  / "if"i ws e:Expr                                       { return ast.if(e); }
  / "else"i                                               { return ast.else(); }
  / "endif"i                                              { return ast.endIf(); }
  / "rotate"i ws n:Expr                                   { return ast.rotate(n); }
  / "defpage"i ws p:PageArg _ "," _ o:Expr _ "," _ s:Expr { return ast.definePage(p, o, s); }
  / "page"i ws p:PageArg                                  { return ast.page(p); }
  / "echo"i ws head:Expr tail:(_ "," _ Expr)*             { return ast.echo(compactList(head, tail)); }
  / "error"i ws msg:Expr                                  { return ast.error(msg); }
  / "struct"i ws i:Identifier                             { return ast.defineStruct(i); }
  / "endstruct"i                                          { return ast.endStruct(); }

PageArg
  = s:Expr _ ".." _ e:Expr      { return ast.macroArgRange(s, e); }
  / e:Expr                      { return e; }

InstArgs
  = head:Expr tail:(_ "," _ Expr)* { return compactList(head, tail); }

MacroArgs
  = head:MacroArg tail:(_ "," _ MacroArg)* { return compactList(head, tail); }

MacroArg
  = "1" _ ".." _ "*" __         { return ast.macroArgRest(); }
  / i:Identifier _ ":" _ e:Expr { return ast.macroArg(i, e); }
  / i:Identifier                { return ast.macroArg(i); }

//
// Expr
//
Expr
  = s:String           { return ast.expr.str(s); }
  / "'" t:(!"'" .) "'" { return ast.expr.chr(t[1]); }
  / e:ExprLogic        { return e; }

ExprLogic
  = left:ExprCmp _ "^" _ right:ExprLogic { return ast.expr.binary("^", left, right); }
  / left:ExprCmp _ "|" _ right:ExprLogic { return ast.expr.binary("|", left, right); }
  / left:ExprCmp _ "&" _ right:ExprLogic { return ast.expr.binary("&", left, right); }
  / ExprCmp

ExprCmp
  = left:ExprAdd _ "==" _ right:ExprAdd { return ast.expr.binary("=", left, right); }
  / left:ExprAdd _ "!=" _ right:ExprAdd { return ast.expr.binary("!=", left, right); }
  / left:ExprAdd _ "<=" _ right:ExprAdd { return ast.expr.binary("<=", left, right); }
  / left:ExprAdd _ ">=" _ right:ExprAdd { return ast.expr.binary(">=", left, right); }
  / left:ExprAdd _ "<"  _ right:ExprAdd { return ast.expr.binary("<", left, right); }
  / left:ExprAdd _ ">"  _ right:ExprAdd { return ast.expr.binary(">", left, right); }
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
    return {binary:{op:"+", args:n}};
  }
  / ExprMul

ExprMul
  = left:ExprShift _ "*" _ right:ExprMul { return ast.expr.binary("*", left, right); }
  / left:ExprShift _ "/" _ right:ExprMul { return ast.expr.binary("/", left, right); }
  / left:ExprShift _ "%" _ right:ExprMul { return ast.expr.binary("%", left, right); }
  / ExprShift

ExprShift
  = left:ExprPrimary _ "<<" _ right:ExprShift { return ast.expr.binary("<<", left, right); }
  / left:ExprPrimary _ ">>" _ right:ExprShift { return ast.expr.binary(">>", left, right); }
  / ExprPrimary

ExprPrimary
  = "-" e:ExprPrimary  { return ast.expr.neg(e); }
  / "@" _ e:Expr       { return ast.expr.arg(e); }
  / "#" _ e:Expr       { return ast.expr.map(e); }
  / num:Number         { return ast.expr.num(num); }
  / id:Identifier      { return ast.expr.id(id); }
  / "$"                { return ast.expr.here(); }
  / "(" e:ExprAdd ")"  { return ast.expr.paren(e); }

Number
  = text:[0-9]+ "h"              { return parseInt(text.join(""), 16); }
  / ("0x"/"$") text:[0-9a-fA-F]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+             { return parseInt(text.join(""), 2); }
  / text:[0-1]+ "b"              { return parseInt(text.join(""), 2); }
  / text:[0-9]+                  { return parseInt(text.join("")); }

String
  = '"' text:(!'"' .)* '"' { return _.map(text, function(i) { return i[1]; }).join(""); }

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

ws
  = (Whitespace / CommentNoLineTerminator)+

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
