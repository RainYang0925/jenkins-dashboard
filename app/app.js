angular
	.module("JenkinsDashboard", ['mgcrea.ngStrap', 'ngResource', 'ngRoute'])
	.config(function($locationProvider, $routeProvider) {

		// See https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
		$locationProvider.html5Mode(true);

		$routeProvider
			.when('/:viewName', {})
			.when('/:viewName/:sortBy', {})
			.when('/:viewName/:sortBy/:filter', {})
			.otherwise({
				redirectTo: '/'
			});

	})