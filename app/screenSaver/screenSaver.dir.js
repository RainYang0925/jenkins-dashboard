angular.module('JenkinsDashboard')
.directive('screenSaver', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'screenSaver/screenSaver.tmpl.html',
		replace: true,
		controller: 'screenSaverCtrl'
	};
});