module math

macro a_mul_2
        sla a
endmacro

macro a_mul_4
        a_mul_2
        a_mul_2
endmacro

macro a_mul_8
        a_mul_2
        a_mul_2
        a_mul_2
endmacro

macro de_div_2
        sra d
        rr e
endmacro

macro de_div_4
        de_div_2
        de_div_2
endmacro

macro de_div_8
        de_div_2
        de_div_2
        de_div_2
endmacro

macro hl_div_2
        sra h
        rr l
endmacro

macro hl_div_4
        hl_div_2
        hl_div_2
endmacro

macro hl_div_8
        hl_div_2
        hl_div_2
        hl_div_2
endmacro

macro bc_div_2
        sra b
        rr c
endmacro

macro bc_div_4
        bc_div_2
        bc_div_2
endmacro

macro bc_div_8
        bc_div_2
        bc_div_2
        bc_div_2
endmacro

macro hl_mul_2
        add hl,hl
endmacro

macro hl_mul_4
        hl_mul_2
        hl_mul_2
endmacro

macro hl_mul_8
        hl_mul_2
        hl_mul_2
        hl_mul_2
endmacro

macro hl_mul_16
        hl_mul_2
        hl_mul_2
        hl_mul_2
        hl_mul_2
endmacro

macro hl_mul_32
        hl_mul_2
        hl_mul_2
        hl_mul_2
        hl_mul_2
        hl_mul_2
endmacro

macro de_mul_2
        ex de,hl
        add hl,hl
        ex de,hl
endmacro

macro de_mul_4
        ex de,hl
        hl_mul_4
        ex de,hl
endmacro

macro de_mul_8
        ex de,hl
        hl_mul_8
        ex de,hl
endmacro

macro de_mul_16
        ex de,hl
        hl_mul_16
        ex de,hl
endmacro

macro de_mul_32
        ex de,hl
        hl_mul_32
        ex de,hl
endmacro

        ;; --- div 8 ---
        ;; b=a/c a=a mod c
div8:   ld b,0
.l1:    sub a,c
        jr c,l2
        inc b
        jr .l1
.l2:    add a,c
        ret

        ;; --- mul16 ---
        ;; DEHL=BC*DE
mul16:  ld hl,0
        ld a,16
.l1:    add hl,hl
        rl e
        rl d
        jp nc,.l2
        add hl,bc
        jp nc,.l2
        inc de
.l2:    dec a
        jp nz,.l1
        ret

        ;; --- div16 ---
        ;; bc=bc/de
        ;; out hl=rest
div16:  ld hl,0
        ld a,b
        ld b,8
.loop1: rla
        adc hl,hl
        sbc hl,de
        jr nc,.noadd1
        add hl,de
.noadd1:
        djnz .loop1
        ld b,a
        ld a,c
        ld c,b
        ld b,8
.loop2: rla
        adc hl,hl
        sbc hl,de
        jr nc,.noadd2
        add hl,de
.noadd2:
        djnz .loop2
        rla
        cpl
        ld b,a
        ld a,c
        ld c,b
        rla
        cpl
        ld b,a
        ret

endmodule
