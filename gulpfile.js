var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var clean = require("gulp-clean");
var imageResize = require("gulp-image-resize");
var imageMin = require("gulp-imagemin");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var pump = require("pump");
var merge = require("merge-stream");
var child = require("child_process");
var YAML = require("js-yaml");
var fs = require("fs");

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
            "!./_site/js/all.js",
            "!./_site/js/picturefill.min.js"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("image-min", ["build"], function (cb) {
    pump([
        gulp.src([
            "./_site/media/**/*",
            "!./_site/media/test/*"
        ]),
        imageMin(),
        gulp.dest("./_site/media")
    ], cb);
});

gulp.task("project-images", ["image-min"], function () {
    var src = "./_site/media/project-images/*";
    var dest = "./_site/media/project-images";
    var thumbnails = gulp.src(src)
        .pipe(
            imageResize({
                width: 268,
                height: 268,
                crop: true,
                upscale: false,
                filter: "Catrom"
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
                upscale: false,
                filter: "Catrom"
            })
        )
        .pipe(rename({ suffix: "-display" }))
        .pipe(gulp.dest(dest));
    var og = gulp.src(src)
        .pipe(
            imageResize({
                width: 1200,
                height: 1200,
                crop: true,
                upscale: true
            })
        )
        .pipe(rename({ suffix: "-og" }))
        .pipe(gulp.dest(dest));
    return merge(thumbnails, displays, og);
});

gulp.task("clean-project-images", ["project-images"], function (cb) {
    pump([
        gulp.src([
            "./_site/media/project-images/*",
            "!./_site/media/project-images/*-thumb*",
            "!./_site/media/project-images/*-display*",
            "!./_site/media/project-images/*-og*"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("bg-images", ["image-min"], function () {
    var imageBreakpoints = YAML.safeLoad(fs.readFileSync("_config.yml", "utf8"))["image_bp"];
    var src = "./_site/media/backgrounds/*";
    var dest = "./_site/media/backgrounds";
    var merged = merge();
    imageBreakpoints.forEach(function (bp) {
        var stream = gulp.src(src)
            .pipe(
                imageResize({
                    width: bp.x,
                    height: bp.y,
                    cover: true,
                    upscale: false,
                    filter: "Catrom",
                    interlace: true
                })
            )
            .pipe(rename({ suffix: "-" + bp.x + "x" + bp.y }))
            .pipe(gulp.dest(dest));
        merged.add(stream);
    });
    return merged.isEmpty() ? null : merged;
});

gulp.task("default", ["build", "css", "js", "clean-js", "bg-images", "project-images", "clean-project-images"]);
