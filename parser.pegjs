{
  var _ = require('underscore');
}

Start
  = Program

Program
  = Lines

Lines
  = head:Inst tail:(LineTerminator Inst)* { return [head].concat(_.map(tail, function(i) { return i[1]; })); }

Inst
  = inst:Identifier _ args:Args? { return {inst:inst, args:args}; }

Args
  = head:Arg tail:(_ "," _ Arg)* { return [head].concat(_.map(tail, function(i) { return i[3]; })); }

Arg
  = num:Number { return {num:num}; }
  / id:Identifier { return {id:id}; }
  / "(" _ "ix"i _ ("+" / "-") _ num:Number ")" { return {offset_ptr:{id:"ix", offset:num}}; }
  / "(" _ "iy"i _ ("+" / "-") _ num:Number ")" { return {offset_ptr:{id:"ix", offset:num}}; }
  / "(" a:Arg ")" { return {ptr:a}; }

//
// Expr
//
Number
  = text:[0-9]+ "h"  { return parseInt(text.join(""), 16); }
  / text:[0-1]+ "b"  { return parseInt(text.join(""), 2); }
  / "0x" text:[0-9]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+ { return parseInt(text.join(""), 2); }
  / text:[0-9]+ { return parseInt(text.join("")); }

//
// chars
//
Identifier
  = head:[a-zA-Z_] tail:[a-zA-Z0-9_]* { return head + tail.join(""); }

Whitespace
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]

//
// whitespace
//
_
  = Whitespace*
