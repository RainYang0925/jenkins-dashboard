angular.module('JenkinsDashboard')
.factory('Socket', function($rootScope, Conf, $timeout) {

	var s = io.connect("ws://" + Conf.val.address);

	return {
		on: function(ev, cb) {
			s.on(ev, cb);
		},
		emit: function(ev, data) {
			s.emit(ev, data);
		}
	};
});
