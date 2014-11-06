angular.module('JenkinsDashboard')
.directive('jobFilter', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'filter/jobFilter.tmpl.html',
		replace: true,
		controller: "jobFilterCtrl"
	};
});