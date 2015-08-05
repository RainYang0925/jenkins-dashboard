var io = require('socket.io').listen(4001),
	fs = require('fs'),
	clientsLength = 0;
	clients = {},
	jenkins = require('./jenkins-helper'),
	godAuth = require('prezi-godauth');

var credentials;
fs.readFile('auth.txt', 'utf8', function (err, data) {
	if (err) {

		fs.readFile('/etc/prezi/jenkinsdashboard/auth.txt', 'utf8', function (_err, _data) {
			if (_err) {
				console.log('## ERROR: auth.txt not found!\nPlease provide credentials using user:pass format.');
				process.exit(1);
				throw err;
			}

			jenkins.setCredentials(_data.trim());
			console.log('###### Jenkins dashboard server up and running.');
			return;
		});

	} else {
		jenkins.setCredentials(data.trim());
		console.log('###### Jenkins dashboard server up and running.');
	}
});


var authenticator,
	noop = function() {}, fakeResponse = { writeHead: noop, end: noop };

fs.readFile('/etc/prezi/jenkinsdashboard/cookie_secret.txt', 'utf8', function(err, data) {
	if (err) {
		console.log('## ERROR: cookie_secret.txt not found!\n## Please provide the cookie secret for prezi godauth.')
		console.log('## Note: if you\'re only running it on localhost for yourself only, you dont need it.')
	} else {
		authenticator = godAuth.create(data.trim());
	}
});

jenkins.setDebug(true);

io.sockets.on('connection', function(socket) {

	if (socket.conn.remoteAddress !== "127.0.0.1" && authenticator.authenticateRequest(socket.handshake, fakeResponse) === null) {
		console.log('### Closing unauthorized socket connection from ' + socket.conn.remoteAddress);
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
		jenkins.log('### error from jenkins: ['+ error +']');
	}

	socket.on('j update-view', function(view) {
		jenkins.updateView(socket.id, view).then(function(res) {
			socket.emit('j update-view', res, view);
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