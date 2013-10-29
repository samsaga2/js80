	include "rom16k.asm"
        include "bios.asm"

        ;; rom entry
start:  call bios.INITXT
        ld hl,text
        call print
.1:     jr .1

        ;; print text
print:  push hl
.1:     ld a,(hl)
        or a
        jr z,.2
        call bios.CHPUT
        inc hl
        jr .1
.2:     pop hl
        ret

text:   db "Hello world!", 0
