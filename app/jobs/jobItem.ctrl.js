angular.module('JenkinsDashboard')
.controller('jobItemCtrl', function($scope) {

	function hasDetails() {
		return $scope.details && $scope.lastBuild;
	}

	$scope.getJobClassName = function() {
		if ($scope.isBuilding()) {
			return "bg-info job-building";
		} else if ($scope.isSuccess()) {
			return "bg-success";
		} else if ($scope.isFailure()) {
			return "bg-danger";
		} else if ($scope.isUnstable()) {
			return "bg-warning";
		} else if ($scope.isAborted()) {
			return "bg-notbuilt";
		} else if ($scope.isNotBuilt()) {
			return "bg-notbuilt";
		} else {
			return "bg-notbuilt";
		}
	}

	$scope.isBuilding = function() {
		if (hasDetails() && $scope.details.color.match(/_anime/) !== null)
			return true;
		return false;
	};

	$scope.isSuccess = function() {
		return hasDetails() && !$scope.isBuilding() && $scope.details.color.match(/blue/) !== null;
	};

	$scope.isFailure = function() {
		return hasDetails() && !$scope.isBuilding() && $scope.details.color.match(/red/) !== null;
	};

	$scope.isUnstable = function() {
		return hasDetails() && !$scope.isBuilding() && $scope.details.color.match(/yellow/) !== null;
	};

	$scope.isAborted = function() {
		return hasDetails() && !$scope.isBuilding() && $scope.details.color.match(/aborted/) !== null;
	}

	$scope.isNotBuilt = function() {
		return hasDetails() && !$scope.isBuilding() && $scope.details.color.match(/notbuilt/) !== null;
	}

	$scope.getCulprit = function() {
		if (!hasDetails()) return;

		// Proper culprits, return the full name
		if ($scope.lastBuild.culprits[0]) {
			return $scope.lastBuild.culprits[0].fullName;
		}

		// Else, let's see if there's causes
		var actions = $scope.lastBuild.actions;
		for (var l = actions.length; l--;) {
			if (actions[l] && actions[l].causes && actions[l].causes[0].userName) 
				return actions[l].causes[0].userName;
		}


		// Else, maybe there's a shortDescription
		for (var l = actions.length; l--;) {
			if (actions[l] && actions[l].causes && actions[l].causes[0].shortDescription) 
				return actions[l].causes[0].shortDescription;
		}

	}

	$scope.getCompletionPercentage = function() {
		if (!hasDetails()) return;
		if (!$scope.isBuilding()) return;

		// No est duration, first build or something?
		if (!$scope.lastBuild.estimatedDuration) return 100;

		var start = $scope.lastBuild.timestamp,
			duration = $scope.lastBuild.estimatedDuration,
			perc = Math.round((new Date().getTime() - start) / duration * 100);

		return Math.min(perc, 100);
	}

	function pad(n) { return ('0' + n).slice(-2); }

	$scope.getTimeLeft = function() {
		if (!hasDetails()) return;
		if (!$scope.isBuilding()) return;

		// No est duration, first build or something?
		if (!$scope.lastBuild.estimatedDuration) return "??:??";

		var start = $scope.lastBuild.timestamp,
			duration = $scope.lastBuild.estimatedDuration,
			timeLeftMs = (new Date().getTime() - start) - duration;

		// Build taking longer than expected
		if (timeLeftMs > 0) {
			timeLeftDate = new Date(timeLeftMs - 3600000);
			return "+" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		} else {
			timeLeftDate = new Date(-timeLeftMs + 3600000);
			return "-" + pad(timeLeftDate.getMinutes()) + ":" + pad(timeLeftDate.getSeconds());
		}
	}


});