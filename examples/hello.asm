        include "debug.asm"
	include "rom16k.asm"
        include "bios.asm"
        include "extensions.asm"

        ;; rom entry
start:  call bios.INITXT
        dbg_echo "hola"
        ld hl,text
        call print
.1:     jr .1

        ;; print text
print:  push af, hl
.1:     ld a,(hl)
        or a
        jr z,.2
        call bios.CHPUT
        inc hl
        jr .1
.2:     pop af, hl
        ret

text:   db "Hello world!", 0
