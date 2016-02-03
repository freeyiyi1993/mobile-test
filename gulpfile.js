var gulp = require('gulp'),
    browserSync = require('browser-sync');

gulp.task('browser-sync', function () {
   var files = [
      'public/**/*.html',
      'public/css/**/*.css',
      'public/imgs/**/*.png',
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

