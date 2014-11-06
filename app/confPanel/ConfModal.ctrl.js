angular.module('JenkinsDashboard')
.controller('confModalCtrl', function($scope, $window, Conf) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.useScreenSaver', function() { Conf.save(); });
	$scope.$watch('conf.timeout', function() { Conf.save(); });
	$scope.$watch('conf.rotation', function(v) { Conf.save(); });
	$scope.$watch('conf.topic', function(v) { Conf.save(); });

	$scope.reload = function() {
		Conf.save();
		$window.location.reload();
	}

});