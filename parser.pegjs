start
  = lines

lines
  = line
  / line lines

line
  = inst:inst { return [inst]; }

inst
  = opcode:[a-zA-Z]+ { return {opcode:opcode.join("").toUpperCase()}; }
