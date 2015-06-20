'use strict';

var connectLr         = require('connect-livereload'),
	express           = require('express'),
	expressPort       = 4000,
	expressRoot       = require('path').resolve('./.tmp'),
	buildRoot         = require('path').resolve('./build'),
	gulp              = require('gulp'),
	liveReloadPort    = 35729,
	lrServer          = require('tiny-lr')(),
	permitIndexReload = true,
	plugins           = require('gulp-load-plugins')(),
	server            = require('gulp-develop-server');


function notifyLiveReload() {
	if (permitIndexReload) {
		lrServer.changed({ body: { files: ['index.html'] } });
		permitIndexReload = false;
		setTimeout(function() { permitIndexReload = true; }, 1000);
	}
}

gulp.task('express server', function() {
	var ex = express();
	ex.use(connectLr());
	ex.use(express.static(expressRoot));
	ex.listen(expressPort);
});

gulp.task('live reload', function() {
	lrServer.listen(liveReloadPort, function(err) {
		if (err) {
			return console.log(err);
		}
	});
});

gulp.task('clean', function() {
	return gulp
		.src([expressRoot, buildRoot], { read: false })
		.pipe(plugins.rimraf({ force: true }))
		.on('error', plugins.util.log);
});

gulp.task('js app', ['templates'], function() {
	return gulp
		.src(['app/app.js', 'app/**/*.js', expressRoot + '/tmp.debug/templates.js'])
		.pipe(plugins.plumber())
		.pipe(plugins.concat('app.js'))
		// If you need to check the compiled source file (not annotated, not uglified):
		// .pipe(gulp.dest(expressRoot + '/tmp.debug/'))
		.pipe(plugins.ngAnnotate())
		.pipe(plugins.uglify())
		.pipe(gulp.dest(expressRoot + '/app'))
		.on('end', notifyLiveReload)
		.on('error', plugins.util.log);
});

gulp.task('styles', function() {
	return gulp
		.src('app/styles/app.scss')
		.pipe(plugins.plumber({
			errorHandler: function(err) {
				plugins.util.log(plugins.util.colors.red('Error while compiling the styles:\n' + err));
				this.emit('end');
			}
		}))
		.pipe(plugins.sass({
			includePaths: ['app/bower_components'],
			sourceComments: 'map'
		}))
		// .pipe(plugins.streamify(plugins.rev()))
		.pipe(gulp.dest(expressRoot + '/styles'))
		.on('end', notifyLiveReload);
});

gulp.task('templates', function() {
	return gulp
		.src('app/**/*.tmpl.html')
		.pipe(plugins.angularTemplatecache({
			module: 'JenkinsDashboard'
		}))
		.pipe(gulp.dest(expressRoot + '/tmp.debug'))
		.on('end', notifyLiveReload)
		.on('error', plugins.util.log);
});

gulp.task('copy build', function() {

	gulp
		.src(expressRoot + '/**/*')
		.pipe(gulp.dest(buildRoot));

});

gulp.task('copy libs', function() {

	gulp
		.src('./assets/bootstrap/dist/css/bootstrap.min.css')
		.pipe(gulp.dest(expressRoot + '/styles/assets'));

	gulp
		.src('./assets/bootstrap/dist/fonts/*')
		.pipe(gulp.dest(expressRoot + '/styles/fonts'));

	gulp
		.src('./app/styles/img/*')
		.pipe(gulp.dest(expressRoot + '/styles/img'));

	return gulp
		.src([
			'./assets/angular/angular.min.js', 
			'./assets/angular-route/angular-route.min.js', 
			'./assets/angular-resource/angular-resource.min.js', 
			'./assets/angular-strap/dist/angular-strap.min.js', 
			'./assets/angular-strap/dist/angular-strap.tpl.min.js', 
			'./assets/bootstrap/dist/css/bootstrap.min.css',
			'./assets/socket.io-client/socket.io.js'
		])
		.pipe(gulp.dest(expressRoot + '/assets'))
});

gulp.task('index', function() {
	var path = expressRoot;

	function inject(glob, tag) {
		return plugins.inject(
			gulp.src(glob, { cwd: path }), 
			{ addRootSlash: false, starttag: '<!-- inject:' + tag + ':{{ext}} -->' }
		);
	}

	return gulp
		.src('app/index.html')
		.pipe(inject('styles/app*.css', 'app-style'))
		.pipe(inject('app/app*.js', 'app'))
		.pipe(inject('app/templates*.js', 'templates'))
		.pipe(inject(
			[
				'assets/angular.min.js', 
				'assets/angular-resource.min.js',
				'assets/angular-route.min.js',
				'assets/angular-strap.min.js',
				'assets/angular-strap.tpl.min.js',
				'assets/socket.io.js'
			], 
			'assets'))
		.pipe(inject('styles/assets/*.css', 'assets'))
		.pipe(gulp.dest(expressRoot))
		.on('end', notifyLiveReload)
		.on('error', plugins.util.log);
});

gulp.task('server start', function() {
	return server.listen({ 
		path: 'server/server.js', 
		execArgv: ['--harmony'] 
	});
});

gulp.task('server restart', function() {
	return gulp
		.src('server/server.js')
		.pipe(server());
});

gulp.task('build', function() {
	plugins.runSequence('clean', 'copy libs', 'templates', 'js app', 'styles', 'index', 'copy build');
});

// TODO: Not quite sure the tasks get execute properly, race conditions? Use https://www.npmjs.org/package/gulp-run-sequence ?
gulp.task('default', ['express server', 'live reload', 'copy libs', 'js app', 'styles', 'index', 'server start'], function () {
	gulp.watch(['app/styles/**/*', '!app/styles/fonts/**/*'], ['styles']);
	gulp.watch('app/index.html', ['index']);
	gulp.watch(['app/**/*tmpl.html', 'app/*js', 'app/**/*js'], ['js app']);
	gulp.watch(['server/*js', 'server/**/*js'], ['server restart']);
	plugins.util.log(plugins.util.colors.red('### Dashboard ready on http://localhost:' + expressPort));
});