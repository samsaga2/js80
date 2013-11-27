module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-peg');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        peg: {
            parser: {
                src: "parser.pegjs",
                dest: "lib/parser.js",
                options: {
                    cache: true,
                    trackLineAndColumn: true
                }
            },
            z80parser: {
                src: "z80parser.pegjs",
                dest: "lib/z80parser.js",
                options: {
                    cache: true,
                    trackLineAndColumn: true
                }
            }
        },
        mochaTest: {
            all: {
                src: ['test/*.js'],
                options: {
                    quiet: true
                }
            }
        }
    });

    grunt.registerTask('default', 'mochaTest');
};
