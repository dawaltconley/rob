var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var clean = require("gulp-clean");
var imageResize = require("gulp-image-resize");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var pump = require("pump");
var merge = require("merge-stream");
var child = require("child_process");

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " jekyll build";
    child.execSync(cmd, { stdio: "inherit" });
}

gulp.task("build", jekyllBuild.bind(null, "netlify"));

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

gulp.task("images", ["build"], function () {
    var src = "./_site/media/project-images/*";
    var dest = "./_site/media/project-images";
    var thumbnails = gulp.src(src)
        .pipe(
            imageResize({
                width: 268,
                height: 268,
                crop: true,
                upscale: false
            })
        )
        .pipe(rename({ suffix: "-thumb" }))
        .pipe(gulp.dest(dest));
    var displays = gulp.src(src)
        .pipe(
            imageResize({
                width: 675,
                height: 675,
                crop: true,
                upscale: false
            })
        )
        .pipe(rename({ suffix: "-display" }))
        .pipe(gulp.dest(dest));
    return merge(thumbnails, displays);
});

gulp.task("clean-images", ["images"], function (cb) {
    pump([
        gulp.src([
            "./_site/media/project-images/*",
            "!./_site/media/project-images/*-thumb*",
            "!./_site/media/project-images/*-display*"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("default", ["build", "css", "js", "clean-js", "images", "clean-images"]);
