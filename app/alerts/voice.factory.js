angular.module('JenkinsDashboard')
.factory('Voice', function(Conf, $rootScope) {
	
	var culpritPronunciationTable = {
		"Matyas Barsi": "Matjas Barshi",
		"rosadam": "Roz",
		"OmarEl-Mohandes": "omar dee ninja",
		"khaled sami": "khaleds ami",
		"Adam Peresztegi": "flash",
		"simone fonda": "simohneh fonda",
		"Peter Sipos": "sheepee",
		"david nemeth csoka": "dahvid nemeth tschoka",
		"Lorant Pinter": "Lorant Peen ther",
		"Dzso Pengo": "Joe"
	};

	function fixCulpritName(culprit) {
		var result = culprit
		for (var k in culpritPronunciationTable) {
			result = result.replace(k, culpritPronunciationTable[k]);
		}
		return result;
	}

	function speak(message) {
		if (!Conf.val.isSpeechSynthesisSupported || !Conf.val.useSpeechSynthesis || Conf.val.muted) return;

		// TODO: should we queue up the messages?
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
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
						.replace(/{#2}/g, fixCulpritName(culprit));

		if (Conf.val.useVisualAlerts)
			$rootScope.$broadcast('visual-alert', message);
		speak(message);
	}

	return {
		announceLunch: announceLunch,
		announceBrokenBuild: announceBrokenBuild
	};
});
