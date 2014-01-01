module rom32k

        defpage 0, 0x4000, 0x4000
        defpage 1, 0x8000, 0x4000
        page 0..1
        map 0xc000

        db "AB"
        dw start
        db 0,0,0,0,0,0

endmodule
