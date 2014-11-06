angular.module('JenkinsDashboard')
.controller('jobFilterCtrl', function($scope, $modal, Conf) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.filter', function(v) { Conf.save(); });

});