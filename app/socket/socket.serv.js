angular.module('JenkinsDashboard')
.service('Socket', function($rootScope, Conf, $timeout) {

	var s;
	subscribeListeners();

	function connect() {
		s = io.connect("ws://" + Conf.val.address);
		subscribeListeners();
	}
	$timeout(connect);

	var listeners = {};
	function subscribeListeners() {
		for (ev in listeners) {
			for (var l=listeners[ev].length; l--;) {
				s.on(ev, (function(cb) {
					return function() {
						var args = arguments;
						$rootScope.$apply(function() {
							cb.apply(s, args);
						});
					};
				})(listeners[ev][l]))
			}
		}
	}

	return {
		connect: connect,
		on: function(ev, cb) {
			if (ev in listeners) {
				listeners[ev].push(cb);
			} else {
				listeners[ev] = [cb];
			}
		},
		emit: function(eventName, data, cb) {
			s.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if (cb) {
						cb.apply(s, args);
					}
				});
			})
		}
	};
});
