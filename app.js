var https = require('https');
var express = require('express');
var swig = require('swig');
var path = require('path')

var server = express();

server.engine('html', swig.renderFile);
server.set('view engine', 'html');
server.set('views', __dirname + '/templates');
server.use(express.static(path.join(__dirname, 'static')));

var jobs = ['boxfish-engine-render', 'boxfish-client-player', 'boxfish-client-loader', 
'pdom-haxe', 'boxfish-bdd-tests', 'boxfish-bdd-tests-all-browsers', 'boxfish-speed-test-office'];

server.get("/", function(req, res) {
	var dataReceived;
	var jobsResults = [];
	var culprits = [];
	
	var callback = function(_jobName, _res) {
			dataReceived = _res;
			
			var buildResultStatus = getResultStatus(dataReceived);
			jobsResults.push([_jobName, buildResultStatus]);
			console.log(_jobName);
			var culpritsForCurrentJob = findCulpritsIfFailure(buildResultStatus, dataReceived);

			if (culpritsForCurrentJob != null && culpritsForCurrentJob.length > 0) {
				culprits.push([_jobName, culpritsForCurrentJob]);
			}

			if (jobsResults.length == jobs.length) {
				 res.render('index.html', {jobsWithStatuses: jobsResults, failuresWithCulprits: culprits});
			}
		}

	for (var i=0; i<jobs.length; i++) {
			var lastBuildData = fetchResultBuildForJob(jobs[i], callback);
	}	
});


function getResultStatus(data) {
		try {
			var jsonData = JSON.parse(data);
		} catch (e) {
			return 'NONE';
		}
		return jsonData['result'] || 'NONE';
}

function findCulpritsIfFailure(resultsStatus, dataFromJenkins) {
		if (resultsStatus !== "FAILURE") {
			return null;
		} else {
			var culprits = [];
			var jsonData = JSON.parse(dataFromJenkins);
			var committers = jsonData['changeSet']['items'];
			committers.forEach(function(obj) { /* console.log(obj.author.fullName); */ culprits.push(obj.author.fullName)});
			return culprits;
		}
}

function displayResults(_a) {
	results = "";
	for (var i =0; i<_a.length; i++) {
		results += JSON.stringify(_a[i]) + "\n";
	}

	return results;
}


function fetchConsoleOutputForJob(jobName, _callback) {
	var results = "";
		var options = {
			host: 'jenkins.prezi.com',
			path: '/job/' + jobName + '/lastBuild/logText/progressiveText',
			headers: {'Authorization': 'Basic ***REMOVED***'} 
		}

		https.get(options, function(res){
			res.on("data", function(body) {
				results += body.toString();
			});

			res.on("end", function() {
				_callback(jobName, results);
			});

		}).on("error", function(e) {
			console.log("error :" + e.message);
		});
}

function fetchResultBuildForJob(jobName, _callback) {
	var results = "";
		var options = {
			host: 'jenkins.prezi.com',
			path: '/job/'+ jobName +'/lastBuild/api/json',
			headers: {'Authorization': 'Basic ***REMOVED***'} 
		}

		https.get(options, function(res){
			res.on("data", function(body) {
				results += body.toString();
			});

			res.on("end", function() {
				_callback(jobName, results);
			});

		}).on("error", function(e) {
			console.log("error :" + e.message);
		});
}


server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
