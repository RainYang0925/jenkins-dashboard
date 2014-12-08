angular.module('JenkinsDashboard')
.factory('Socket', function($rootScope, Conf, $timeout) {

	var proto = window.location.protocol === "http:" ? "ws://" : "wss://",
		s = io.connect(proto + Conf.val.address);

	return {
		on: function(ev, cb) {
			s.on(ev, cb);
		},
		emit: function(ev, data) {
			s.emit(ev, data);
		}
	};
});
