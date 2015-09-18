var io = require('socket.io').listen(4001),
	fs = require('fs'),
	clientsLength = 0;
	clients = {},
	jenkins = require('./jenkins-helper'),
	conf = require('nconf');

var DEFAULT_CONF_NAME = "jd.conf.json",
	defaults = {
		debug: true, // Verbose output,
		useFixtures: false // Dont call jenkins, use fixtures instead
	};

function error(msg) { jenkins.log('### ERROR ###', msg); }


conf.argv();

// If there's conf, it must come from argv
if (conf.get('conf')) {
	conf.file(conf.get('conf'));
} else {
	conf.file(DEFAULT_CONF_NAME);
}

conf.defaults(defaults);
jenkins.setDebug(conf.get('debug'));
jenkins.setUseFixtures(conf.get('useFixtures'));

var jenkinsURL = conf.get('jenkinsURL');
if (typeof(jenkinsURL) === 'undefined') {
	error('no jenkinsURL found in the conf file (' + conf.get('conf') + ')');
	process.exit(1);
} else {
	jenkins.setURL(jenkinsURL);
}

var jenkinsPORT = conf.get('jenkinsPORT');
if (typeof(jenkinsPORT) === 'undefined') {
	jenkins.log('no jenkinsPORT found in the conf file (' + conf.get('conf') + ') use default 443');
    jenkinsPORT = 443
}
jenkins.setPORT(jenkinsPORT);


var authenticator,
	noop = function() {}, 
	fakeResponse = { writeHead: noop, end: noop },
	wsAuth = conf.get('wsAuth'),
	godAuth;
if (typeof(wsAuth) === 'undefined') {
	jenkins.log('No websocket auth configured.')
} else {
	if (typeof(wsAuth.type) === 'undefined' || typeof(wsAuth.fileName) === 'undefined') {
		error('Trying to configure websocket auth but missing type or fileName fields in wsAuth section');
	} else if (wsAuth.type !== "preziGodAuth") {
		error('The only websocket auth scheme supported is preziGodAuth');
	} else {
		godAuth = require('prezi-godauth');
		fs.readFile(wsAuth.fileName, 'utf8', function(err, data) {
			if (err) {
				error(wsAuth.fileName + ' not found!');
				error('Please provide the cookie secret for prezi godauth.');
				error('if you\'re only running it on localhost for yourself only, you dont need it and you can delete the section from your conf.')
			} else {
				jenkins.log('Websocket auth credentials picked up from ' + wsAuth.fileName);
				authenticator = godAuth.create(data.trim());
			}
		});
	}
}


var auth = conf.get('jenkinsAuth');
if (typeof(auth) === 'undefined') {
	jenkins.log('No auth configured.')
	jenkins.log('Jenkins dashboard server up and running.');
} else {
	if (typeof(auth.type) === 'undefined' || typeof(auth.fileName) === 'undefined') {
		error('Trying to configure auth but missing type or fileName fields in auth section');
	} else if (auth.type !== "basic") {
		error('The only auth scheme supported is http basic');
	} else {
		fs.readFile(auth.fileName, 'utf8', function (_err, _data) {
			if (_err) {
				error(auth.fileName + ' not found!');
				error('Please provide credentials using user:pass format.');
				process.exit(1);
				throw err;
			}
			
			jenkins.log('Jenkins auth credentials picked up from ' + auth.fileName);
			jenkins.setCredentials(_data.trim());
			jenkins.log('------- Jenkins dashboard server up and running -------');
			return;
		});
	}
}


io.sockets.on('connection', function(socket) {

	if (typeof(wsAuth) !== "undefined" && 
		wsAuth.type === "preziGodAuth" &&
		socket.conn.remoteAddress !== "127.0.0.1" && 
		authenticator.authenticateRequest(socket.handshake, fakeResponse) === null
	) {
		error('### Closing unauthorized socket connection from ' + socket.conn.remoteAddress);
		socket.disconnect('unauthorized');
		return;
	}

	clients[socket.id] = socket.conn.remoteAddress;
	clientsLength++;
	jenkins.log('### ('+ clientsLength +') New client connected ['+ socket.id +'] from '+ socket.conn.remoteAddress);

	socket.on('disconnect', function() {
		clientsLength--;
		jenkins.log('### ('+ clientsLength +') Client disconnected: ['+ socket.id +']');
	});

	function errorFromJenkins(error) {
		socket.emit('j error', error);
		error('### error from jenkins: ['+ error +']');
	}

	socket.on('j update-view', function(view) {
		jenkins.updateView(socket.id, view).then(function(res) {
			socket.emit('j update-view', res, view);
		}, errorFromJenkins);
	});

	socket.on('j update-label', function(label) {
		jenkins.updateLabel(socket.id, label).then(function(res) {
			res.jobs = res.tiedJobs;
			socket.emit('j update-view', res, label);
		}, errorFromJenkins);
	});

	socket.on('j update-job', function(job) {
		jenkins.updateJob(socket.id, job).then(function(res) {
			socket.emit('j update-job', res);
		}, errorFromJenkins);
	});

	socket.on('j update-job-fast', function(job) {
		jenkins.updateJobFast(socket.id, job).then(function(res) {
			socket.emit('j update-job', res);
		}, errorFromJenkins);
	});

	socket.on('j update-build', function(ob) {
		jenkins.updateBuild(socket.id, ob.jobName, ob.buildNumber).then(function(res) {
			socket.emit('j update-build', ob.jobName, res);
		}, errorFromJenkins);
	});

	socket.on('j update-build-fast', function(ob) {
		jenkins.updateBuildFast(socket.id, ob.jobName, ob.buildNumber).then(function(res) {
			socket.emit('j update-build', ob.jobName, res);
		}, errorFromJenkins);
	});

	socket.on('j update-views', function() {
		jenkins.updateAllJobs(socket.id).then(function(res) {
			socket.emit('j update-views', res.views);
		}, errorFromJenkins);
	});


	socket.on('j update-all', function() {
		jenkins.updateAllJobs(socket.id).then(function(res) {
			socket.emit('j update-all', res);
		}, errorFromJenkins);
	});

});
