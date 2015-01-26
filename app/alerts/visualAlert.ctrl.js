angular.module('JenkinsDashboard')
.controller('visualAlertCtrl', function($scope, $rootScope, $timeout) {

	$scope.mouseHandler = function() {
		$timeout.cancel($scope.hideVisualAlertTimeout);
		hide();
	}

	function hide() {
		$scope.isShown = false;
		$rootScope.$broadcast('unblur');
	}

	$rootScope.$on('visual-alert', function(ev, message) {
		$scope.message = message;
		$scope.isShown = true;

		$timeout.cancel($scope.hideVisualAlertTimeout);
		$scope.hideVisualAlertTimeout = $timeout(hide, 10000);
		$rootScope.$broadcast('blur');
	});

	$scope.hideVisualAlertTimeout = null;
	$scope.message = "";
	$scope.isShown = false;
});