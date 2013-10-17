Start
  = Program

Program
  = Inst

Inst
  = inst:Identifier { return {inst:inst}; }

//
// chars
//
Identifier
  = head:[a-zA-Z_] tail:[a-zA-Z0-9_]* { return head + tail.join(""); }
