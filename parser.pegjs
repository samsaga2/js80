{
  var _ = require('underscore');
}

Start
  = Program

Program
  = Lines

Lines
  = __ head:Line tail:(__ (LineTerminator/"$") __ Line)* __ { return [head].concat(_.map(tail, function(i) { return i[3]; })); }

Line
  = l:Label _ c:Command { return {label:l, line:c}; }
  / l:Label { return {label:l}; }
  / c:Command { return {line:c}; }

Label
  = l:Identifier ":" { return l; }

Command
  = "org"i _ n:Expr { return {org:n}; }
  / "ds"i _ n:Expr { return {ds:n}; }
  / "dw"i _ head:Expr tail:(_ "," _ Expr)* { return {dw:[head].concat(_.map(tail, function(i) { return i[3]; }))}; }
  / "db"i _ head:DbExpr tail:(_ "," _ DbExpr)* { return {db:[head].concat(_.map(tail, function(i) { return i[3]; }))}; }
  / inst:Identifier _ args:InstArgs? { return {inst:inst, args:args}; }

DbExpr
  = Expr
  / s:String { return {str:s}; }

InstArgs
  = head:Arg tail:(_ "," _ Arg)* { return [head].concat(_.map(tail, function(i) { return i[3]; })); }

Arg
  = Expr

//
// Expr
//
Expr
  = e:ExprAdd { return {expr:e}; }
  / e:String { return {str:e}; }

ExprAdd
  = left:ExprMul _ right:([+-] ExprMul)+ {
  var n=[left].concat(_.map(right, function(i) {
    if(i[0]==='-') {
     return {neg:i[1]};
    } else {
     return i[1];
    }
  }));
  return {unary:"+", args:n};
}
  / ExprPrimary

ExprMul
  = left:ExprPrimary _ "*" _ right:ExprMul { return {unary:"*", args:[left, right]}; }
  / left:ExprPrimary _ "/" _ right:ExprMul { return {unary:"/", args:[left, right]}; }
  / ExprPrimary

ExprPrimary
  = "-" e:ExprPrimary { return {neg:e}; }
  / num:Number { return {num:num}; }
  / id:Identifier { return {id:id}; }
  / "(" e:ExprAdd ")" { return {paren:e}; }

Number
  = text:[0-9]+ "h"  { return parseInt(text.join(""), 16); }
  / text:[0-1]+ "b"  { return parseInt(text.join(""), 2); }
  / "0x" text:[0-9]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+ { return parseInt(text.join(""), 2); }
  / text:[0-9]+ { return parseInt(text.join("")); }

String
  = '"' text:(!'"' .)* '"' { return _.map(text, function(i) { return i[1]; }).join(""); }

Identifier
  = head:[a-zA-Z_.] tail:[a-zA-Z0-9_.]* { return head + tail.join(""); }

//
// chars
//
Whitespace
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]

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
