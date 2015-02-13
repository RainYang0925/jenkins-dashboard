angular.module('JenkinsDashboard')
.controller('confButtonCtrl', function($rootScope, $scope, $modal, $interval, ScreenSaver, Conf, Socket) {

	var modal = $modal({
		scope: $scope,
		template: 'confPanel/modal.tmpl.html',
		placement: 'center',
		show: false
	});

	$rootScope.$on('show-conf', function() {
		$scope.showModal();
	});

	$scope.showModal = function() {
		modal.$promise.then(modal.show);
	};

	$scope.conf = Conf.val;
	$scope.mutedTimeLeft = '';
	$scope.muted = false;
	var mutedUpdateInterval = null;
	$scope.toggleMute = function() {

		$scope.muted = !$scope.muted;

		if ($scope.muted) {
			$scope.mutedTimeLeft = "Ssssht!";

			var mutedStart = new Date();
			mutedUpdateInterval = $interval(function() {
				var timeLeft = Math.floor(Conf.val.muteForMinutes * 60 - (new Date() - mutedStart) / 1000);

				if (timeLeft < 0) {
					$interval.cancel(mutedUpdateInterval);
					mutedUpdateInterval = undefined;
					Conf.val.muted = false;
					$scope.muted = false;
				} else {
					$scope.mutedTimeLeft = Math.floor(timeLeft / 60) + ":" + ('0' + (timeLeft % 60)).slice(-2);
					Conf.val.muted = true;
				}
			}, 1000);
		} else {
			if (angular.isDefined(mutedUpdateInterval)) {
				$interval.cancel(mutedUpdateInterval);
				mutedUpdateInterval = undefined;
			}
			Conf.val.muted = false;
		}
	};

	$scope.data = {
		views: [],
		viewsNumberTooltip: "Loading views.."
	};

	Socket.on("j update-views", function(views) {
		$scope.data.viewsNumberTooltip = "Available views";
		$scope.data.views = [];
		for (var i = 0; i < views.length; i++) {
			$scope.data.views.push(views[i].name);
		}
	});

});