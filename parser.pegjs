Start
  = Program

Program
  = Inst

Inst
  = inst:Identifier _ args:Args? { return {inst:inst, args:args}; }

Args
  = head:Arg tail:(_ "," _ Arg)* { var n = [head]; for(var i = 0; i < tail.length; i++) n.push(tail[i][3]); return n; }

Arg
  = num:Number { return {num:num}; }
  / id:Identifier { return {id:id}; }

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

//
// whitespace
//
_
  = Whitespace*
