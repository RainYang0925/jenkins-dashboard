angular.module('JenkinsDashboard')
.controller('confButtonCtrl', function($rootScope, $scope, $modal, ScreenSaver, Conf, Socket) {

	var modal = $modal({ 
		scope: $scope, 
		template: 'confPanel/modal.tmpl.html', 
		placement: 'center',
		show: false });

	$rootScope.$on('show-conf', function() {
		$scope.showModal();
	});

	$scope.showModal = function() {
		modal.$promise.then(modal.show);
	}

	$scope.data = {
		views: []
	};

	Socket.on("j update-views", function(views) {
		$scope.data.views.length = 0;
		for (var i = 0; i < views.length; i++) {
			$scope.data.views.push(views[i].name);
		}

	});


});