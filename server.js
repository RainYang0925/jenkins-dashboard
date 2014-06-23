var https = require('https');
var express = require('express');
var swig = require('swig');
var path = require('path')
var lineReader = require('line-reader');

var server = express();

server.engine('html', swig.renderFile);
server.set('view engine', 'html');
server.set('views', __dirname + '/templates');
server.use(express.static(path.join(__dirname, 'static')));

server.get("/", start);

var auth_key = process.env.AUTH_KEY;


function JenkinsJobItem (jobName , buildResultStatus , linkOnJenkins , flagIsBuilding){
		this.jobName = jobName;
		this.buildResultStatus = buildResultStatus;
		this.linkOnJenkins = linkOnJenkins;
		this.flagIsBuilding = flagIsBuilding;
}
function start(request , response){
	var dataReceived;
	var jobsResults = [];
	var culprits = [];
	var jobs = [];
	lineReader.eachLine('jenkins-projects', function(jobName) {
		var lastBuildData = fetchOperationInJSON(jobName , "lastBuild" ,  callback);
		jobs.push(jobName);
	});

	var callback = function(_jobName, _res) {
			dataReceived = _res;
			
			var buildResultStatus = getValueFromJSON(dataReceived , 'result');
			var flagIsBuilding = getValueFromJSON(dataReceived , 'building');


			jobsResults.push( new JenkinsJobItem(_jobName , buildResultStatus , 'https://jenkins.prezi.com/job/' + _jobName + '/lastBuild/'
			 , flagIsBuilding ) );
			
			var culpritsForCurrentJob = findCulpritsIfFailure(buildResultStatus, dataReceived);

			if (culpritsForCurrentJob != null && culpritsForCurrentJob.length > 0) {

				culpritsForCurrentJob = culpritsForCurrentJob.filter(function (value, index, self) { 
    				return self.indexOf(value) === index;
				});
				
				culprits.push([_jobName, culpritsForCurrentJob]);
			}

			if (jobsResults.length == jobs.length) {
				response.render('index.html', {jobsWithStatuses: jobsResults, failuresWithCulprits: culprits});
			}
	}
}

function getValueFromJSON(data , key) {
		try {
			var jsonData = JSON.parse(data);
		} catch (e) {
			return 'NONE';
		}
		return jsonData[key] || 'NONE';
}

function findCulpritsIfFailure(resultsStatus, dataFromJenkins) {
		if (resultsStatus !== "FAILURE") {
			return null;
		} else {
			var culprits = [];
			var jsonData = JSON.parse(dataFromJenkins);
			var committers = jsonData['changeSet']['items'];
			committers.forEach(function(obj) {
				culprits.push(obj.author.fullName)
			});
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
			headers: {'Authorization': 'Basic ' + auth_key} 
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

function fetchOperationInJSON(jobName, operationName , _callback) {
	var results = "";
		var options = {
			host: 'jenkins.prezi.com',
			path: '/job/'+ jobName + '/' + operationName + '/api/json',
			headers: {'Authorization': 'Basic ' + auth_key} 
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
