angular.module('JenkinsDashboard')
.factory('Conf', function($rootScope, $modal, $route, $routeParams, $location) {

	var defaults = {
		address: "jd.prezi.com:4000",

		// These two are mutually exclusive
		useScreenSaver: true, 
		useFixedScreenSaver: false,

		timeout: 2,
		rotation: 20,

		fixedScreenSaver: "http://media.giphy.com/media/2FMZ918Q5JX8Y/giphy.gif",
		topic: "dog loop",

		sortBy: "name",
		viewName: "Boxfish-editor",
		filter: "",

		useSpeechSynthesis: true,
		useVisualAlerts: true,
		isSpeechSynthesisSupported: false,
		muteForMinutes: 20,
		muted: false,

		voiceTemplates: {
			brokenBuild: [
				"Hey, guys, {#2} just broke {#1}.. yayyy",
				"Hey {#2}, better check {#1} out!",
				"Looks like {#2} broke {#1}, what now?",
				"Ladies and gentleman, {#1} is broken. Say thanks to {#2}",
				"{#1} is broken. Maybe {#2} knows something about it?",
				"{#1} is RED. Let's blame {#2}",
				"Houston, we have a problem with {#1}, shall we ask {#2}?"
			],
			lunch: ["Lunch?", "Lunch", "Lunch!", "Hungry anyone?", "Food? Ebeed? Food!"]
		},
		voice: "Default"
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
			// Dealing with an empty filter in a special case, so the user can either 
			// delete it from the search box or in the URL, they will get in sync eventually
			if (p === "filter" && (next.params.filter === '' || typeof(next.params.filter) === "undefined")) {
				changed = true;
				conf.val.filter = "";
			} else if (next.params[p]) {
				changed = true;
				conf.val[p] = next.params[p];
			}
		});

		// If it's empty, the user entered an empty url, we already read the defaults (or the
		// localstorage conf), so we need to save it in the url too
		if (!changed || typeof(next.params.viewName) === "undefined") {
			setLocationFromConf();
		}

	});

	function setLocationFromConf() {
		var path = "/" + conf.val.viewName;

		path += "/" + conf.val.sortBy;

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
			ret.muted = false;
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
