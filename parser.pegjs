{
  var _ = require('underscore');
  var macro = null;
  var repeat = null;
  var prevRepeats = [];
}

Start
  = l:Lines __ LineTerminator* { return l; }

Lines
  = __ head:ProgLine tail:(__ (LineTerminator/"\\")+ __ ProgLine)* __ {
    tail = _.map(tail, function(i) { return i[3]; });
    return _.flatten([head, tail]);
  }

ProgLine
  = l:Line {
    if(repeat) { repeat.body.push(l); return []; }
    if(macro)  { macro.body.push(l); return []; }
    return l;
  }

Line
  = l:Identifier _ "equ"i _ e:Expr { return {equ:{label:l, value:e}, line:line}; }
  / l:Label _ i:Inst               { return [{label:l, line:line}, i] }
  / l:Label                        { return {label:l, line:line}; }
  / i:Inst                         { return i; }

Label
  = l:Identifier ":" { return l; }

Inst
  = "."? "org"i _ n:Expr                       { return {org:n}; }
  / "."? "map"i _ n:Expr                       { return {map:n}; }
  / "."? ("ds"i/"defs"i) _ n:Expr _ "," _ v:Expr
                                               { return {ds:{len:n,value:v}}; }
  / "."? ("ds"i/"defs"i) _ n:Expr              { return {ds:{len:n,value:{num:0}}}; }
  / "."? ("dw"i/"defw"i) _ head:Expr tail:(_ "," _ Expr)*
                                               { return {dw:[head].concat(_.map(tail, function(i) { return i[3]; }))}; }
  / "."? ("db"i/"defb"i) _ head:DbExpr tail:(_ "," _ DbExpr)*
                                               { return {db:[head].concat(_.map(tail, function(i) { return i[3]; }))}; }
  / "."? "module"i _ i:Identifier              { return {module:i}; }
  / "."? "endmodule"i                          { return {endmodule:true}; }
  / "."? "include"i _ s:String                 { return {include:s}; }
  / "."? "incbin"i _ s:String                  { return {incbin:s}; }
  / "."? "macro"i _ i:Identifier _ a:MacroArgs?
                                               { if(macro) { throw new Error('Forbidden macro declaration'); } macro = {id:i, args:a, body:[]}; return {}; }
  / "."? "endmacro"i                           { var m = macro; macro = null; return {macro:m}; }
  / "."? ("repeat"i/"rept"i) _ n:Expr          { prevRepeats.push(repeat); repeat = {count:n, body:[]}; return {}; }
  / "."? ("endrepeat"i/"endr"i)                { var r = repeat; repeat = prevRepeats.pop(); return {repeat:r}; }
  / "."? "rotate"i _ n:Expr                    { return {rotate:n}; }
  / asm:Identifier _ args:InstArgs?            { return {asm:{inst:asm, args:args}}; }

DbExpr
  = Expr
  / s:String { return {str:s}; }

InstArgs
  = head:Expr tail:(_ "," _ Expr)* { return [head].concat(_.map(tail, function(i) { return i[3]; })); }

MacroArgs
  = head:MacroArg tail:(_ "," _ MacroArg)* { return [head].concat(_.map(tail, function(i) { return i[3]; })); }

MacroArg
  = i:Identifier _ ":" _ e:Expr { return {id:i, default:e}; }
  / i:Identifier                { return {id:i}; }
  / "1" _ ".." _ "*" __         { return {rest:true}; }

//
// Expr
//
Expr
  = e:ExprAdd    { return e; }
  / e:ExprChar   { return {chr:e}; }
  / e:String     { return {str:e}; }

ExprAdd
  = left:ExprLogic _ right:([+-] ExprLogic)+ {
    var n=[left].concat(_.map(right, function(i) {
      if(i[0]==='-') {
       return {neg:i[1]};
      } else {
       return i[1];
      }
    }));
    return {unary:"+", args:n};
  }
  / ExprLogic

ExprLogic
  = left:ExprMul _ "^" _ right:ExprLogic { return {unary:"^", args:[left, right]}; }
  / left:ExprMul _ "|" _ right:ExprLogic { return {unary:"|", args:[left, right]}; }
  / left:ExprMul _ "&" _ right:ExprLogic { return {unary:"&", args:[left, right]}; }
  / ExprMul

ExprMul
  = left:ExprShift _ "*" _ right:ExprMul { return {unary:"*", args:[left, right]}; }
  / left:ExprShift _ "/" _ right:ExprMul { return {unary:"/", args:[left, right]}; }
  / ExprShift

ExprShift
  = left:ExprPrimary _ "<<" _ right:ExprShift { return {unary:"<<", args:[left, right]}; }
  / left:ExprPrimary _ ">>" _ right:ExprShift { return {unary:">>", args:[left, right]}; }
  / ExprPrimary

ExprPrimary
  = "-" e:ExprPrimary { return {neg:e}; }
  / "$"               { return {id:'__here__'}; }
  / "@" _ e:Expr      { return {arg:e}; }
  / "#" _ e:Expr      { return {getMap:e}; }
  / num:Number        { return {num:num}; }
  / id:Identifier     { return {id:id}; }
  / "(" e:ExprAdd ")" { return {paren:e}; }

Number
  = text:[0-9]+ "h"        { return parseInt(text.join(""), 16); }
  / text:[0-1]+ "b"        { return parseInt(text.join(""), 2); }
  / "0x" text:[0-9a-fA-F]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+       { return parseInt(text.join(""), 2); }
  / text:[0-9]+            { return parseInt(text.join("")); }

String
  = '"' text:(!'"' .)* '"' { return _.map(text, function(i) { return i[1]; }).join(""); }

ExprChar
  = "'" t:(!"'" .) "'" { return t[1]; }

Identifier
  = head:[a-zA-Z_.] tail:[a-zA-Z0-9_.]* { return head + tail.join(""); }

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
  = SingleLineComment
  / MultiLineComment

SingleLineComment
  = "//" (!LineTerminator .)*

MultiLineComment
  = "/*" (!"*/" .)* "*/"

CommentNoLineTerminator
  = SingleLineComment
  / MultiLineCommentNoLineTerminator

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) .)* "*/"
