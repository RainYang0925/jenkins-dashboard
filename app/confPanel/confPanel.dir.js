angular.module('JenkinsDashboard')
.directive('confPanel', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'confPanel/confPanel.tmpl.html',
		replace: true,
		controller: "confPanelCtrl"
	};
});