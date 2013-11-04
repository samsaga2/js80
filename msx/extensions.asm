macro push 1..*
  repeat @0
    @@push @1
    rotate 1
  endrepeat
endmacro

macro pop 1..*
  repeat @0
    @@pop @1
    rotate -1
  endrepeat
endmacro
