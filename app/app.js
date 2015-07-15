angular
	.module("JenkinsDashboard", ['mgcrea.ngStrap', 'ngResource', 'ngRoute'])
	.config(function($locationProvider, $routeProvider, $compileProvider) {

		// Work around angular unsafe links
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|vnc):/);

		// Dont use html5 when gulp is serving the pages.. since it just doesnt work :P
		var useHtml5Mode = window.location.host.match('localhost:4000') === null;
		$locationProvider.html5Mode(useHtml5Mode);

		// To configure the webserver to rewrite the URLs, see
		// https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode

		$routeProvider
			.when('/:viewName', {})
			.when('/:viewName/:sortBy', {})
			.when('/:viewName/:sortBy/:filter', {})
			.otherwise({
				redirectTo: '/'
			});

	})
