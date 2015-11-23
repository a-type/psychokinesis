var gulp = require('gulp');
var mocha = require('gulp-mocha');
var babel = require('babel-core/register');
var env = require('gulp-env');
var gutil = require('gulp-util');

gulp.task('test-env', function () {
	env({
		vars : {
			NODE_ENV : 'test'
		}
	})
});

gulp.task('test', [ 'test-env' ], function () {
	return gulp.src([ 'test/**/*_spec.js' ])
	.pipe(mocha({
		compilers : {
			js : babel
		},

		timeout : 4000
	}));
});

gulp.task('default', [ 'test' ]);