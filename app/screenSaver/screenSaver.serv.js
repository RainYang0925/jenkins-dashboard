angular.module('JenkinsDashboard')
.service('ScreenSaver', function($timeout, $rootScope, $resource, Conf) {

	// TODO: this is the 'beta' key, request a proper one when ready to go live!
	var GIPHY_API_KEY = "dc6zaTOxFJmzC",
		randomGIF = $resource('http://api.giphy.com/v1/gifs/random', { api_key: GIPHY_API_KEY });

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
		if (!screenSaverTimeout && Conf.val.useScreenSaver) {
			screenSaverTimeout = $timeout(show, (parseFloat(Conf.val.timeout) || Conf.defaults.timeout) * 60 * 1000);
		}
	}

	function startRotationTimer() {
		var rotation = parseFloat(Conf.val.rotation);
		if (rotation === 0) {
			$timeout.cancel(screenSaverChangeTimeout)
			screenSaverChangeTimeout = null;
			console.log('No rotation, resetting the change timer');
			return;
		}

		$timeout.cancel(screenSaverChangeTimeout)
		screenSaverChangeTimeout = null;
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
	changeScreenSaver();

	return {
		startTimer: startTimer,
		show: show,
		hide: hide,
		onHide: function(f) { hideCbs.push(f); },
		onShow: function(f) { showCbs.push(f); },
		onChangeImage: function(f) { changeImageCbs.push(f); },
		getImg: function() { return currentScreenSaver; }
	};

});