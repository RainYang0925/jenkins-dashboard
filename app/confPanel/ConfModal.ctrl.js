angular.module('JenkinsDashboard')
.controller('confModalCtrl', function($scope, $window, Conf) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.useScreenSaver', function(v) {
		Conf.save();
	});

	$scope.$watch('conf.timeout', function(v) {
		Conf.save();
	});

	$scope.$watch('conf.rotation', function(v) {
		Conf.save();
	});

	$scope.reload = function() {
		Conf.save();
		$window.location.reload();
	}

});