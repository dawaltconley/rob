var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var pump = require("pump");
var child = require("child_process");
var runSequence = require("run-sequence");

function jekyllBuild(env = "development") {
    env = "JEKYLL_ENV=" + env + " ";
    child.execSync(env + "jekyll build", { stdio: "inherit" });
}

gulp.task("build", jekyllBuild("netlify"));

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

gulp.task("default", ["js", "clean-js"]);
