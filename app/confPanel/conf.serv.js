angular.module('JenkinsDashboard')
.service('Conf', function($rootScope, $compile, $modal) {

	angular.element(document.querySelector('body')).append("<conf-button></conf-button>");
	$compile(document.querySelector('conf-button'))($rootScope);
	$rootScope.$$phase || $rootScope.$digest();

	var defaults = {
		address: "localhost:4001",
		timeout: 2,
		rotation: 20,
		useScreenSaver: true,
		topic: "dog loop"
	};

	function save() {
		localStorage['jenkinsDashboardConf'] = JSON.stringify(conf.val);
	}

	function read() {
		if (typeof(localStorage['jenkinsDashboardConf']) === "undefined") {
			var defaultsJSON = JSON.stringify(defaults);
			localStorage['jenkinsDashboardConf'] = defaultsJSON;
			return defaults;
		}
		return JSON.parse(localStorage['jenkinsDashboardConf']);
	}

	var conf = {
		defaults : defaults,
		save: save,
		val: read()
	};

	return conf;
});