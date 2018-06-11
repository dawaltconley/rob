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

let jekyllEnv = "gulp";

if (process.env.CONTEXT == "production") {
    jekyllEnv = "production";
}

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " jekyll build";
    return child.exec(cmd, { stdio: "inherit" });
}

gulp.task("build", jekyllBuild.bind(null, jekyllEnv));

gulp.task("css", function (cb) {
    pump([
        gulp.src("./_site/css/main.css"),
        postcss([
            autoprefixer()
        ]),
        gulp.dest("./_site/css")
    ], cb);
});

gulp.task("js-concat", function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills/*.js",
            "./_site/js/lib/*.js",
            "./_site/js/main.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ]),
        concat("all.js"),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("js-clean", function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills",
            "./_site/js/lib",
            "./_site/js/main.js"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("js-uglify", function (cb) {
    pump([
        gulp.src([
            "./_site/js/**/*.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ]),
        uglify(),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("js", gulp.series("js-concat", "js-clean", "js-uglify"));

gulp.task("image-min", function (cb) {
    pump([
        gulp.src([
            "./_site/media/**/*",
            "!./_site/media/test/*"
        ]),
        imageMin(),
        gulp.dest("./_site/media")
    ], cb);
});

gulp.task("project-images", function () {
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

gulp.task("clean-project-images", function () {
    return gulp.src([
            "./_site/media/project-images/*",
            "!./_site/media/project-images/*-thumb*",
            "!./_site/media/project-images/*-display*",
            "!./_site/media/project-images/*-og*"
        ], { read: false })
    .pipe(clean())
});

gulp.task("bg-images", function () {
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

gulp.task("images", gulp.series(
    "image-min",
    gulp.parallel(
        "bg-images",
        gulp.series(
            "project-images",
            "clean-project-images"))
));

gulp.task("default", gulp.series(
    "build",
    gulp.parallel("css", "js", "images")
));
