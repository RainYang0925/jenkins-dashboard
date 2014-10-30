angular.module('JenkinsDashboard')
.controller('confPanelCtrl', function($rootScope, $scope, $modal, ScreenSaver, Conf) {

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

});