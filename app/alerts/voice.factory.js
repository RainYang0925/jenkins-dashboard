angular.module('JenkinsDashboard')
.factory('Voice', function(Conf, $rootScope) {

	function fixSpokenCulpritName(culprit) {
		var result = culprit,
			culpritPronunciationTable = Conf.val.pronunciationTable;
		
		for (var k in culpritPronunciationTable) {
			result = result.replace(k, culpritPronunciationTable[k]);
		}
		return result;
	}

	function speak(message) {
		if (!Conf.val.isSpeechSynthesisSupported || !Conf.val.useSpeechSynthesis || Conf.val.muted) return;

		var utterance = new SpeechSynthesisUtterance(message);
		if (Conf.val.voice) {
			var voices = window.speechSynthesis.getVoices();
			var selectedVoice = voices.filter(function(v) {
				return v.name === Conf.val.voice || (Conf.val.voice === "Default" && v.default);
			});
			if (selectedVoice.length > 0) {
				utterance.voice = selectedVoice[0];
			}
		}
		// TODO: should we queue up the messages?
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utterance);
	}

	function announceLunch(who) {
		var tmpls = Conf.val.voiceTemplates.lunch,
			n = Math.random() * tmpls.length | 0,
			message = tmpls[n]
						.replace(/{#1}/g, who);
		speak(message);
	}

	function announceBrokenBuild(jobName, culprit) {
		var tmpls = Conf.val.voiceTemplates.brokenBuild,
			n = Math.random() * tmpls.length | 0,
			message = tmpls[n]
						.replace(/{#1}/g, jobName)
						.replace(/{#2}/g, culprit);

		if (Conf.val.useVisualAlerts)
			$rootScope.$broadcast('visual-alert', message);
		speakTemplate(tmpls[n], jobName, culprit);
	}

	function speakTemplate(template, param1, param2) {
		spokenMessage = template
			.replace(/{#1}/g, param1)
			.replace(/{#2}/g, fixSpokenCulpritName(param2));
		speak(spokenMessage);
	}

	function getVoiceNames() {
		var voices = window.speechSynthesis.getVoices().map(function (v) {
			return v.name;
		});
		return voices;
	}

	function onVoicesChanged(callback) {
		if (window.speechSynthesis) {
			window.speechSynthesis.onvoiceschanged = callback;
		}
	}

	return {
		announceLunch: announceLunch,
		announceBrokenBuild: announceBrokenBuild,
		speakTemplate: speakTemplate,
		getVoiceNames: getVoiceNames,
		onVoicesChanged: onVoicesChanged
	};
});
