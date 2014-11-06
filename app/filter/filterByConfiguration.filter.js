angular.module("JenkinsDashboard")
.filter("filterByConfiguration", function(Conf) {
	return function(jobs, lastBuild) {
		var filtered = [];
		var filterString = Conf.val.filter.toLowerCase();

		console.log('Filtering');
		angular.forEach(jobs, function(job) {
			if (job.name.match(filterString) !== null) {
					filtered.push(job);
					return;
			}

			var lastBuildJob = lastBuild[job.name];
			if (lastBuildJob.culprits && lastBuildJob.culprits.length > 0 && lastBuildJob.culprits[0] && lastBuildJob.culprits[0].fullName) {
				if (lastBuildJob.culprits[0].fullName.toLowerCase().match(filterString) !== null) {
					filtered.push(job); 
					return;
				}
			}

			if (lastBuildJob.actions) {
				var actions = lastBuildJob.actions;
				for (var l = actions.length; l--;) {
					if (actions[l] && actions[l].causes) {
						if (actions[l].causes[0].userName && actions[l].causes[0].userName.match(filterString) !== null) {
							filtered.push(job); 
							return;
						}
						if (actions[l].causes[0].shortDescription && actions[l].causes[0].shortDescription.match(filterString) !== null) {
							filtered.push(job); 
							return;
						}
					}
				}
			}

		}) 
		return filtered;
	}
})