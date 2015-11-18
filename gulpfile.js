/*=====================================
=            Gulp Packages            =
=====================================*/
var gulp    = require('gulp'),
concat      = require('gulp-concat'),
uglify      = require('gulp-uglify'),
svgmin      = require('gulp-svgmin'),
imagemin    = require('gulp-imagemin'),
livereload  = require('gulp-livereload'),
notify      = require("gulp-notify"),
util        = require('gulp-util'),
watch       = require('gulp-watch'),
streamqueue = require('streamqueue'),
plumber     = require('gulp-plumber'),
shell       = require('gulp-shell'),
webserver   = require('gulp-webserver'),
jshint      = require('gulp-jshint'),
gzip        = require('gulp-gzip'),
cssnext     = require('gulp-cssnext'),
htmlmin     = require('gulp-htmlmin'),
opn         = require('opn');

/*=====================================
=            Default Paths            =
=====================================*/
var devBase   = './assets';
var appBase = './app';

/*=========================================
=            Destination Paths            =
=========================================*/
var stylePathSrc     = devBase + '/css/base.css';
var stylePathWatch   = devBase + '/css/**/*';
var stylePathDest    = appBase + '/css/';

var scriptsPathSrc   = [devBase + '/js/_lib/**/*.js', devBase + '/js/_src/**/*.js', devBase + '/js/app.js'];
var scriptsPathWatch = devBase + '/js/**/*.js';
var scriptsPathDest  = appBase + '/js/';

var svgPathWatch     = devBase + '/svg/*.svg';
var svgDest          = appBase + '/svg';

var imgPathWatch     = devBase + '/img/*';
var imgDest          = appBase + '/img';

var phpPath          = appBase + '/**/*.php';
var htmlPath         = appBase + '/**/*.html';
var htmlViewsPath    = appBase + '/views/*.html';

/*===============================
=            Options            =
===============================*/
// Server
var server = {
  host: 'localhost',
  port: '8001'
}

// GZIP
var gzip_options = {
  threshold: '1kb',
  gzipOptions: {
    level: 9
  }
};

/*=============================
=            Tasks            =
=============================*/
// Copy bower files into our assets
gulp.task('copy', function() {
  gulp.src([
    'node_modules/angular/angular.js'
  ])
  .pipe(gulp.dest(devBase + '/js/_lib/'));
});

// Compile, prefix, minify and move our SCSS files
gulp.task("stylesheets", function() {
  gulp.src(stylePathSrc)
    .pipe(plumber())
    .pipe(cssnext({
        compress: true
    }))
    .pipe(gulp.dest(stylePathDest))
    .pipe(gzip(gzip_options))
    .pipe(gulp.dest(stylePathDest))
    .pipe(livereload())
    .pipe(notify({ message: 'Styles task complete' }));
});

// Compile (in order), concatenate, minify, rename and move our JS files
gulp.task('scripts', function() {
  return streamqueue({ objectMode: true },
    gulp.src(devBase + '/js/_lib/**/*.js'),
    gulp.src(devBase + '/js/_src/**/*.js'),
    gulp.src(devBase + '/js/app.js')
  )
  .pipe(plumber())
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(concat('app.js', {newLine: ';'}))
  .pipe(uglify())
  .pipe(gulp.dest(scriptsPathDest))
  .pipe(livereload())
  .pipe(notify({ message: 'Scripts task complete' }));
});

// Minify HTML
gulp.task('minify', function() {
  return gulp.src(htmlViewsPath)
    .pipe(plumber())
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest(appBase))
    .pipe(livereload())
    .pipe(notify({ message: 'HTML views minified' }));
});

// Launch Server
gulp.task('webserver', function() {
  gulp.src(appBase)
    .pipe(webserver({
      host:             server.host,
      port:             server.port,
      livereload:       true,
      directoryListing: false
  }));
});

// Open Browser Tab
gulp.task('openbrowser', function() {
    opn( 'http://' + server.host + ':' + server.port );
});

/*========================================
=            Standalone Tasks            =
========================================*/
// Optimize images
gulp.task('img-opt', function () {
  return gulp.src(imgPathWatch)
  .pipe(imagemin({
    progressive: true
    }))
  .pipe(gulp.dest(imgDest))
  .pipe(notify({ message: 'Images task complete' }));
});

// Optimize our SVGS
gulp.task('svg-opt', function () {
  return gulp.src(svgPathWatch)
  .pipe(svgmin({
    plugins: [
    {removeEmptyAttrs: false},
    {removeEmptyNS: false},
    {cleanupIDs: false},
    {unknownAttrs: false},
    {unknownContent: false},
    {defaultAttrs: false},
    {removeTitle: true},
    {removeDesc: true},
    {removeDoctype: true}
    ],
    }))
  .pipe(gulp.dest(svgDest))
  .pipe(notify({ message: 'SVG task complete' }));
});

/*===================================
=            Watch Tasks            =
===================================*/
gulp.task('watch', function() {
  livereload.listen();

  gulp.watch(htmlViewsPath, ['minify']).on('change', function(file) {
    livereload.changed(file.path);
    util.log(util.colors.red('HTML file changed:' + ' (' + file.path + ')'));
  });

  gulp.watch(stylePathWatch, ['stylesheets']);
  gulp.watch(scriptsPathWatch, ['scripts']);
  gulp.watch(svgPathWatch, ['svg-opt']);
  gulp.watch(imgPathWatch, ['img-opt']);
});

/*==========================================
=            Run the Gulp Tasks            =
==========================================*/
gulp.task('default', ['copy', 'stylesheets', 'scripts', 'minify', 'webserver', 'openbrowser', 'watch']);
gulp.task('images', ['img-opt']);
gulp.task('svg', ['svg-opt']);
