angular.module('JenkinsDashboard')
.controller('socketMonitorCtrl', function($rootScope, $scope, Socket, $timeout, Conf) {

	var HIDE_MONITOR_MS = 3000;

	$scope.connected = false;

	var hideTimer;
	Socket.on('connect', function() {
		$scope.connected = true;
		$timeout.cancel(hideTimer);
		hideTimer = $timeout(function() {
			$scope.away = true;
			$scope.$apply();
		}, HIDE_MONITOR_MS);
	});

	Socket.on('disconnect', function() {
		$timeout.cancel(hideTimer);
		$scope.connected = false;
		$scope.away = false;
	});

	$scope.showConf = function() {
		$rootScope.$emit('show-conf');
	}

});