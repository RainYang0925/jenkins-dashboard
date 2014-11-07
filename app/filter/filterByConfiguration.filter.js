angular.module("JenkinsDashboard")
.filter("filterByConfiguration", function(Conf) {
	return function(jobs, lastBuild) {
		var filtered = [];
		var filterString = Conf.val.filter.toLowerCase();

		angular.forEach(jobs, function(job) {
			//filter for names
			if (job.name.toLowerCase().match(filterString) !== null) {
					filtered.push(job);
					return;
			}

			//filter for user name
			var lastBuildJob = lastBuild[job.name];
			if (lastBuildJob.culprits && lastBuildJob.culprits.length > 0 && lastBuildJob.culprits[0] && lastBuildJob.culprits[0].fullName) {
				if (lastBuildJob.culprits[0].fullName.toLowerCase().match(filterString) !== null) {
					filtered.push(job); 
					return;
				}
			}

			//filter for shortDescription
			if (lastBuildJob.actions) {
				var actions = lastBuildJob.actions;
				for (var l = actions.length; l--;) {
					if (actions[l] && actions[l].causes) {
						if (actions[l].causes[0].userName && actions[l].causes[0].userName.toLowerCase().match(filterString) !== null) {
							filtered.push(job); 
							return;
						}
						if (actions[l].causes[0].shortDescription && actions[l].causes[0].shortDescription.toLowerCase().match(filterString) !== null) {
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
					if (changeSet.items[0].msg.toLowerCase().match(filterString)) {
						filtered.push(job); 
						return;
					}
				}
			}
		}) 

		return filtered;
	}
})