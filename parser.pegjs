Start
  = Line

Line
  = i:Inst { return [i]; }

Inst
  = "nop"i { return [0]; }
  / "ret"i { return [0xc9]; }
  / "ld"i Blank+ "a"i Comma n:Byte { return [0x3e, n]; }
  / "ld"i Blank+ "a"i Comma r:TableR { return [0x78+r]; }
  / "ld"i Blank+ "b"i Comma "(hl)"i { return [0x46]; }
  / "xor"i Blank+ r:TableR { return [0xa8+r]; }

TableR
  = "a"i    { return 7; }
  / "b"i    { return 0; }
  / "c"i    { return 1; }
  / "d"i    { return 2; }
  / "e"i    { return 3; }
  / "h"i    { return 4; }
  / "l"i    { return 5; }
  / "(hl)"i { return 6; }

Word
  = text:[a-zA-Z]+ { return text.join("").toUpperCase(); }

Byte
  = n:Number { return n; }

Comma
  = Blank* "," Blank*

Number
  = text:[0-9]+ { return Number(text.join("")); }

Blank
  = [\t\v\f \u00A0\uFEFF]

LineTerminator
  = [\n\r\u2028\u2029]