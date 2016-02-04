var gulp = require('gulp'),
    browserSync = require('browser-sync');

gulp.task('browser-sync', function () {
   var files = [
      'public/**/*.html',
      'public/**/*.js',
      'public/**/*.css',
      'public/css/**/*.css',
      'public/img/**/*.png',
      'public/js/**/*.js'
   ];

   browserSync.init(files, {
      server: {
         baseDir: './public'
      }
   });
});

gulp.task('default', function () {
   gulp.run('browser-sync');
});

