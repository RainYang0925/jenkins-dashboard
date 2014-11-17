angular.module('JenkinsDashboard')
.controller('confModalCtrl', function($scope, $window, Conf, ScreenSaver, Socket) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.useScreenSaver', function() { Conf.save(); });
	$scope.$watch('conf.timeout', function() { Conf.save(); });
	$scope.$watch('conf.rotation', function(v) { Conf.save(); });
	$scope.$watch('conf.topic', function(v) { Conf.save(); });
	$scope.$watch('conf.sortBy', function(v) { Conf.save(); });
	$scope.$watch('conf.viewName', function(v) { 
		Conf.save(); 
		$scope.inputViewName = v;
	});

	$scope.saveViewName = function() {
		$scope.conf.filter = '';
		$scope.conf.viewName = $scope.inputViewName;
		$scope.$hide();
	}

	$scope.$watch('conf', function() {
		ScreenSaver.hide();
	}, true);

	$scope.reload = function() {
		Conf.save();
		$window.location.reload();
	}

	Socket.emit("j update-views");

});