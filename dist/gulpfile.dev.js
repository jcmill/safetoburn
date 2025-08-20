"use strict";

var gulp = require("gulp");

var pug = require("gulp-pug");

var sass = require("gulp-dart-sass");

var imagemin = require("gulp-imagemin");

var uglify = require("gulp-uglify");

var babel = require("gulp-babel");

var browsersync = require("browser-sync").create();

var autoprefixer = require("gulp-autoprefixer");

var cache = require("gulp-cache");

var del = require("del");

var plumber = require("gulp-plumber");
/* Options
 * ------ */


var options = {
  pug: {
    src: ["app/views/*.pug", "app/views/!blocks/**"],
    all: "app/views/**/*.pug",
    dest: "public"
  },
  scripts: {
    src: "app/scripts/**/*.js",
    dest: "public/scripts"
  },
  styles: {
    src: "app/styles/**/*.scss",
    dest: "public/styles"
  },
  images: {
    src: "app/images/**/*.{png,jpeg,jpg,gif,svg,mp4}",
    dest: "public/images"
  },
  fonts: {
    src: "app/fonts/*",
    dest: "public/fonts"
  },
  browserSync: {
    baseDir: "public"
  }
};
/* Browser-sync
 * ------------ */

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: options.browserSync.baseDir
    },
    port: 3000
  });
  done();
}
/* Styles
 * ------ */


function styles() {
  return gulp.src(options.styles.src).pipe(plumber(function (err) {
    console.log("Styles Task Error");
    console.log(err);
    this.emit("end");
  })).pipe(sass().on("error", sass.logError)).pipe(autoprefixer({
    browsers: ["last 2 versions"],
    cascade: false,
    grid: false
  })).pipe(gulp.dest(options.styles.dest)).pipe(browsersync.reload({
    stream: true
  }));
}
/* Scripts
 * ------ */


function scripts() {
  return gulp.src(options.scripts.src).pipe(plumber(function (err) {
    console.log("Scripts Task Error");
    console.log(err);
    this.emit("end");
  })).pipe(babel({
    presets: ["@babel/preset-env"]
  })).pipe(uglify()).pipe(gulp.dest(options.scripts.dest)).pipe(browsersync.reload({
    stream: true
  }));
}
/* Views
 * ------ */


function views() {
  return gulp.src(options.pug.src).pipe(plumber(function (err) {
    console.log("Pug Task Error");
    console.log(err);
    this.emit("end");
  })).pipe(pug({
    pretty: true
  })).pipe(gulp.dest(options.pug.dest)).pipe(browsersync.reload({
    stream: true
  }));
}
/* Images
 * ------ */


function images() {
  return gulp.src(options.images.src).pipe(cache(imagemin({
    interlaced: true
  }))).pipe(gulp.dest(options.images.dest));
}
/* Fonts
 * ------ */


function fonts() {
  return gulp.src(options.fonts.src).pipe(gulp.dest(options.fonts.dest));
}
/* Clean up
 * ------ */


function clean() {
  return regeneratorRuntime.async(function clean$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", Promise.resolve(del.sync("public")));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
}

function watchFiles() {
  gulp.watch(options.pug.all, views);
  gulp.watch(options.styles.src, styles);
  gulp.watch(options.scripts.src, scripts);
}
/* Build
 * ------ */


var build = gulp.series(clean, gulp.parallel(styles, views, scripts, images, fonts));
var watch = gulp.parallel(watchFiles, browserSync); // export tasks

exports.styles = styles;
exports.views = views;
exports.scripts = scripts;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports["default"] = build;