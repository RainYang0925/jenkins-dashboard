angular.module('JenkinsDashboard')
.service('ScreenSaver', function($timeout, $rootScope, Conf) {

	var SCREEN_SAVER_MS = parseInt(Conf.timeout, 10) * 60 * 1000,
		SCREEN_SAVER_CHANGE = 10 * 60 * 1000;

	var fixtures = [
		'/styles/fixture1.gif',
		'/styles/fixture2.gif',
		'/styles/fixture3.gif',
		'/styles/fixture4.gif',
		'/styles/fixture5.gif'
	];

	var isShown = false,
		hideCbs = [],
		showCbs = [],
		changeImageCbs = [],
		screenSaverChangeTimeout = null,
		screenSaverTimeout = null,
		currentScreenSaver;

	function show() {
		changeScreenSaver();
		isShown = true;
		for (var l = showCbs.length; l--;)
			showCbs[l].call();
	}

	function hide() {
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

	function changeScreenSaver() {
		currentScreenSaver = fixtures[Math.floor(Math.random() * fixtures.length)];

		var rotation = parseFloat(Conf.val.rotation);
		if (rotation === 0) {
			$timeout.cancel(screenSaverChangeTimeout)
			screenSaverChangeTimeout = null;
			return
		}

		screenSaverChangeTimeout = $timeout(changeScreenSaver, (rotation || Conf.defaults.rotation) * 60 * 1000);

		for (var l = changeImageCbs.length; l--;)
			changeImageCbs[l].call();
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