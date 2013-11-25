        module debug

ifdef DEBUG

        ;; --- print text ---
        ;; in hl = text ptr
        ;; in b = text len
_print_text:
        push af
        ld a,0x23
        out (0x2e),a
        ld c,0x2f
        otir
        pop af
        ret

        ;; --- print new line ---
_print_new_line:
        push hl
        push bc
        ld hl,crlf
        ld b,2
        call _print_text
        pop bc
        pop hl
        ret
crlf:   db 13,10

        ;; --- print byte ---
        ;; in a = byte
_print_byte:
        push bc
        ld b,a
        ld a,0x20
        ld (0x2e),a
        ld a,b
        ld (0x2f),a
        pop bc
        ret

macro dbg_echo msg
        push bc
        push hl
        ld b,.exit-.data
        ld hl,.data
        call debug._print_text
        jr .exit
.data:  db text, 32
.exit:  pop hl
        pop bc
endmacro

macro dbg_byte byte
        push af
        ld a,byte
        call debug._print_byte
        pop af
endmacro

else

macro dbg_echo text
endmacro

macro dbg_byte b
endmacro

endif

        endmodule
