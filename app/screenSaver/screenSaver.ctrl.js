angular.module('JenkinsDashboard')
.controller('screenSaverCtrl', function($scope, ScreenSaver) {

	$scope.mouseHandler = function() {
		ScreenSaver.hide();
	}

	$scope.isShown = false;

	ScreenSaver.onHide(function() {
		$scope.isShown = false;
	});

	ScreenSaver.onShow(function() {
		$scope.isShown = true;
		$scope.src = ScreenSaver.getImg();
	});

	ScreenSaver.onChangeImage(function() {
		$scope.src = ScreenSaver.getImg();
	});

});