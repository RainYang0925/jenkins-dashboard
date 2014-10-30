angular.module('JenkinsDashboard')
.directive('socketMonitor', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'socket/socketMonitor.tmpl.html',
		replace: true,
		controller: "socketMonitorCtrl"
	};
});