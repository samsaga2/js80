module megarom

bank0:  equ 0x5000
bank1:  equ 0x7000
bank2:  equ 0x9000
bank3:  equ 0xb000

macro setpage slot
    ld a,slot
    ld (megarom.bank3),a
endmacro

        defpage 0, 0x4000, 0x2000
        defpage 1, 0x6000, 0x2000
        defpage 2, 0x8000, 0x2000
        defpage 3..63, 0xa000, 0x2000

        page 0..2
        map 0xc000

        db "AB"
        dw init
        db 0,0,0,0,0,0

init:   call bios.RSLREG
        rrca
        rrca
        and 0x03
        ld c,a
        ld b,0
        ld hl,bios.EXPTBL
        add hl,bc
        or (hl)
        ld b,a
        inc hl
        inc hl
        inc hl
        inc hl
        ld a,(hl)
        and 0x0c
        or b
        ld h,0x80
        call bios.ENASLT

        ;; default slots
        xor a
        ld (megarom.bank0),a
        inc a
        ld (megarom.bank1),a
        inc a
        ld (megarom.bank2),a
        inc a
        ld (megarom.bank3),a
        jp start

endmodule
