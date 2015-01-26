angular.module('JenkinsDashboard')
.factory('Jobs', function(Conf, $timeout) {

	var SORT_TIMEOUT_MS = 500;

	function Job(name, color) {
		this.name = name;
		this.color = color;
		this.details = null;
		this.build = null;
		this.lastBuildURL = null;
		this.message = "";
		this.culprit = "";
		this.timeLeft = '';
		this.completionPercentage = 0;
		this.matchesFilter = true;

		this.updateOrderValues();
	}
	Job.prototype.hasDetails = function() { return this.details !== null; }
	Job.prototype.hasBuild = function() { return this.build !== null; }
	Job.prototype.setColor = function(c) {
		var oldColor = this.color;
		this.color = c;

		if (oldColor !== c) {
			this.updateOrderValues();
			sortJobs();
		}
		return this;
	}
	Job.prototype.setDetails = function(details) { 
		var oldDetails = this.details,
			oldColor = this.color;

		this.details = details;
		this.color = details.color;

		if (this.details !== oldDetails || this.color !== oldColor) {
			this.updateOrderValues();
			sortJobs();
		}
		return this;
	}
	Job.prototype.setBuild = function(b) { 
		this.build = b;
		this.lastBuildURL = ('url' in b) ? b.url + "console" : null;
		return this.setCulprit().setMessage().setTimeLeftAndCompletionPercentage();
	}
	Job.prototype.updateOrderValues = function() {
		this.ord = {
			broken: orderByBrokenFirst(this.color, this.name),
			running: orderByRunningFirst(this.color, this.name),
			name: this.name
		}
		return;
	}
	function orderByBrokenFirst(color, name) {
		if (color === "red") {
			return 0 + name;
		} else if (color.match(/_anime/) !== null) {
			return 1 + name;
		} else if (color === "yellow") {
			return 2 + name;
		} else if (color === "aborted") {
			return 3 + name;
		} else if (color === "disabled" || color === "notbuilt") {
			return 99 + name;
		} else {
			return 5 + name;
		}
	}

	function orderByRunningFirst(color, name) {
		if (color.match(/_anime/) !== null) {
			return 0 + name;
		} else if (color === "red") {
			return 1 + name;
		} else if (color === "yellow") {
			return 2 + name;
		} else if (color === "aborted") {
			return 3 + name;
		} else if (color === "disabled" || color === "notbuilt") {
			return 99 + name;
		} else {
			return 6 + name;
		}
	}

	Job.prototype.isBuilding = function() { return isBuildingColor(this.color); }
	Job.prototype.needToUpdateBuild = function(build) {
		if (this.isBuilding() || isBuildingColor(build.color) || !this.hasBuild())
			return true;

		if (build.lastBuild && build.lastBuild.number && this.build.lastBuild) {
			if (this.build.lastBuild.number === build.lastBuild.number) {
				return false;
			}
		}
		return true;
	};

	Job.prototype.getClassName = function() {
		if (this.isBuilding())
			return "bg-info job-building";
		else if (this.isSuccess())
			return "bg-success";
		else if (this.isFailure())
			return "bg-danger";
		else if (this.isUnstable())
			return "bg-warning";
		else if (this.isAborted())
			return "bg-aborted";
		else
			return "bg-notbuilt";
	}

	Job.prototype.isSuccess = function() { return this.color.match(/blue/) !== null; };
	Job.prototype.isFailure = function() { return this.color.match(/red/) !== null; };
	Job.prototype.isUnstable = function() { return this.color.match(/yellow/) !== null; };
	Job.prototype.isAborted = function() { return this.color.match(/aborted/) !== null; };
	Job.prototype.isNotBuilt = function() { return this.color.match(/notbuilt/) !== null; };
	Job.prototype.isBroken = function() { return this.isFailure() || this.isUnstable() }
	function pad(n) { return ('0' + n).slice(-2); }

	Job.prototype.setTimeLeftAndCompletionPercentage = function() {
		if (!this.isBuilding() || !this.hasBuild()) {
			this.completionPercentage = 0;
			this.timeLeft = '';
			return this;
		}

		if (!this.build.estimatedDuration) {
			this.timeLeft = "??:??";
			this.completionPercentage = 0;
			return this;
		} 

		var start = this.build.timestamp,
			duration = this.build.estimatedDuration,
			perc = Math.round((new Date().getTime() - start) / duration * 100),
			timeLeftMs = (new Date().getTime() - start) - duration,
			timeLeftDate;

		this.completionPercentage = Math.min(perc, 100);

		if (timeLeftMs > 0) {
			timeLeftDate = new Date(timeLeftMs - 3600000);
			this.timeLeft =  "+" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		} else {
			timeLeftDate = new Date(-timeLeftMs + 3600000);
			this.timeLeft =  "-" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		}

		return this;
	}

	Job.prototype.getCompletionPercentage = function() {
		if (!this.isBuilding()) return 0;

		// No est duration, first build or something?
		if (!this.hasBuild()) {
			return 0;
		}

		var start = this.build.timestamp,
			duration = this.build.estimatedDuration,
			perc = Math.round((new Date().getTime() - start) / duration * 100);

		return Math.min(perc, 100);
	}

	Job.prototype.getTimeLeft = function() {
		if (!this.isBuilding()) return;

		// No est duration, first build or something?
		if (!this.hasBuild() || !this.build.estimatedDuration) return "??:??";

		var start = this.build.timestamp,
			duration = this.build.estimatedDuration,
			timeLeftMs = (new Date().getTime() - start) - duration;

		// Build taking longer than expected
		if (timeLeftMs > 0) {
			timeLeftDate = new Date(timeLeftMs - 3600000);
			return "+" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		} else {
			timeLeftDate = new Date(-timeLeftMs + 3600000);
			return "-" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		}
	}

	Job.prototype.setCulprit = function(culprit) {
		if (typeof(culprit) !== "undefined") {
			this.culprit = culprit;
			return this;
		}

		// Proper culprits, set the full name
		if (this.build.culprits[0]) {
			this.culprit = this.build.culprits[0].fullName.replace(/\./g, ' ');
			return this;
		} 

		// Else, let's see if there's causes
		var actions = this.build.actions;
		for (var l = actions.length; l--;) {
			if (actions[l] && actions[l].causes && actions[l].causes.length > 0) {
				for (var c = actions[l].causes.length; c--;) {
					if (actions[l].causes[c].userName) {
						this.culprit = actions[l].causes[c].userName.replace(/\./g, ' ');
						return this;
					}

				}
			}
		}

		return this;
	}
	Job.prototype.setMessage = function(message) {
		if (typeof(message) !== "undefined") {
			this.message = message;
		} else if (this.build.changeSet && this.build.changeSet.items && this.build.changeSet.items.length > 0 && this.build.changeSet.items[0].msg) {
			this.message = this.build.changeSet.items[0].msg;
		} else {
			// Else, let's see if there's causes
			var actions = this.build.actions;
			for (var l = actions.length; l--;) {
				if (actions[l] && actions[l].causes && actions[l].causes.length > 0) {
					for (var c = actions[l].causes.length; c--;) {
						if (actions[l].causes[c].shortDescription) {
							this.message = actions[l].causes[c].shortDescription;
							return this;
						}

					}
				}
			}
		}

		return this;
	}

	function isBuildingColor(color) {
		return color.match(/_anime/) !== null;
	}


	var data = {};
	function clear() {
		data = {
			jobs: {},
			sortedJobs: []
		};
	}
	clear();

	function createJob(name, color) {
		data.jobs[name] = new Job(name, color);
		sortJobs();
		return data.jobs[name];
	}

	var sortTimeout = null;
	function sortJobs() {
		if (sortTimeout !== null) return;
		sortTimeout = $timeout(executeSort, SORT_TIMEOUT_MS);
	}

	Job.prototype.setMatchesFilter = function() {
		if (!Conf.val.filter) {
			this.matchesFilter = true;
			return this;
		}

		var re = new RegExp(Conf.val.filter.toLowerCase());

		// filter for names
		if (re.test(this.name.toLowerCase())) {
			this.matchesFilter = true;
			return this;
		}

		// No details yet for that job, skip this round
		if (!this.hasBuild()) {
			this.matchesFilter = false;
			return this;
		}

		// filter for user name
		if (re.test(this.culprit.toLowerCase())) {
			this.matchesFilter = true;
			return this;
		}

		// filter for changeSet.msg
		if (re.test(this.message.toLowerCase())) {
			this.matchesFilter = true;
			return this;
		}

		this.matchesFilter = false;
		return this;
	}

	function executeSort() {
		var ar = [];

		skipped = 0;
		sortTimeout = null;

		var filter = Conf.val.filter;
		for (var n in data.jobs) {
			if (data.jobs[n].hasDetails()) {
				data.jobs[n].setMatchesFilter();
				ar.push(data.jobs[n]);
			}
		}

		var field = Conf.val.sortBy;
		ar.sort(function(a, b) {
			return (a.ord[field] > b.ord[field]) ? 1 : -1;
		});

		data.sortedJobs = ar;
	}

	var Jobs = {
		createJob: createJob,
		clear: clear,
		isBuildingColor: isBuildingColor,
		job: function(name) { return data.jobs[name]; },
		existsJob: function(name) { return name in data.jobs; },
		sortedJobs: function() { return data.sortedJobs; },
		sort: function() { 
			sortJobs(); 
		}
	};

	return Jobs;
});
