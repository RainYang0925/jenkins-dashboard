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
		filter: "",
		useSpeechSynthesis: true,
		isSpeechSynthesisSupported: false
	};

	var firstRouteChange = false;

	function isSpeechSynthesisSupported() { 
		return ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window); 
	}

	// When the route change, update the conf
	$rootScope.$on("$routeChangeSuccess", function (scope, next, current) {
		firstRouteChange = true;

		var changed = false;
		["viewName", "sortBy", "filter"].forEach(function(p) {
			if (next.params[p]) {
				changed = true;
				conf.val[p] = next.params[p];
			}
		});

		// If it's empty, the user entered an empty url, we already read the defaults (or the
		// localstorage conf), so we need to save it in the url too
		if (changed || typeof(next.params.viewName) === "undefined")
			setLocationFromConf();
	});

	function setLocationFromConf() {
		var path = "/" + conf.val.viewName;

		path += "/" + conf.val.order;

		if (conf.val.filter !== '') {
			path += "/" + conf.val.filter;
		}

		// Waiting for the route to be ready, or we would override the user entered url with
		// what we had in the localstorage or even worse, the defaults
		if (firstRouteChange) {
			$location.path(path);
		}
	}

	function save() {
		localStorage['jenkinsDashboardConf'] = JSON.stringify(conf.val);
		setLocationFromConf();
	}

	function read() {
		var ret = angular.copy(defaults);

		if (typeof(localStorage['jenkinsDashboardConf']) === "undefined") {
			var defaultsJSON = JSON.stringify(defaults);
			localStorage['jenkinsDashboardConf'] = defaultsJSON;
		} else {
			angular.extend(ret, JSON.parse(localStorage['jenkinsDashboardConf']));
		}

		if (isSpeechSynthesisSupported()) {
			ret.isSpeechSynthesisSupported = true;
		} else {
			ret.isSpeechSynthesisSupported = false;
		}

		// At this stage the $routeParams have not been read yet .. :(
		return ret;
	}

	var conf = {
		defaults : defaults,
		save: save,
		val: read()
	};

	save();
	return conf;
});