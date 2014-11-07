var io = require('socket.io').listen(4001),
	fs = require('fs'),
	clientsLength = 0;
	clients = {},
	jenkins = require('./jenkins-helper');

var credentials;
fs.readFile('auth.txt', 'utf8', function (err, data) {
	if (err) {
		console.log('## ERROR: auth.txt not found!\nPlease provide credentials using user:pass format.');
		process.exit(1);
		throw err;
	}
	jenkins.setCredentials(data.trim());
	console.log('###### Jenkins dashboard server up and running.');
});

jenkins.setDebug(true);

io.sockets.on('connection', function(socket) {
	clients[socket.id] = socket.conn.remoteAddress;
	clientsLength++;
	jenkins.log('### ('+ clientsLength +') New client connected ['+ socket.id +'] from '+ socket.conn.remoteAddress);

	function errorFromJenkins(error) {
		socket.emit('j error', error);
		jenkins.log('### error from jenkins: ['+ error +']');
	}

	socket.on('disconnect', function() {
		clientsLength--;
		jenkins.log('### ('+ clientsLength +') Client disconnected: ['+ socket.id +']');
	});

	socket.on('j update-view', function(view) {
		jenkins.updateView(view).then(function(res) {
			socket.emit('j update-view', res);
		}, errorFromJenkins);
	});

	socket.on('j update-job', function(job) {
		jenkins.updateJob(job).then(function(res) {
			socket.emit('j update-job', res);
		}, errorFromJenkins);
	});

	socket.on('j update-job-fast', function(job) {
		jenkins.updateJobFast(job).then(function(res) {
			socket.emit('j update-job', res);
		}, errorFromJenkins);
	});

	socket.on('j update-build', function(ob) {
		jenkins.updateBuild(ob.jobName, ob.buildNumber).then(function(res) {
			socket.emit('j update-build', ob.jobName, res);
		}, errorFromJenkins);
	});

	socket.on('j update-build-fast', function(ob) {
		jenkins.updateBuildFast(ob.jobName, ob.buildNumber).then(function(res) {
			socket.emit('j update-build', ob.jobName, res);
		}, errorFromJenkins);
	});


	socket.on('j update-all', function(view) {
		jenkins.updateAllJobs().then(function(res) {
			socket.emit('j update-all', res);
		}, errorFromJenkins);
	});

});