angular.module('JenkinsDashboard')
.controller('socketMonitorCtrl', function($rootScope, $scope, Socket, $timeout, Conf) {

	var HIDE_MONITOR_MS = 2000;

	$scope.connected = false;
	$scope.away = false;

	var hideTimer;
	Socket.on('connect', function() {
		$scope.connected = true;
		$timeout.cancel(hideTimer);
		$scope.$apply();

		var hideMs = HIDE_MONITOR_MS;
		if ($scope.isLoading) {
			hideMs = 100;
		}

		hideTimer = $timeout(function() {
			$rootScope.$broadcast('unblur');
			$scope.away = true;
			$scope.$apply();
		}, hideMs);
	});

	Socket.on('disconnect', function() {
		$rootScope.$broadcast('blur');
		$timeout.cancel(hideTimer);
		$scope.connected = false;
		$scope.away = false;
	});

	$scope.showConf = function() {
		$rootScope.$emit('show-conf');
	}

	$scope.isLoading = true;
	$timeout(function() {
		$scope.isLoading = false;
	}, HIDE_MONITOR_MS*2);

});