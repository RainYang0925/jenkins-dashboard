angular.module("JenkinsDashboard")
.controller("IndexCtrl", function($rootScope, $scope, $interval, $timeout, $alert, $window, Jobs, Socket, ScreenSaver, Conf, Voice) {

	var VIEW_REFRESH_MS = 9000,
		BUILD_FAST_REFRESH_MS = 2000;

	$scope.pageTitle = "Jenkins dashboard";
	$scope.conf = Conf.val;
	$scope.somethingBroken = false;
	$scope.disconnected = true;

	$scope.Jobs = Jobs;
	$scope.$watch('conf.order', Jobs.sort);
	$scope.$watch('conf.filter', Jobs.sort);
	$scope.$watch('conf.sortBy', Jobs.sort);

	$scope.$watch('conf.viewName', function(v) {
		console.log($ts(), "Switching view to ", v);
		clearJobs();
		startPollingView();
	});

	var updateViewInterval;
	function startPollingView() {
		clearJobsTimeouts();
		$interval.cancel(updateViewInterval);
		updateViewInterval = $interval(requestUpdateView, VIEW_REFRESH_MS);
		requestUpdateView();
	}

	$scope.blur = true;
	$rootScope.$on('blur', function() {
		$scope.blur = true;
	});
	$rootScope.$on('unblur', function() {
		$scope.blur = false;
	});

	Socket.on("connect", function() {
		$scope.disconnected = false;
		startPollingView();
	});

	Socket.on("disconnect", function() {
		$scope.disconnected = true;
		console.log($ts(), '!!! Disconnected, clearing all timeouts');
		clearJobsTimeouts();
		clearJobQueue()
		$interval.cancel(updateViewInterval);
	});

	Socket.on("j error", function(error) {
		// TODO: instantiate only 1 at a time
		var myAlert = $alert({
			title: 'Ouch!', 
			content: 'Error from Jenkins, will retry..', 
			placement: 'top',
			type: 'danger',
			container: '.alert-container',
			show: true,
			duration: VIEW_REFRESH_MS / 1000 / 2
		});
	});


	function clearJobs() {
		clearJobQueue();
		clearJobsTimeouts();
		$scope.somethingBroken = false;
		Jobs.clear();
	}

	function clearJobsTimeouts() {
		if (Object.keys(updateFastTimers).length > 0) {
			for (var t in updateFastTimers) {
				$timeout.cancel(updateFastTimers[t]);
				delete updateFastTimers[t];
				// console.log($ts(),'@@@ Cleared timer ', t);
			}
		}
	}

	function clearJobQueue() {
		jobsBeingRequested = [];
		jobQueue = [];
		jobsInQueue = {};
		$scope.stats = {
			views: { r: 0, a: 0 },
			jobs: { r: 0, a: 0 },
			builds: { r: 0, a: 0 },
			jobsQueue: { r: 0, a: 0, len: 0}
		};
	}

	function requestUpdateView() {
		if ($scope.disconnected) { console.log($ts(), '!! Disconnected !!'); return; }
		Socket.emit("j update-view", Conf.val.viewName);
		$scope.stats.views.r++;
	}

	function requestUpdateJob(jobName) {
		if ($scope.disconnected) { console.log($ts(), '!! Disconnected !!'); return; }
		Socket.emit("j update-job", jobName);
		$scope.stats.jobs.r++;
	}

	function requestUpdateJobFast(jobName) {
		if ($scope.disconnected) { console.log($ts(), '!! Disconnected !!'); return; }

		Socket.emit("j update-job-fast", jobName);
		$scope.stats.jobs.r++;
		// console.log($ts(), '## Request update job fast ', jobName);
	}

	function requestUpdateBuild(jobName, buildNumber) {
		if ($scope.disconnected) { console.log($ts(),'!! Disconnected !!'); return; }
		Socket.emit("j update-build", {jobName: jobName, buildNumber: buildNumber});
		$scope.stats.builds.r++;
	}

	var buildingJobs = {},
		updateFastTimers = {};
	function requestUpdateBuildFast(jobName, buildNumber) {
		if ($scope.disconnected) { console.log($ts(),'!! Disconnected !!'); return; }

		// console.log($ts(),'## Update job fast ', jobName, buildNumber);
		Socket.emit("j update-build-fast", {jobName: jobName, buildNumber: buildNumber});

		$timeout.cancel(updateFastTimers[jobName + buildNumber]);
		updateFastTimers[jobName + buildNumber] = $timeout(function() {
			requestUpdateBuildFast(jobName, buildNumber);
		}, BUILD_FAST_REFRESH_MS);
		$scope.stats.builds.r++;
	}

	var MAX_CONCURRENT_JOBS = 25,
		jobQueue = [],
		jobsInQueue = {},
		jobsBeingRequested = [];
	function requestUpdateJobQueued(jobName) {
		if (jobName in jobsInQueue) {
			return;
		}
		jobQueue.push(jobName);
		jobsInQueue[jobName] = true;
	}

	function deQueueJobs() {

		if (jobQueue.length === 0) {
			return;
		}

		if (jobsBeingRequested.length >= MAX_CONCURRENT_JOBS) {
			// console.log($ts(), "@@ Waiting for jobs to get back: ", jobsBeingRequested.length);
			return;
		}

		while (jobQueue.length && jobsBeingRequested.length < MAX_CONCURRENT_JOBS) {
			var nextJobName = jobQueue.shift();
			delete jobsInQueue[nextJobName];
			jobsBeingRequested.push(nextJobName);
			// console.log($ts(), "@@ Asking job ", jobsBeingRequested.length + "/-" + jobQueue.length, nextJobName);
			$timeout((function(name) { return function() { requestUpdateJob(name); } })(nextJobName));
		}
		$scope.stats.jobsQueue.len = jobQueue.length;
	}

	// Poor man's autoupdate: reload the page at midnight, so any dashboard around
	// will just use the newest version every morning
	var lastDayNumber = (new Date()).getDay();
	function checkIfReload() {
		if ((new Date()).getDay() !== lastDayNumber) {
			$window.location.reload();
		}
	}

	function checkIfLunch() {
		var from = [12, 30],
			to = [13, 0],
			prob = 2;

		var d = new Date(),
			_from = new Date(),
			_to = new Date();

		_from.setHours(from[0]);
		_from.setMinutes(from[1]);
		_to.setHours(to[0]);
		_to.setMinutes(to[1]);

		if (d > _from && d < _to) {
			var rand = Math.random()*10000|0;
			if (rand <= prob) {
				Voice.announceLunch();
			}
		}
	}

	window.check = checkIfLunch;

	Socket.on("j update-view", function(res, view) {
		$scope.stats.views.a++;
		$scope.stats.jobsQueue.r = res.jobs.length;

		if (view !== $scope.conf.viewName) {
			return;
		}

		clearJobsTimeouts();
		$scope.somethingBroken = false;
		var somethingBuilding = false;
		for (var j in res.jobs) {

			var job = res.jobs[j];
			if (!Jobs.existsJob(job.name)) {
				Jobs.createJob(job.name, job.color);
			}

			var currentJob = Jobs.job(job.name).setColor(job.color);

			if (currentJob.isBuilding() || buildingJobs[job.name]) {
				$scope.$broadcast('resume '+job.name)
				requestUpdateJobFast(job.name)
				somethingBuilding = true;
				ScreenSaver.hide();
			} else if (!currentJob.hasDetails() && !jobsInQueue[job.name]) {
				requestUpdateJobQueued(job.name);
			}

			if (currentJob.isBroken()) {
				ScreenSaver.hide();
				$scope.somethingBroken = true;
			}
		}

		if (!somethingBuilding && !$scope.somethingBroken) {
			ScreenSaver.startTimer();
		}

		deQueueJobs();
		checkIfLunch();
		checkIfReload();

		// console.log($ts(), 'View updated ', $scope.conf.viewName);
	});


	Socket.on("j update-job", function(job) {
		$scope.stats.jobs.a++;

		// Switched view and still receiving jobs we dont care about?
		if (!Jobs.existsJob(job.name)) {
			return;
		}

		if (jobsBeingRequested.indexOf(job.name) !== -1) {
			$scope.stats.jobsQueue.a++;
			jobsBeingRequested.splice(jobsBeingRequested.indexOf(job.name), 1);
			if (jobQueue.length > 0) {
				deQueueJobs();
			}
		}

		if (job.color === "notbuilt") {
			Jobs.job(job.name).setDetails(job);
			return;
		}

		var currentJob = Jobs.job(job.name);
		if (!currentJob.needToUpdateBuild(job)) {
			return;
		}

		currentJob.setDetails(job).setColor(job.color);

		if (currentJob.isBuilding()) {
			buildingJobs[job.name] = true;
			requestUpdateBuildFast(job.name, job.lastBuild.number);

		} else if (!currentJob.isBuilding() && buildingJobs[job.name]) {
			// console.log($ts(), '#### Job says build is done!', job.name);
			requestUpdateBuild(job.name, job.lastBuild.number);
			buildingJobs[job.name] = false;

			if (currentJob.isBroken())
				announceBrokenBuild(job.name);

		} else if (job.lastBuild && job.lastBuild.number) {
			requestUpdateBuild(job.name, job.lastBuild.number);
		}

	});


	Socket.on("j update-build", function(jobName, build) {
		$scope.stats.builds.a++;

		// Switched view and still receiving jobs we dont care about?
		if (!Jobs.existsJob(jobName)) {
			return;
		}

		// Job just finished to build!
		if (build.building === false && buildingJobs[jobName]) {
			// console.log($ts(), '#### Build says build is done!', jobName, build.number);

			$timeout.cancel(updateFastTimers[jobName + build.number]);
			updateFastTimers[jobName + build.number] = null;
			// We will know the color from the job .. :/
			requestUpdateJobFast(jobName);
		}

		$scope.$broadcast('resume '+ jobName);
		Jobs.job(jobName).setBuild(build);

		// console.log($ts(),'Build updated', jobName, build.number);
	});

	function announceBrokenBuild(jobName) {
		var job = Jobs.job(jobName),
			culprit = job.culprit || "someone";
		Voice.announceBrokenBuild(job.name, culprit);
	}

	var $ts = function() {
		var pad = function(n) { return ('0' + n).slice(-2); },
			date = new Date();
		return pad(date.getHours()) +':'+ pad(date.getMinutes()) +':'+ pad(date.getSeconds());
	}

});