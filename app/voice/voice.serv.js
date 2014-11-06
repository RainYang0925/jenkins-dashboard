angular.module('JenkinsDashboard')
.service('Voice', function(Conf) {

	function speak(message) {
		if (!Conf.val.isSpeechSynthesisSupported || !Conf.val.useSpeechSynthesis) return;

		// TODO: should we queue up the messages?
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
		console.log('### Reading out message:', message);

		// TODO: fire an alarm on end?
	}

	return {
		speak: speak
	};
});