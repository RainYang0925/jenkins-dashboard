angular.module("JenkinsDashboard")
.filter("filterByConfiguration", function(Conf) {
	return function(jobs, lastBuild) {
		var filtered = [];
		var re = new RegExp(Conf.val.filter.toLowerCase());

		angular.forEach(jobs, function(job) {
			//filter for names
			if (re.test(job.name.toLowerCase())) {
					filtered.push(job);
					return;
			}

			// No details yet for that job, skip this round
			if (typeof(lastBuild[job.name]) === "undefined") {
				return;
			}

			//filter for user name
			var lastBuildJob = lastBuild[job.name];
			if (lastBuildJob.culprits && lastBuildJob.culprits.length > 0 && lastBuildJob.culprits[0] && lastBuildJob.culprits[0].fullName) {
				if (re.test(lastBuildJob.culprits[0].fullName.toLowerCase())) {
					filtered.push(job); 
					return;
				}
			}

			//filter for shortDescription
			if (lastBuildJob.actions) {
				var actions = lastBuildJob.actions;
				for (var l = actions.length; l--;) {
					if (actions[l] && actions[l].causes) {
						if (actions[l].causes[0].userName && re.test(actions[l].causes[0].userName.toLowerCase())) {
							filtered.push(job); 
							return;
						}
						if (actions[l].causes[0].shortDescription && re.test(actions[l].causes[0].shortDescription.toLowerCase())) {
							filtered.push(job); 
							return;
						}
					}
				}
			}

			//filter for changeSet.msg
			if (lastBuildJob.changeSet) {
				var changeSet = lastBuildJob.changeSet;
				if (changeSet.items && changeSet.items.length > 0 && changeSet.items[0].msg) {
					if (re.test(changeSet.items[0].msg.toLowerCase())) {
						filtered.push(job); 
						return;
					}
				}
			}
		}) 

		return filtered;
	}
})