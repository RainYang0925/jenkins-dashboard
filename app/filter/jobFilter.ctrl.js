angular.module('JenkinsDashboard')
.controller('jobFilterCtrl', function($scope, $modal, Conf, ScreenSaver) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.filter', function(v) {
		ScreenSaver.hide();
		Conf.save(); 
	});

});