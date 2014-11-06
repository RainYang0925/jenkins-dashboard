angular.module('JenkinsDashboard')
.service('Conf', function($rootScope, $compile, $modal, $route, $routeParams, $location) {

	angular.element(document.querySelector('body')).append("<conf-button></conf-button>");
	$compile(document.querySelector('conf-button'))($rootScope);
	$rootScope.$$phase || $rootScope.$digest();

	var defaults = {
		address: "localhost:4001",
		timeout: 2,
		rotation: 20,
		useScreenSaver: true,
		topic: "dog loop",
		order: "name",
		viewName: "Boxfish-Koi",
		filter: ""
	};

	function setLocationFromConf() {
		var path = "/" + conf.val.viewName;
		if (conf.val.order !== defaults.order) {
			path += "/" + conf.val.order;
		}
		$location.path(path);
	}

	function save() {
		localStorage['jenkinsDashboardConf'] = JSON.stringify(conf.val);
		setLocationFromConf();
	}

	function read() {
		if (typeof(localStorage['jenkinsDashboardConf']) === "undefined") {
			var defaultsJSON = JSON.stringify(defaults);
			localStorage['jenkinsDashboardConf'] = defaultsJSON;
			return defaults;
		}
		var parsed = JSON.parse(localStorage['jenkinsDashboardConf']),
			ret = angular.copy(defaults);

		return angular.extend(ret, parsed);
	}

	var conf = {
		defaults : defaults,
		save: save,
		val: read()
	};

	setLocationFromConf();

	return conf;
});