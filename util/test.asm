        org 8000h

main:   call 0x006c
        ld a,65
        ld b,3
loop:   call 0x008d
        djnz loop
        di
        halt
