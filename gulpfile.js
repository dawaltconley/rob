var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var clean = require("gulp-clean");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var pump = require("pump");
var child = require("child_process");
var runSequence = require("run-sequence");

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " jekyll build";
    child.execSync.bind(child, cmd, { stdio: "inherit" });
}

gulp.task("build", jekyllBuild("netlify"));

gulp.task("css", ["build"], function (cb) {
    pump([
        gulp.src("./_site/css/main.css"),
        postcss([
            autoprefixer()
        ]),
        gulp.dest("./_site/css")
    ], cb);
});

gulp.task("js", ["build"], function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills/rAF.js", // needed for another polyfill
            "./_site/js/polyfills/*.js",
            "./_site/js/lib/*.js",
            "./_site/js/main.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ]),
        concat("all.js"),
        uglify(),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("clean-js", ["js"], function (cb) {
    pump([
        gulp.src([
            "./_site/js/*",
            "!./_site/js/all.js"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("default", ["css", "js", "clean-js"]);
