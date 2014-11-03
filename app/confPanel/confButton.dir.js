angular.module('JenkinsDashboard')
.directive('confButton', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'confPanel/confButton.tmpl.html',
		replace: true,
		controller: "confButtonCtrl"
	};
});