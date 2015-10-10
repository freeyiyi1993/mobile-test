module.exports = function(grunt) {

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: ['public/libs/**/*.js']
            }
            // all: ['public/js/*.js']
        }

    })

    grunt.loadNpmTasks('grunt-contrib-jshint')

    grunt.option('force', true)
}
