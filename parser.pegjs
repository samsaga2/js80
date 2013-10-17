Start
  = Program

Program
  = Inst

Inst
  = inst:Identifier _ src:Arg? { return {inst:inst, src:src}; }

Arg
  = id:Identifier { return {id:id}; }

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
