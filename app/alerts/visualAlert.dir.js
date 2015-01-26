angular.module('JenkinsDashboard')
.directive('visualAlert', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'alerts/visualAlert.tmpl.html',
		replace: true,
		controller: 'visualAlertCtrl'
	};
});