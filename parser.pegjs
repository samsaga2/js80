Start
  = Lines

Lines
  = i:Line LineTerminator+ j:Lines { return [i,j]; }
  / i:Line { return i; }

Line
  = Blank? i:Inst Blank? { return [i]; }

Blank
  = (Whitespace / Comment)*

Whitespace
  = [\t\v\f \u00A0\uFEFF]

Comment
  = SingleLineComment
  / MultiLineComment

SingleLineComment
  = "//" (!LineTerminator .)*

MultiLineComment
  = "/*" (!"*/" .)* "*/"

Int3
  = n:Number { if(n<0||n>7) throw new Error('Value overflow'); else return n; }

Int8
  = n:Number { if(n<-127||n>256) throw new Error('Value overflow'); else return n; }

Int16
  = n:Number { if(n<-32767||n>32768) throw new Error('Value overflow'); else return n; }

Offset8
  = "+" n:Number { if(n>128) throw new Error('Value overflow'); else return n; } // TODO
  / "-" n:Number { if(n>127) throw new Error('Value overflow'); return -n; } // TODO

TableR
  = "A"i    { return 7; }
  / "B"i    { return 0; }
  / "C"i    { return 1; }
  / "D"i    { return 2; }
  / "E"i    { return 3; }
  / "H"i    { return 4; }
  / "L"i    { return 5; }
  / "(HL)"i { return 6; }

TableIXp
  = "IXh"i  { return 4; }
  / "IXl"i  { return 5; }

TableIYq
  = "IYh"i  { return 4; }
  / "IYl"i  { return 5; }

Comma
  = Blank? "," Blank?

Number
  = text:[0-9]+ "h"  { return parseInt(text.join(""), 16); }
  / text:[0-1]+ "b"  { return parseInt(text.join(""), 2); }
  / "0x" text:[0-9]+ { return parseInt(text.join(""), 16); }
  / "0b" text:[0-1]+ { return parseInt(text.join(""), 2); }
  / text:[0-9]+ { return parseInt(text.join("")); }

LineTerminator
  = [\n\r\u2028\u2029]

Inst
  = "ADC"i Blank "A"i Comma "(HL)"i                                                 		{ return [0x8E]; } // ADC A,(HL)
  / "ADC"i Blank "A"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"           		{ return [0xDD,0x8E,oo]; } // ADC A,(IX+o)
  / "ADC"i Blank "A"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"           		{ return [0xFD,0x8E,oo]; } // ADC A,(IY+o)
  / "ADC"i Blank "A"i Comma nn:Int8                                                 		{ return [0xCE,nn]; } // ADC A,n
  / "ADC"i Blank "A"i Comma r:TableR                                                		{ return [0x88+r]; } // ADC A,r
  / "ADC"i Blank "A"i Comma p:TableIXp                                              		{ return [0xDD,0x88+p]; } // ADC A,IXp
  / "ADC"i Blank "A"i Comma q:TableIYq                                              		{ return [0xFD,0x88+q]; } // ADC A,IYq
  / "ADC"i Blank "HL"i Comma "BC"i                                                  		{ return [0xED,0x4A]; } // ADC HL,BC
  / "ADC"i Blank "HL"i Comma "DE"i                                                  		{ return [0xED,0x5A]; } // ADC HL,DE
  / "ADC"i Blank "HL"i Comma "HL"i                                                  		{ return [0xED,0x6A]; } // ADC HL,HL
  / "ADC"i Blank "HL"i Comma "SP"i                                                  		{ return [0xED,0x7A]; } // ADC HL,SP
  / "ADD"i Blank "A"i Comma "(HL)"i                                                 		{ return [0x86]; } // ADD A,(HL)
  / "ADD"i Blank "A"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"           		{ return [0xDD,0x86,oo]; } // ADD A,(IX+o)
  / "ADD"i Blank "A"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"           		{ return [0xFD,0x86,oo]; } // ADD A,(IY+o)
  / "ADD"i Blank "A"i Comma nn:Int8                                                 		{ return [0xC6,nn]; } // ADD A,n
  / "ADD"i Blank "A"i Comma r:TableR                                                		{ return [0x80+r]; } // ADD A,r
  / "ADD"i Blank "A"i Comma p:TableIXp                                              		{ return [0xDD,0x80+p]; } // ADD A,IXp
  / "ADD"i Blank "A"i Comma q:TableIYq                                              		{ return [0xFD,0x80+q]; } // ADD A,IYq
  / "ADD"i Blank "HL"i Comma "BC"i                                                  		{ return [0x09]; } // ADD HL,BC
  / "ADD"i Blank "HL"i Comma "DE"i                                                  		{ return [0x19]; } // ADD HL,DE
  / "ADD"i Blank "HL"i Comma "HL"i                                                  		{ return [0x29]; } // ADD HL,HL
  / "ADD"i Blank "HL"i Comma "SP"i                                                  		{ return [0x39]; } // ADD HL,SP
  / "ADD"i Blank "IX"i Comma "BC"i                                                  		{ return [0xDD,0x09]; } // ADD IX,BC
  / "ADD"i Blank "IX"i Comma "DE"i                                                  		{ return [0xDD,0x19]; } // ADD IX,DE
  / "ADD"i Blank "IX"i Comma "IX"i                                                  		{ return [0xDD,0x29]; } // ADD IX,IX
  / "ADD"i Blank "IX"i Comma "SP"i                                                  		{ return [0xDD,0x39]; } // ADD IX,SP
  / "ADD"i Blank "IY"i Comma "BC"i                                                  		{ return [0xFD,0x09]; } // ADD IY,BC
  / "ADD"i Blank "IY"i Comma "DE"i                                                  		{ return [0xFD,0x19]; } // ADD IY,DE
  / "ADD"i Blank "IY"i Comma "IY"i                                                  		{ return [0xFD,0x29]; } // ADD IY,IY
  / "ADD"i Blank "IY"i Comma "SP"i                                                  		{ return [0xFD,0x39]; } // ADD IY,SP
  / "AND"i Blank "(HL)"i                                                            		{ return [0xA6]; } // AND (HL)
  / "AND"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xA6,oo]; } // AND (IX+o)
  / "AND"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xA6,oo]; } // AND (IY+o)
  / "AND"i Blank nn:Int8                                                            		{ return [0xE6,nn]; } // AND n
  / "AND"i Blank r:TableR                                                           		{ return [0xA0+r]; } // AND r
  / "AND"i Blank p:TableIXp                                                         		{ return [0xDD,0xA0+p]; } // AND IXp
  / "AND"i Blank q:TableIYq                                                         		{ return [0xFD,0xA0+q]; } // AND IYq
  / "BIT"i Blank b:Int3 Comma "(HL)"i                                               		{ return [0xCB,0x46+0x8*b]; } // BIT b,(HL)
  / "BIT"i Blank b:Int3 Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"         		{ return [0xDD,0xCB,oo,0x46+0x8*b]; } // BIT b,(IX+o)
  / "BIT"i Blank b:Int3 Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"         		{ return [0xFD,0xCB,oo,0x46+0x8*b]; } // BIT b,(IY+o)
  / "BIT"i Blank b:Int3 Comma r:TableR                                              		{ return [0xCB,0x40+0x8*b+r]; } // BIT b,r
  / "CALL"i Blank nn:Int16                                                          		{ return [0xCD,nn&255,nn>>8]; } // CALL nn
  / "CALL"i Blank "C"i Comma nn:Int16                                               		{ return [0xDC,nn&255,nn>>8]; } // CALL C,nn
  / "CALL"i Blank "M"i Comma nn:Int16                                               		{ return [0xFC,nn&255,nn>>8]; } // CALL M,nn
  / "CALL"i Blank "NC"i Comma nn:Int16                                              		{ return [0xD4,nn&255,nn>>8]; } // CALL NC,nn
  / "CALL"i Blank "NZ"i Comma nn:Int16                                              		{ return [0xC4,nn&255,nn>>8]; } // CALL NZ,nn
  / "CALL"i Blank "P"i Comma nn:Int16                                               		{ return [0xF4,nn&255,nn>>8]; } // CALL P,nn
  / "CALL"i Blank "PE"i Comma nn:Int16                                              		{ return [0xEC,nn&255,nn>>8]; } // CALL PE,nn
  / "CALL"i Blank "PO"i Comma nn:Int16                                              		{ return [0xE4,nn&255,nn>>8]; } // CALL PO,nn
  / "CALL"i Blank "Z"i Comma nn:Int16                                               		{ return [0xCC,nn&255,nn>>8]; } // CALL Z,nn
  / "CCF"i                                                                          		{ return [0x3F]; } // CCF
  / "CP"i Blank "(HL)"i                                                             		{ return [0xBE]; } // CP (HL)
  / "CP"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xDD,0xBE,oo]; } // CP (IX+o)
  / "CP"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xFD,0xBE,oo]; } // CP (IY+o)
  / "CP"i Blank nn:Int8                                                             		{ return [0xFE,nn]; } // CP n
  / "CP"i Blank r:TableR                                                            		{ return [0xB8+r]; } // CP r
  / "CP"i Blank p:TableIXp                                                          		{ return [0xDD,0xB8+p]; } // CP IXp
  / "CP"i Blank q:TableIYq                                                          		{ return [0xFD,0xB8+q]; } // CP IYq
  / "CPD"i                                                                          		{ return [0xED,0xA9]; } // CPD
  / "CPDR"i                                                                         		{ return [0xED,0xB9]; } // CPDR
  / "CPI"i                                                                          		{ return [0xED,0xA1]; } // CPI
  / "CPIR"i                                                                         		{ return [0xED,0xB1]; } // CPIR
  / "CPL"i                                                                          		{ return [0x2F]; } // CPL
  / "DAA"i                                                                          		{ return [0x27]; } // DAA
  / "DEC"i Blank "(HL)"i                                                            		{ return [0x35]; } // DEC (HL)
  / "DEC"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0x35,oo]; } // DEC (IX+o)
  / "DEC"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0x35,oo]; } // DEC (IY+o)
  / "DEC"i Blank "A"i                                                               		{ return [0x3D]; } // DEC A
  / "DEC"i Blank "B"i                                                               		{ return [0x05]; } // DEC B
  / "DEC"i Blank "BC"i                                                              		{ return [0x0B]; } // DEC BC
  / "DEC"i Blank "C"i                                                               		{ return [0x0D]; } // DEC C
  / "DEC"i Blank "D"i                                                               		{ return [0x15]; } // DEC D
  / "DEC"i Blank "DE"i                                                              		{ return [0x1B]; } // DEC DE
  / "DEC"i Blank "E"i                                                               		{ return [0x1D]; } // DEC E
  / "DEC"i Blank "H"i                                                               		{ return [0x25]; } // DEC H
  / "DEC"i Blank "HL"i                                                              		{ return [0x2B]; } // DEC HL
  / "DEC"i Blank "IX"i                                                              		{ return [0xDD,0x2B]; } // DEC IX
  / "DEC"i Blank "IY"i                                                              		{ return [0xFD,0x2B]; } // DEC IY
  / "DEC"i Blank p:TableIXp                                                         		{ return [0xDD,0x05+0x8*p]; } // DEC IXp
  / "DEC"i Blank q:TableIYq                                                         		{ return [0xFD,0x05+0x8*q]; } // DEC IYq
  / "DEC"i Blank "L"i                                                               		{ return [0x2D]; } // DEC L
  / "DEC"i Blank "SP"i                                                              		{ return [0x3B]; } // DEC SP
  / "DI"i                                                                           		{ return [0xF3]; } // DI
  / "DJNZ"i Blank "o"i                                                              		{ return [0x10,oo]; } // DJNZ o
  / "EI"i                                                                           		{ return [0xFB]; } // EI
  / "EX"i Blank "(SP)"i Comma "HL"i                                                 		{ return [0xE3]; } // EX (SP),HL
  / "EX"i Blank "(SP)"i Comma "IX"i                                                 		{ return [0xDD,0xE3]; } // EX (SP),IX
  / "EX"i Blank "(SP)"i Comma "IY"i                                                 		{ return [0xFD,0xE3]; } // EX (SP),IY
  / "EX"i Blank "AF"i Comma "AF'"i                                                  		{ return [0x08]; } // EX AF,AF'
  / "EX"i Blank "DE"i Comma "HL"i                                                   		{ return [0xEB]; } // EX DE,HL
  / "EXX"i                                                                          		{ return [0xD9]; } // EXX
  / "HALT"i                                                                         		{ return [0x76]; } // HALT
  / "IM"i Blank "0"i                                                                		{ return [0xED,0x46]; } // IM 0
  / "IM"i Blank "1"i                                                                		{ return [0xED,0x56]; } // IM 1
  / "IM"i Blank "2"i                                                                		{ return [0xED,0x5E]; } // IM 2
  / "IN"i Blank "A"i Comma "(C)"i                                                   		{ return [0xED,0x78]; } // IN A,(C)
  / "IN"i Blank "A"i Comma "(" Blank? nn:Int8 Blank? ")"                            		{ return [0xDB,nn]; } // IN A,(n)
  / "IN"i Blank "B"i Comma "(C)"i                                                   		{ return [0xED,0x40]; } // IN B,(C)
  / "IN"i Blank "C"i Comma "(C)"i                                                   		{ return [0xED,0x48]; } // IN C,(C)
  / "IN"i Blank "D"i Comma "(C)"i                                                   		{ return [0xED,0x50]; } // IN D,(C)
  / "IN"i Blank "E"i Comma "(C)"i                                                   		{ return [0xED,0x58]; } // IN E,(C)
  / "IN"i Blank "H"i Comma "(C)"i                                                   		{ return [0xED,0x60]; } // IN H,(C)
  / "IN"i Blank "L"i Comma "(C)"i                                                   		{ return [0xED,0x68]; } // IN L,(C)
  / "IN"i Blank "F"i Comma "(C)"i                                                   		{ return [0xED,0x70]; } // IN F,(C)
  / "INC"i Blank "(HL)"i                                                            		{ return [0x34]; } // INC (HL)
  / "INC"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0x34,oo]; } // INC (IX+o)
  / "INC"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0x34,oo]; } // INC (IY+o)
  / "INC"i Blank "A"i                                                               		{ return [0x3C]; } // INC A
  / "INC"i Blank "B"i                                                               		{ return [0x04]; } // INC B
  / "INC"i Blank "BC"i                                                              		{ return [0x03]; } // INC BC
  / "INC"i Blank "C"i                                                               		{ return [0x0C]; } // INC C
  / "INC"i Blank "D"i                                                               		{ return [0x14]; } // INC D
  / "INC"i Blank "DE"i                                                              		{ return [0x13]; } // INC DE
  / "INC"i Blank "E"i                                                               		{ return [0x1C]; } // INC E
  / "INC"i Blank "H"i                                                               		{ return [0x24]; } // INC H
  / "INC"i Blank "HL"i                                                              		{ return [0x23]; } // INC HL
  / "INC"i Blank "IX"i                                                              		{ return [0xDD,0x23]; } // INC IX
  / "INC"i Blank "IY"i                                                              		{ return [0xFD,0x23]; } // INC IY
  / "INC"i Blank p:TableIXp                                                         		{ return [0xDD,0x04+0x8*p]; } // INC IXp
  / "INC"i Blank q:TableIYq                                                         		{ return [0xFD,0x04+0x8*q]; } // INC IYq
  / "INC"i Blank "L"i                                                               		{ return [0x2C]; } // INC L
  / "INC"i Blank "SP"i                                                              		{ return [0x33]; } // INC SP
  / "IND"i                                                                          		{ return [0xED,0xAA]; } // IND
  / "INDR"i                                                                         		{ return [0xED,0xBA]; } // INDR
  / "INI"i                                                                          		{ return [0xED,0xA2]; } // INI
  / "INIR"i                                                                         		{ return [0xED,0xB2]; } // INIR
  / "JP"i Blank nn:Int16                                                            		{ return [0xC3,nn&255,nn>>8]; } // JP nn
  / "JP"i Blank "(HL)"i                                                             		{ return [0xE9]; } // JP (HL)
  / "JP"i Blank "(IX)"i                                                             		{ return [0xDD,0xE9]; } // JP (IX)
  / "JP"i Blank "(IY)"i                                                             		{ return [0xFD,0xE9]; } // JP (IY)
  / "JP"i Blank "C"i Comma nn:Int16                                                 		{ return [0xDA,nn&255,nn>>8]; } // JP C,nn
  / "JP"i Blank "M"i Comma nn:Int16                                                 		{ return [0xFA,nn&255,nn>>8]; } // JP M,nn
  / "JP"i Blank "NC"i Comma nn:Int16                                                		{ return [0xD2,nn&255,nn>>8]; } // JP NC,nn
  / "JP"i Blank "NZ"i Comma nn:Int16                                                		{ return [0xC2,nn&255,nn>>8]; } // JP NZ,nn
  / "JP"i Blank "P"i Comma nn:Int16                                                 		{ return [0xF2,nn&255,nn>>8]; } // JP P,nn
  / "JP"i Blank "PE"i Comma nn:Int16                                                		{ return [0xEA,nn&255,nn>>8]; } // JP PE,nn
  / "JP"i Blank "PO"i Comma nn:Int16                                                		{ return [0xE2,nn&255,nn>>8]; } // JP PO,nn
  / "JP"i Blank "Z"i Comma nn:Int16                                                 		{ return [0xCA,nn&255,nn>>8]; } // JP Z,nn
  / "JR"i Blank "o"i                                                                		{ return [0x18,oo]; } // JR o
  / "JR"i Blank "C"i Comma "o"i                                                     		{ return [0x38,oo]; } // JR C,o
  / "JR"i Blank "NC"i Comma "o"i                                                    		{ return [0x30,oo]; } // JR NC,o
  / "JR"i Blank "NZ"i Comma "o"i                                                    		{ return [0x20,oo]; } // JR NZ,o
  / "JR"i Blank "Z"i Comma "o"i                                                     		{ return [0x28,oo]; } // JR Z,o
  / "LD"i Blank "(BC)"i Comma "A"i                                                  		{ return [0x02]; } // LD (BC),A
  / "LD"i Blank "(DE)"i Comma "A"i                                                  		{ return [0x12]; } // LD (DE),A
  / "LD"i Blank "(HL)"i Comma nn:Int8                                               		{ return [0x36,nn]; } // LD (HL),n
  / "LD"i Blank "(HL)"i Comma r:TableR                                              		{ return [0x70+r]; } // LD (HL),r
  / "LD"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")" Comma nn:Int8         		{ return [0xDD,0x36,oo,nn]; } // LD (IX+o),n
  / "LD"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")" Comma r:TableR        		{ return [0xDD,0x70+r,oo]; } // LD (IX+o),r
  / "LD"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")" Comma nn:Int8         		{ return [0xFD,0x36,oo,nn]; } // LD (IY+o),n
  / "LD"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")" Comma r:TableR        		{ return [0xFD,0x70+r,oo]; } // LD (IY+o),r
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "A"i                           		{ return [0x32,nn&255,nn>>8]; } // LD (nn),A
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "BC"i                          		{ return [0xED,0x43,nn&255,nn>>8]; } // LD (nn),BC
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "DE"i                          		{ return [0xED,0x53,nn&255,nn>>8]; } // LD (nn),DE
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "HL"i                          		{ return [0x22,nn&255,nn>>8]; } // LD (nn),HL
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "IX"i                          		{ return [0xDD,0x22,nn&255,nn>>8]; } // LD (nn),IX
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "IY"i                          		{ return [0xFD,0x22,nn&255,nn>>8]; } // LD (nn),IY
  / "LD"i Blank "(" Blank? nn:Int16 Blank? ")" Comma "SP"i                          		{ return [0xED,0x73,nn&255,nn>>8]; } // LD (nn),SP
  / "LD"i Blank "A"i Comma "(BC)"i                                                  		{ return [0x0A]; } // LD A,(BC)
  / "LD"i Blank "A"i Comma "(DE)"i                                                  		{ return [0x1A]; } // LD A,(DE)
  / "LD"i Blank "A"i Comma "(HL)"i                                                  		{ return [0x7E]; } // LD A,(HL)
  / "LD"i Blank "A"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x7E,oo]; } // LD A,(IX+o)
  / "LD"i Blank "A"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x7E,oo]; } // LD A,(IY+o)
  / "LD"i Blank "A"i Comma "(" Blank? nn:Int16 Blank? ")"                           		{ return [0x3A,nn&255,nn>>8]; } // LD A,(nn)
  / "LD"i Blank "A"i Comma nn:Int8                                                  		{ return [0x3E,nn]; } // LD A,n
  / "LD"i Blank "A"i Comma r:TableR                                                 		{ return [0x78+r]; } // LD A,r
  / "LD"i Blank "A"i Comma p:TableIXp                                               		{ return [0xDD,0x78+p]; } // LD A,IXp
  / "LD"i Blank "A"i Comma q:TableIYq                                               		{ return [0xFD,0x78+q]; } // LD A,IYq
  / "LD"i Blank "A"i Comma "I"i                                                     		{ return [0xED,0x57]; } // LD A,I
  / "LD"i Blank "A"i Comma "R"i                                                     		{ return [0xED,0x5F]; } // LD A,R
  / "LD"i Blank "B"i Comma "(HL)"i                                                  		{ return [0x46]; } // LD B,(HL)
  / "LD"i Blank "B"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x46,oo]; } // LD B,(IX+o)
  / "LD"i Blank "B"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x46,oo]; } // LD B,(IY+o)
  / "LD"i Blank "B"i Comma nn:Int8                                                  		{ return [0x06,nn]; } // LD B,n
  / "LD"i Blank "B"i Comma r:TableR                                                 		{ return [0x40+r]; } // LD B,r
  / "LD"i Blank "B"i Comma p:TableIXp                                               		{ return [0xDD,0x40+p]; } // LD B,IXp
  / "LD"i Blank "B"i Comma q:TableIYq                                               		{ return [0xFD,0x40+q]; } // LD B,IYq
  / "LD"i Blank "BC"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0xED,0x4B,nn&255,nn>>8]; } // LD BC,(nn)
  / "LD"i Blank "BC"i Comma nn:Int16                                                		{ return [0x01,nn&255,nn>>8]; } // LD BC,nn
  / "LD"i Blank "C"i Comma "(HL)"i                                                  		{ return [0x4E]; } // LD C,(HL)
  / "LD"i Blank "C"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x4E,oo]; } // LD C,(IX+o)
  / "LD"i Blank "C"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x4E,oo]; } // LD C,(IY+o)
  / "LD"i Blank "C"i Comma nn:Int8                                                  		{ return [0x0E,nn]; } // LD C,n
  / "LD"i Blank "C"i Comma r:TableR                                                 		{ return [0x48+r]; } // LD C,r
  / "LD"i Blank "C"i Comma p:TableIXp                                               		{ return [0xDD,0x48+p]; } // LD C,IXp
  / "LD"i Blank "C"i Comma q:TableIYq                                               		{ return [0xFD,0x48+q]; } // LD C,IYq
  / "LD"i Blank "D"i Comma "(HL)"i                                                  		{ return [0x56]; } // LD D,(HL)
  / "LD"i Blank "D"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x56,oo]; } // LD D,(IX+o)
  / "LD"i Blank "D"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x56,oo]; } // LD D,(IY+o)
  / "LD"i Blank "D"i Comma nn:Int8                                                  		{ return [0x16,nn]; } // LD D,n
  / "LD"i Blank "D"i Comma r:TableR                                                 		{ return [0x50+r]; } // LD D,r
  / "LD"i Blank "D"i Comma p:TableIXp                                               		{ return [0xDD,0x50+p]; } // LD D,IXp
  / "LD"i Blank "D"i Comma q:TableIYq                                               		{ return [0xFD,0x50+q]; } // LD D,IYq
  / "LD"i Blank "DE"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0xED,0x5B,nn&255,nn>>8]; } // LD DE,(nn)
  / "LD"i Blank "DE"i Comma nn:Int16                                                		{ return [0x11,nn&255,nn>>8]; } // LD DE,nn
  / "LD"i Blank "E"i Comma "(HL)"i                                                  		{ return [0x5E]; } // LD E,(HL)
  / "LD"i Blank "E"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x5E,oo]; } // LD E,(IX+o)
  / "LD"i Blank "E"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x5E,oo]; } // LD E,(IY+o)
  / "LD"i Blank "E"i Comma nn:Int8                                                  		{ return [0x1E,nn]; } // LD E,n
  / "LD"i Blank "E"i Comma r:TableR                                                 		{ return [0x58+r]; } // LD E,r
  / "LD"i Blank "E"i Comma p:TableIXp                                               		{ return [0xDD,0x58+p]; } // LD E,IXp
  / "LD"i Blank "E"i Comma q:TableIYq                                               		{ return [0xFD,0x58+q]; } // LD E,IYq
  / "LD"i Blank "H"i Comma "(HL)"i                                                  		{ return [0x66]; } // LD H,(HL)
  / "LD"i Blank "H"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x66,oo]; } // LD H,(IX+o)
  / "LD"i Blank "H"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x66,oo]; } // LD H,(IY+o)
  / "LD"i Blank "H"i Comma nn:Int8                                                  		{ return [0x26,nn]; } // LD H,n
  / "LD"i Blank "H"i Comma r:TableR                                                 		{ return [0x60+r]; } // LD H,r
  / "LD"i Blank "HL"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0x2A,nn&255,nn>>8]; } // LD HL,(nn)
  / "LD"i Blank "HL"i Comma nn:Int16                                                		{ return [0x21,nn&255,nn>>8]; } // LD HL,nn
  / "LD"i Blank "I"i Comma "A"i                                                     		{ return [0xED,0x47]; } // LD I,A
  / "LD"i Blank "IX"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0xDD,0x2A,nn&255,nn>>8]; } // LD IX,(nn)
  / "LD"i Blank "IX"i Comma nn:Int16                                                		{ return [0xDD,0x21,nn&255,nn>>8]; } // LD IX,nn
  / "LD"i Blank "IXh"i Comma nn:Int8                                                		{ return [0xDD,0x26,nn]; } // LD IXh,n
  / "LD"i Blank "IXh"i Comma "p"i                                                   		{ return [0xDD,0x60+p]; } // LD IXh,p
  / "LD"i Blank "IXl"i Comma nn:Int8                                                		{ return [0xDD,0x2E,nn]; } // LD IXl,n
  / "LD"i Blank "IXl"i Comma "p"i                                                   		{ return [0xDD,0x68+p]; } // LD IXl,p
  / "LD"i Blank "IY"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0xFD,0x2A,nn&255,nn>>8]; } // LD IY,(nn)
  / "LD"i Blank "IY"i Comma nn:Int16                                                		{ return [0xFD,0x21,nn&255,nn>>8]; } // LD IY,nn
  / "LD"i Blank "IYh"i Comma nn:Int8                                                		{ return [0xFD,0x26,nn]; } // LD IYh,n
  / "LD"i Blank "IYh"i Comma "q"i                                                   		{ return [0xFD,0x60+q]; } // LD IYh,q
  / "LD"i Blank "IYl"i Comma nn:Int8                                                		{ return [0xFD,0x2E,nn]; } // LD IYl,n
  / "LD"i Blank "IYl"i Comma "q"i                                                   		{ return [0xFD,0x68+q]; } // LD IYl,q
  / "LD"i Blank "L"i Comma "(HL)"i                                                  		{ return [0x6E]; } // LD L,(HL)
  / "LD"i Blank "L"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"            		{ return [0xDD,0x6E,oo]; } // LD L,(IX+o)
  / "LD"i Blank "L"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"            		{ return [0xFD,0x6E,oo]; } // LD L,(IY+o)
  / "LD"i Blank "L"i Comma nn:Int8                                                  		{ return [0x2E,nn]; } // LD L,n
  / "LD"i Blank "L"i Comma r:TableR                                                 		{ return [0x68+r]; } // LD L,r
  / "LD"i Blank "R"i Comma "A"i                                                     		{ return [0xED,0x4F]; } // LD R,A
  / "LD"i Blank "SP"i Comma "(" Blank? nn:Int16 Blank? ")"                          		{ return [0xED,0x7B,nn&255,nn>>8]; } // LD SP,(nn)
  / "LD"i Blank "SP"i Comma "HL"i                                                   		{ return [0xF9]; } // LD SP,HL
  / "LD"i Blank "SP"i Comma "IX"i                                                   		{ return [0xDD,0xF9]; } // LD SP,IX
  / "LD"i Blank "SP"i Comma "IY"i                                                   		{ return [0xFD,0xF9]; } // LD SP,IY
  / "LD"i Blank "SP"i Comma nn:Int16                                                		{ return [0x31,nn&255,nn>>8]; } // LD SP,nn
  / "LDD"i                                                                          		{ return [0xED,0xA8]; } // LDD
  / "LDDR"i                                                                         		{ return [0xED,0xB8]; } // LDDR
  / "LDI"i                                                                          		{ return [0xED,0xA0]; } // LDI
  / "LDIR"i                                                                         		{ return [0xED,0xB0]; } // LDIR
  / "MULUB"i Blank "A"i Comma r:TableR                                              		{ return [0xED,0xC1+0x8*r]; } // MULUB A,r
  / "MULUW"i Blank "HL"i Comma "BC"i                                                		{ return [0xED,0xC3]; } // MULUW HL,BC
  / "MULUW"i Blank "HL"i Comma "SP"i                                                		{ return [0xED,0xF3]; } // MULUW HL,SP
  / "NEG"i                                                                          		{ return [0xED,0x44]; } // NEG
  / "NOP"i                                                                          		{ return [0x00]; } // NOP
  / "OR"i Blank "(HL)"i                                                             		{ return [0xB6]; } // OR (HL)
  / "OR"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xDD,0xB6,oo]; } // OR (IX+o)
  / "OR"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xFD,0xB6,oo]; } // OR (IY+o)
  / "OR"i Blank nn:Int8                                                             		{ return [0xF6,nn]; } // OR n
  / "OR"i Blank r:TableR                                                            		{ return [0xB0+r]; } // OR r
  / "OR"i Blank p:TableIXp                                                          		{ return [0xDD,0xB0+p]; } // OR IXp
  / "OR"i Blank q:TableIYq                                                          		{ return [0xFD,0xB0+q]; } // OR IYq
  / "OTDR"i                                                                         		{ return [0xED,0xBB]; } // OTDR
  / "OTIR"i                                                                         		{ return [0xED,0xB3]; } // OTIR
  / "OUT"i Blank "(C)"i Comma "A"i                                                  		{ return [0xED,0x79]; } // OUT (C),A
  / "OUT"i Blank "(C)"i Comma "B"i                                                  		{ return [0xED,0x41]; } // OUT (C),B
  / "OUT"i Blank "(C)"i Comma "C"i                                                  		{ return [0xED,0x49]; } // OUT (C),C
  / "OUT"i Blank "(C)"i Comma "D"i                                                  		{ return [0xED,0x51]; } // OUT (C),D
  / "OUT"i Blank "(C)"i Comma "E"i                                                  		{ return [0xED,0x59]; } // OUT (C),E
  / "OUT"i Blank "(C)"i Comma "H"i                                                  		{ return [0xED,0x61]; } // OUT (C),H
  / "OUT"i Blank "(C)"i Comma "L"i                                                  		{ return [0xED,0x69]; } // OUT (C),L
  / "OUT"i Blank "(" Blank? nn:Int8 Blank? ")" Comma "A"i                           		{ return [0xD3,nn]; } // OUT (n),A
  / "OUTD"i                                                                         		{ return [0xED,0xAB]; } // OUTD
  / "OUTI"i                                                                         		{ return [0xED,0xA3]; } // OUTI
  / "POP"i Blank "AF"i                                                              		{ return [0xF1]; } // POP AF
  / "POP"i Blank "BC"i                                                              		{ return [0xC1]; } // POP BC
  / "POP"i Blank "DE"i                                                              		{ return [0xD1]; } // POP DE
  / "POP"i Blank "HL"i                                                              		{ return [0xE1]; } // POP HL
  / "POP"i Blank "IX"i                                                              		{ return [0xDD,0xE1]; } // POP IX
  / "POP"i Blank "IY"i                                                              		{ return [0xFD,0xE1]; } // POP IY
  / "PUSH"i Blank "AF"i                                                             		{ return [0xF5]; } // PUSH AF
  / "PUSH"i Blank "BC"i                                                             		{ return [0xC5]; } // PUSH BC
  / "PUSH"i Blank "DE"i                                                             		{ return [0xD5]; } // PUSH DE
  / "PUSH"i Blank "HL"i                                                             		{ return [0xE5]; } // PUSH HL
  / "PUSH"i Blank "IX"i                                                             		{ return [0xDD,0xE5]; } // PUSH IX
  / "PUSH"i Blank "IY"i                                                             		{ return [0xFD,0xE5]; } // PUSH IY
  / "RES"i Blank b:Int3 Comma "(HL)"i                                               		{ return [0xCB,0x86+0x8*b]; } // RES b,(HL)
  / "RES"i Blank b:Int3 Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"         		{ return [0xDD,0xCB,oo,0x86+0x8*b]; } // RES b,(IX+o)
  / "RES"i Blank b:Int3 Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"         		{ return [0xFD,0xCB,oo,0x86+0x8*b]; } // RES b,(IY+o)
  / "RES"i Blank b:Int3 Comma r:TableR                                              		{ return [0xCB,0x80+0x8*b+r]; } // RES b,r
  / "RET"i                                                                          		{ return [0xC9]; } // RET
  / "RET"i Blank "C"i                                                               		{ return [0xD8]; } // RET C
  / "RET"i Blank "M"i                                                               		{ return [0xF8]; } // RET M
  / "RET"i Blank "NC"i                                                              		{ return [0xD0]; } // RET NC
  / "RET"i Blank "NZ"i                                                              		{ return [0xC0]; } // RET NZ
  / "RET"i Blank "P"i                                                               		{ return [0xF0]; } // RET P
  / "RET"i Blank "PE"i                                                              		{ return [0xE8]; } // RET PE
  / "RET"i Blank "PO"i                                                              		{ return [0xE0]; } // RET PO
  / "RET"i Blank "Z"i                                                               		{ return [0xC8]; } // RET Z
  / "RETI"i                                                                         		{ return [0xED,0x4D]; } // RETI
  / "RETN"i                                                                         		{ return [0xED,0x45]; } // RETN
  / "RL"i Blank "(HL)"i                                                             		{ return [0xCB,0x16]; } // RL (HL)
  / "RL"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xDD,0xCB,oo,0x16]; } // RL (IX+o)
  / "RL"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xFD,0xCB,oo,0x16]; } // RL (IY+o)
  / "RL"i Blank r:TableR                                                            		{ return [0xCB,0x10+r]; } // RL r
  / "RLA"i                                                                          		{ return [0x17]; } // RLA
  / "RLC"i Blank "(HL)"i                                                            		{ return [0xCB,0x06]; } // RLC (HL)
  / "RLC"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xCB,oo,0x06]; } // RLC (IX+o)
  / "RLC"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xCB,oo,0x06]; } // RLC (IY+o)
  / "RLC"i Blank r:TableR                                                           		{ return [0xCB,0x00+r]; } // RLC r
  / "RLCA"i                                                                         		{ return [0x07]; } // RLCA
  / "RLD"i                                                                          		{ return [0xED,0x6F]; } // RLD
  / "RR"i Blank "(HL)"i                                                             		{ return [0xCB,0x1E]; } // RR (HL)
  / "RR"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xDD,0xCB,oo,0x1E]; } // RR (IX+o)
  / "RR"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                       		{ return [0xFD,0xCB,oo,0x1E]; } // RR (IY+o)
  / "RR"i Blank r:TableR                                                            		{ return [0xCB,0x18+r]; } // RR r
  / "RRA"i                                                                          		{ return [0x1F]; } // RRA
  / "RRC"i Blank "(HL)"i                                                            		{ return [0xCB,0x0E]; } // RRC (HL)
  / "RRC"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xCB,oo,0x0E]; } // RRC (IX+o)
  / "RRC"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xCB,oo,0x0E]; } // RRC (IY+o)
  / "RRC"i Blank r:TableR                                                           		{ return [0xCB,0x08+r]; } // RRC r
  / "RRCA"i                                                                         		{ return [0x0F]; } // RRCA
  / "RRD"i                                                                          		{ return [0xED,0x67]; } // RRD
  / "RST"i Blank "0"i                                                               		{ return [0xC7]; } // RST 0
  / "RST"i Blank "8H"i                                                              		{ return [0xCF]; } // RST 8H
  / "RST"i Blank "10H"i                                                             		{ return [0xD7]; } // RST 10H
  / "RST"i Blank "18H"i                                                             		{ return [0xDF]; } // RST 18H
  / "RST"i Blank "20H"i                                                             		{ return [0xE7]; } // RST 20H
  / "RST"i Blank "28H"i                                                             		{ return [0xEF]; } // RST 28H
  / "RST"i Blank "30H"i                                                             		{ return [0xF7]; } // RST 30H
  / "RST"i Blank "38H"i                                                             		{ return [0xFF]; } // RST 38H
  / "SBC"i Blank "A"i Comma "(HL)"i                                                 		{ return [0x9E]; } // SBC A,(HL)
  / "SBC"i Blank "A"i Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"           		{ return [0xDD,0x9E,oo]; } // SBC A,(IX+o)
  / "SBC"i Blank "A"i Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"           		{ return [0xFD,0x9E,oo]; } // SBC A,(IY+o)
  / "SBC"i Blank "A"i Comma nn:Int8                                                 		{ return [0xDE,nn]; } // SBC A,n
  / "SBC"i Blank "A"i Comma r:TableR                                                		{ return [0x98+r]; } // SBC A,r
  / "SBC"i Blank "A"i Comma p:TableIXp                                              		{ return [0xDD,0x98+p]; } // SBC A,IXp
  / "SBC"i Blank "A"i Comma q:TableIYq                                              		{ return [0xFD,0x98+q]; } // SBC A,IYq
  / "SBC"i Blank "HL"i Comma "BC"i                                                  		{ return [0xED,0x42]; } // SBC HL,BC
  / "SBC"i Blank "HL"i Comma "DE"i                                                  		{ return [0xED,0x52]; } // SBC HL,DE
  / "SBC"i Blank "HL"i Comma "HL"i                                                  		{ return [0xED,0x62]; } // SBC HL,HL
  / "SBC"i Blank "HL"i Comma "SP"i                                                  		{ return [0xED,0x72]; } // SBC HL,SP
  / "SCF"i                                                                          		{ return [0x37]; } // SCF
  / "SET"i Blank b:Int3 Comma "(HL)"i                                               		{ return [0xCB,0xC6+0x8*b]; } // SET b,(HL)
  / "SET"i Blank b:Int3 Comma "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"         		{ return [0xDD,0xCB,oo,0xC6+0x8*b]; } // SET b,(IX+o)
  / "SET"i Blank b:Int3 Comma "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"         		{ return [0xFD,0xCB,oo,0xC6+0x8*b]; } // SET b,(IY+o)
  / "SET"i Blank b:Int3 Comma r:TableR                                              		{ return [0xCB,0xC0+0x8*b+r]; } // SET b,r
  / "SLA"i Blank "(HL)"i                                                            		{ return [0xCB,0x26]; } // SLA (HL)
  / "SLA"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xCB,oo,0x26]; } // SLA (IX+o)
  / "SLA"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xCB,oo,0x26]; } // SLA (IY+o)
  / "SLA"i Blank r:TableR                                                           		{ return [0xCB,0x20+r]; } // SLA r
  / "SRA"i Blank "(HL)"i                                                            		{ return [0xCB,0x2E]; } // SRA (HL)
  / "SRA"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xCB,oo,0x2E]; } // SRA (IX+o)
  / "SRA"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xCB,oo,0x2E]; } // SRA (IY+o)
  / "SRA"i Blank r:TableR                                                           		{ return [0xCB,0x28+r]; } // SRA r
  / "SRL"i Blank "(HL)"i                                                            		{ return [0xCB,0x3E]; } // SRL (HL)
  / "SRL"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xCB,oo,0x3E]; } // SRL (IX+o)
  / "SRL"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xCB,oo,0x3E]; } // SRL (IY+o)
  / "SRL"i Blank r:TableR                                                           		{ return [0xCB,0x38+r]; } // SRL r
  / "SUB"i Blank "(HL)"i                                                            		{ return [0x96]; } // SUB (HL)
  / "SUB"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0x96,oo]; } // SUB (IX+o)
  / "SUB"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0x96,oo]; } // SUB (IY+o)
  / "SUB"i Blank nn:Int8                                                            		{ return [0xD6,nn]; } // SUB n
  / "SUB"i Blank r:TableR                                                           		{ return [0x90+r]; } // SUB r
  / "SUB"i Blank p:TableIXp                                                         		{ return [0xDD,0x90+p]; } // SUB IXp
  / "SUB"i Blank q:TableIYq                                                         		{ return [0xFD,0x90+q]; } // SUB IYq
  / "XOR"i Blank "(HL)"i                                                            		{ return [0xAE]; } // XOR (HL)
  / "XOR"i Blank "(" Blank? "IX"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xDD,0xAE,oo]; } // XOR (IX+o)
  / "XOR"i Blank "(" Blank? "IY"i Blank? oo:Offset8 Blank? ")"                      		{ return [0xFD,0xAE,oo]; } // XOR (IY+o)
  / "XOR"i Blank nn:Int8                                                            		{ return [0xEE,nn]; } // XOR n
  / "XOR"i Blank r:TableR                                                           		{ return [0xA8+r]; } // XOR r
  / "XOR"i Blank p:TableIXp                                                         		{ return [0xDD,0xA8+p]; } // XOR IXp
  / "XOR"i Blank q:TableIYq                                                         		{ return [0xFD,0xA8+q]; } // XOR IYq