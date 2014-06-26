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

function start(request , response){
	var dataReceived;
	var jobsResults = [];
	var culprits = [];
	var jobs = [];
	var flowsList = [];
	var allFlowsResults = [];
	var allLastJobsNumbers = [];
	var isFlowFinished = false;
	var isJobFinished = false;

	lineReader.eachLine('jenkins-projects', function(jobName) {
		jobs.push(jobName);
	}).then(function() {
		for (i in jobs) {
			getLastFinishedBuildNumber(jobs[i] , fetchBuildInJSON ,  getJobStatus);
		}
	});
	lineReader.eachLine('jenkins-flows', function(flowName) {
		flowsList.push(flowName);
	}).then(function() {
		for (i in flowsList) {
			getLastFinishedBuildNumber(flowsList[i] , fetchConsoleOutputForJob ,   getAllBuildsStatuses);
		}
	});
	var getAllBuildsStatuses = function(flowName , consoleResult) {
		var patterns = [ 
			/\s*Schedule job (.+)/ , 
			/\s*Build (.+) #([0-9]+) started/ ,
			/\s*(.+) #([0-9]+) completed/ ,
			/\s*(.+) #([0-9]+) completed\s*: FAILURE/
		];
		var jobsStatuses = [
			'Scheduling',
			'Building',
			'Completed' ,
			'Failed'
		];
		var resultLines = consoleResult.split('\n');
		var flowResult = [];
	
		for (rl in resultLines) {
		    for (pi in patterns) {    
		        var matches = patterns[pi].exec(resultLines[rl]);
		        if (matches == null || matches.length < 1) {
		        	continue;
		        }
		   		var jobName = matches[1];
		   		flowResult[jobName] = jobsStatuses[pi];
		    }
		}
		var flowResultArray = [];
		for (var jobName in flowResult) {
			flowResultArray.push({
		   		jobName: jobName,
		   		jobStatus: flowResult[jobName]
		   	});
		}
		allFlowsResults.push({
			flowName: flowName,
			jobsResults: flowResultArray
		}); 

		if (allFlowsResults.length == flowsList.length) {
			isFlowFinished = true;
			allFlowsResults.sort(function(a , b) {
				return a.flowName.localeCompare(b.flowName);
			});
			if (isJobFinished)
				response.render('index.html' , {allFlowsResults : allFlowsResults , jobsWithStatuses: jobsResults, failuresWithCulprits: culprits} );
		}
	}

	var getJobStatus = function(_jobName , _buildNumber ,  _res) {
		dataReceived = _res;		
		var buildResultStatus = getValueFromJSON(dataReceived , 'result');
		var flagIsBuilding = getValueFromJSON(dataReceived , 'building');
		jobsResults.push( new JenkinsJobItem(_jobName , buildResultStatus , 'https://jenkins.prezi.com/job/' + _jobName + '/' + _buildNumber +'/'
			 , flagIsBuilding ) );

		var culpritsForCurrentJob = findCulpritsIfFailure(buildResultStatus, dataReceived);
		if (culpritsForCurrentJob != null && culpritsForCurrentJob.length > 0) {

			culpritsForCurrentJob = culpritsForCurrentJob.filter(function (value, index, self) { 
    				return self.indexOf(value) === index;
			});
				
			culprits.push([_jobName, culpritsForCurrentJob]);
		}
		if (jobsResults.length == jobs.length) {

			jobsResults.sort(function(a , b){
				return a.jobName.localeCompare(b.jobName);
			});
			isJobFinished = true;
			if (isFlowFinished)
				response.render('index.html' , {allFlowsResults : allFlowsResults , jobsWithStatuses: jobsResults, failuresWithCulprits: culprits} );
		}
	}
}


function JenkinsJobItem (jobName , buildResultStatus , linkOnJenkins , flagIsBuilding) {
	this.jobName = jobName;
	this.buildResultStatus = buildResultStatus;
	this.linkOnJenkins = linkOnJenkins;
	this.flagIsBuilding = flagIsBuilding;
}

function getValueFromJSON(data , key) {
	try {
		var jsonData = JSON.parse(data);
	} catch (e) {
		return undefined;
	}
	if(jsonData.hasOwnProperty(key))
		return jsonData[key] ; 
	return undefined;
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
	var results = "";
	for (var i =0; i<_a.length; i++) {
		results += JSON.stringify(_a[i]) + "\n";
	}
	return results;
}

function getLastFinishedBuildNumber(jobName , fetchResultCallBack , buildResultCallBack) {
	var results = "";
	var lastBuildNumber = '';
	var options = {
		host: 'jenkins.prezi.com',
		path: ('/job/'+ jobName  + '/lastBuild/api/json').replace(/\s/g,"%20"),
		headers: {'Authorization': 'Basic ' + auth_key} 
	};

	https.get(options, function(res){
		res.on("data", function(body) {
			results += body.toString();
		});

		res.on("end", function() {
			var buildNumber = getValueFromJSON(results , 'number');
			var flagIsBuilding = getValueFromJSON(results , 'building');
			if (buildNumber === undefined )
				lastBuildNumber =  undefined;
			else if (flagIsBuilding === true) 
				lastBuildNumber = (parseInt(buildNumber)-1).toString();
			else
				lastBuildNumber = parseInt(buildNumber).toString();
			fetchResultCallBack(jobName , lastBuildNumber , buildResultCallBack);
		});

	}).on("error", function(e) {
		console.log("error :" + e.message);
	});
}

function fetchConsoleOutputForJob(flowName, buildNumber ,  _callback) {
	var results = "";
	var options = {
		host: 'jenkins.prezi.com',
		path: ('/job/' + flowName + '/' + buildNumber + '/logText/progressiveText').replace(/\s/g,"%20"),
		headers: {'Authorization': 'Basic ' + auth_key} 
	};

	https.get(options, function(res){

		res.on("data", function(body) {
			results += body.toString();
		});

		res.on("end", function() {
			_callback(flowName, results);
		});

	}).on("error", function(e) {
		console.log("error :" + e.message);
	});

}

function fetchBuildInJSON(jobName, buildNumber , _callback) {
	var results = "";
	var options = {
		host: 'jenkins.prezi.com',
		path: ('/job/'+ jobName + '/' + buildNumber + '/api/json?pretty=1').replace(/\s/g,"%20"),
		headers: {'Authorization': 'Basic ' + auth_key} 
	};
	https.get(options, function(res){

		res.on("data", function(body) {
			results += body.toString();
		});

		res.on("end", function() {
			_callback(jobName, buildNumber , results);
		});

	}).on("error", function(e) {
		console.log("error :" + e.message);
	});
}


server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
