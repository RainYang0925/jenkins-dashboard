angular.module('JenkinsDashboard')
.factory('ScreenSaver', function($timeout, $rootScope, $resource, Conf) {

	var GIPHY_API_KEY = "12ss5TcLvRjUze",
		randomGIF = $resource('https://api.giphy.com/v1/gifs/random', { api_key: GIPHY_API_KEY });

	var isShown = false,
		hideCbs = [],
		showCbs = [],
		changeImageCbs = [],
		screenSaverChangeTimeout = null,
		screenSaverTimeout = null,
		currentScreenSaver;

	function show() {
		isShown = true;
		for (var l = showCbs.length; l--;)
			showCbs[l].call();

		startRotationTimer();
	}

	function hide() {
		if (!isShown) return;

		$timeout.cancel(screenSaverTimeout);
		$timeout.cancel(screenSaverChangeTimeout)

		// TODO: needed?
		screenSaverTimeout = null;
		screenSaverChangeTimeout = null;

		isShown = false;
		for (var l = hideCbs.length; l--;)
			hideCbs[l].call();
	}

	function startTimer() {
		if (!screenSaverTimeout && (Conf.val.useScreenSaver || Conf.val.useFixedScreenSaver)) {
			screenSaverTimeout = $timeout(show, (parseFloat(Conf.val.timeout) || Conf.defaults.timeout) * 60 * 1000);
		}
	}

	function startRotationTimer() {
		var rotation = parseFloat(Conf.val.rotation);

		$timeout.cancel(screenSaverChangeTimeout)
		screenSaverChangeTimeout = null;

		if (rotation === 0) {
			console.log('No rotation, resetting the change timer');
			return;
		}

		screenSaverChangeTimeout = $timeout(changeScreenSaver, (rotation || Conf.defaults.rotation) * 60 * 1000);
	}

	function changeScreenSaver() {
		randomGIF.get({ tag: Conf.val.topic }, function(res) {
			currentScreenSaver = res.data.image_url;
			for (var l = changeImageCbs.length; l--;) {
				changeImageCbs[l].call();
			}
			console.log("New screensaver: ", currentScreenSaver);
		});

		if (isShown) {
			startRotationTimer();
		}
	}

	if (Conf.val.useScreenSaver) {
		changeScreenSaver();
	}

	return {
		startTimer: startTimer,
		show: show,
		hide: hide,
		onHide: function(f) { hideCbs.push(f); },
		onShow: function(f) { showCbs.push(f); },
		onChangeImage: function(f) { changeImageCbs.push(f); },
		getImg: function() {
			if (Conf.val.useFixedScreenSaver) {
				return Conf.val.fixedScreenSaver;
			}
			return currentScreenSaver; 
		},
		changeScreenSaver: changeScreenSaver
	};

});