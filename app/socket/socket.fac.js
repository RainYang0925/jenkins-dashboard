angular.module('JenkinsDashboard')
.factory('Socket', function($rootScope, Conf, $timeout) {
	var proto = window.location.protocol === "http:" ? "ws://" : "wss://",
		cbs = [],
		s;

	$rootScope.$on('server-url-ready', function() {
		s = io.connect(proto + Conf.val.address);
		registerCbs();
	});

	function registerCbs() {
		for (var l = cbs.length; l--;) {
			s.on(cbs[l].ev, cbs[l].cb);
		}
	}

	return {
		on: function(ev, cb) {
			cbs.push({ ev: ev, cb: cb });
		},
		emit: function(ev, data) {
			s.emit(ev, data);
		}
	};
});
