module rom16k

        defpage 0, 0x8000, 0x4000
        page 0
        map 0xc000

        db "AB"
        dw start
        db 0,0,0,0,0,0

endmodule
