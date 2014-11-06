angular
	.module("JenkinsDashboard", ['mgcrea.ngStrap', 'ngResource', 'ngRoute'])
	.config(function($locationProvider, $routeProvider) {

		$locationProvider.html5Mode(false);

		$routeProvider
			.when('/:viewName', {})
			.when('/:viewName/:sortBy', {})
			.otherwise({
				redirectTo: '/'
			});

	})