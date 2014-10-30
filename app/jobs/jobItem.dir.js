angular.module('JenkinsDashboard')
.directive('jobItem', function() {
	return {
		restrict: 'E',
		scope: {
			job: '=',
			details: '=',
			lastBuild: '='
		},
		templateUrl: 'jobs/jobItem.tmpl.html',
		replace: true,
		controller: "jobItemCtrl"
	};
});