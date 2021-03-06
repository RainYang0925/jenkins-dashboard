angular.module('JenkinsDashboard')
.controller('confModalCtrl', function($scope, $window, Conf, ScreenSaver, Socket, Voice) {

	$scope.conf = Conf.val;

	$scope.$watch('conf.useScreenSaver', function(newVal, oldVal) {
		if (newVal === true) {
			Conf.val.useFixedScreenSaver = false;
			ScreenSaver.changeScreenSaver();
		}
		Conf.save(); 
		ScreenSaver.hide();
	});

	$scope.$watch('conf.useFixedScreenSaver', function(newVal, oldVal) { 
		if (newVal === true) {
			Conf.val.useScreenSaver = false;
		}
		Conf.save(); 
		ScreenSaver.hide();
	});

	$scope.$watch('conf.timeout', function() { Conf.save(); ScreenSaver.hide(); });
	$scope.$watch('conf.rotation', function(v) { Conf.save(); });
	$scope.$watch('conf.topic', function(v) { Conf.save(); });
	$scope.$watch('conf.sortBy', function(v) { Conf.save(); });
	$scope.$watch('conf.viewName', function(v) { 
		Conf.save(); 
		$scope.temp.inputViewName = v;
	});
	$scope.$watch('conf.useSpeechSynthesis', function() { Conf.save(); });
	$scope.$watch('conf.voiceTemplates.brokenBuild', function() { Conf.save(); }, true);
	$scope.$watch('conf.muteForMinutes', function() { Conf.save(); });
	$scope.$watch('conf.fixedScreenSaver', function() { Conf.save(); });
	$scope.$watch('conf.voice', function() { Conf.save(); });

	$scope.temp = {};
	$scope.tabs = {
		activeTab: 0
	};
	$scope.saveViewName = function() {
		$scope.conf.filter = '';
		$scope.conf.viewName = $scope.temp.inputViewName;
		$scope.$hide();
	}

	$scope.reload = function() {
		Conf.save();
		$window.location.reload();
	}

	Socket.emit("j update-views");

	var bbTempl = Conf.val.voiceTemplates.brokenBuild;
	$scope.sentences = {
		reset: function() {
			Conf.val.voiceTemplates.brokenBuild = angular.copy(Conf.defaults.voiceTemplates.brokenBuild);
			bbTempl = Conf.val.voiceTemplates.brokenBuild;
		},
		remove: function(i) {
			bbTempl.splice(i, 1);
			if (bbTempl.length === 0) {
				bbTempl.push('');
			}
		},
		add: function() {
			var len = bbTempl.length;
			if (bbTempl[len - 1] !== '') {
				bbTempl.push('');
			}
		},
		test: function(i) {
			Voice.speakTemplate(bbTempl[i], "boxfish", "HP");
		}
	}

		function updateVoices() {
			$scope.availableVoices = ["Default"].concat(Voice.getVoiceNames());
			if ($scope.availableVoices.indexOf($scope.conf.voice) === -1) {
				$scope.availableVoices.push($scope.conf.voice);
			}
		}

		updateVoices();
		Voice.onVoicesChanged(function() {
			updateVoices();
		});

});
