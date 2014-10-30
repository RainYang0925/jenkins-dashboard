angular.module('JenkinsDashboard')
.service('Conf', function($rootScope, $compile, $modal) {

	angular.element(document.querySelector('body')).append("<conf-panel></conf-panel>");
	$compile(document.querySelector('conf-panel'))($rootScope);
	$rootScope.$$phase || $rootScope.$digest();

	var defaults = {
		address: "localhost:4001",
		timeout: 60,
		rotation: 60*20,
		useScreenSaver: true
	};

	function save() {
		// Todo: buffer timeout?
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
		defaults : {
			address: "localhost:4001",
			timeout: 60,
			rotation: 60*20,
			useScreenSaver: true
		},
		save: save,
		val: read()
	};

	return conf;
});