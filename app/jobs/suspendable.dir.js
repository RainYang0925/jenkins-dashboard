angular.module('JenkinsDashboard')
.directive('suspendable', function () {
    return {
        link: function ($scope) {
            var watchers,
                suspended = false;

            $scope.$on('suspend '+ $scope.job.name, function () {
                if (suspended) return;

                console.log('---- SUSPENDED ', $scope.job.name);
                watchers = $scope.$$watchers;
                $scope.$$watchers = [];
                suspended = true;
            });

            $scope.$on('resume '+ $scope.job.name, function () {
                if (!suspended) return;

                console.log('---- RESUMED ', $scope.job.name);

                if (watchers) {
                    $scope.$$watchers = watchers;
                }

                watchers = undefined;
                suspended = false;
            });
        }
    };
});