var Q = require('q'),
	NodeCache = require('node-cache'),
	jh = {},
	https = require('https'),
	separator = "\n###############################################################\n",
	fixtures = require('./fixtures');

jh.log = log = function() {
	if (!jh.debug) return;

	var pad = function(n) { return ('0' + n).slice(-2); },
		date = new Date(),
		dateString = pad(date.getHours()) +':'+ pad(date.getMinutes()) +':'+ pad(date.getSeconds());
	console.log.apply(this, ['###', dateString].concat(Array.prototype.slice.apply(arguments)));
}

module.exports = jh;

// If a jenkins request does not reply under this time (and we are queueing them up), force a refresh
var FORCE_REFRESH_MS = 2 * 60 * 1000;

var DEFAULT_TTL = 120;
jh.cache = new NodeCache({ stdTTL: DEFAULT_TTL });


jh.setCredentials = function(data) { this.credentials = data; }
jh.debug = false;
jh.setDebug = function(v) { this.debug = v; }

jh.get = function(path) {
	var def = Q.defer(),
		results = '',
		options = {
			host: 'jenkins.prezi.com',
			secureProtocol: 'SSLv3_method',
			path: (path).replace(/\s/g,"%20"),
			headers: {'Authorization': 'Basic ' + (new Buffer(this.credentials).toString('base64'))}
		};


	// Use the fixtures? No jenkins requests at all.
	if (false) {

		// Finished = true -> no building job, 
		// seconds > 30 -> every 30s it switches from building to finished
		var finished = true; // (new Date()).getSeconds() > 30;

		if (path === "/view/Boxfish-Koi/api/json") {
			log("@@@@ VIEW fixture - finished", finished);
			if (finished)
				def.resolve(JSON.stringify(fixtures['view-short']));
			else
				def.resolve(JSON.stringify(fixtures['building-view-short']));
		}

		if (path === "/job/igor-test/api/json") {
			log('@@@@ igor job fixture - finished', finished);
			if (finished)
				def.resolve(JSON.stringify(fixtures['igor-job']));
			else
				def.resolve(JSON.stringify(fixtures['building-igor-job']));
		}

		if (path === "/job/igor-test/1004/api/json") {
			log('@@@@ igor build fixture - finished', finished);
			if (finished) 
				def.resolve(JSON.stringify(fixtures['build']));
			else {
				var build = fixtures['building-build'],
					date = new Date();
				date.setSeconds(0);

				build.timestamp = date.getTime()
				build.estimatedDuration = 45000;

				def.resolve(JSON.stringify(build));
			}

		}

		if (path === "/job/boxfish-koi-widgets/api/json") {
			log('@@@@ widgets job fixture');
			def.resolve(JSON.stringify(fixtures['widgets-job']));

		}

		if (path === "/job/boxfish-koi-widgets/92/api/json") {
			log('@@@@ widgets build fixture', finished);
			def.resolve(JSON.stringify(fixtures['widgets-build']));

		}

		return def.promise;
	}


	log('### Fetching from jenkins: ' + path);
	var req = https.get(options, function(res) {
		if (res.statusCode === 401) {
			console.log(separator, 'Got a 401 from jenkins, check your credentials', separator);
		} else if (res.statusCode === 200) {
			res.on("data", function(body) {
				results += body.toString();
			});
			res.on("end", function() {
				def.resolve(results);
			});
		} else {
			log("@@@ Jenkins replied with status code: "+ res.statusCode);
			def.reject();
		}
	});

	req.end();

	req.on("error", function(e) {
		log("## Https.get error: " + e.message);
		def.reject(e);
	});

	return def.promise;
}


var ttlForPath = {},
	isRequesting = {},
	queuedPromisesForPath = {},
	firstQueuedPromiseForPath = {};

function cachedApi(pathConstructor, ttl, force) {

	return function() {
		var def = Q.defer(),
			path = pathConstructor,
			cached,
			timeNow = (new Date()).getTime();

		if (typeof(pathConstructor) === "function") {
			path = pathConstructor.apply(this, arguments);
		}
		
		// If this call is on a different ttl, and force is true, change the ttl
		if (force && ttl !== ttlForPath[path]) {
			cached = {};
		} else {
			cached = jh.cache.get(path);
		}

		// If we are waiting for this call for more than FORCE_REFRESH_MS, just do the call again
		if (isRequesting[path] && timeNow - firstQueuedPromiseForPath[path] > FORCE_REFRESH_MS) {
			log('!!!!!! Resetting ' + path, timeNow - firstQueuedPromiseForPath[path]);

			isRequesting[path] = false;
			delete queuedPromisesForPath[path];
			delete firstQueuedPromiseForPath[path];
		}


		if ((path in cached)) {
			def.resolve(cached[path]);
		} else if (isRequesting[path]) {
			if (path in queuedPromisesForPath) {
				queuedPromisesForPath[path].push(def);
			} else {
				queuedPromisesForPath[path] = [def];
				firstQueuedPromiseForPath[path] = timeNow;
			}
			log('!! Queued '+ queuedPromisesForPath[path].length, path, timeNow - firstQueuedPromiseForPath[path]);

		} else {

			isRequesting[path] = true;
			jh.get(path).then(function(data) {
				isRequesting[path] = false;

				var res;
				try {
					res = JSON.parse(data);
				} catch(e) {
					def.reject('Unable to parse '+ data);
					log('########### ERROR: Json too big?!?!? ', path, data.length, e);
				}

				ttlForPath[path] = ttl;
				jh.cache.set(path, res, ttl);

				def.resolve(res);
				if (path in queuedPromisesForPath) {
					log('!! Resolving '+ queuedPromisesForPath[path].length +' queued promises', path);
					for (var l = queuedPromisesForPath[path].length; l--;) {
						queuedPromisesForPath[path][l].resolve(res);
					}
					delete queuedPromisesForPath[path];
					delete firstQueuedPromiseForPath[path];
				}

			}, function(error) {
				isRequesting[path] = false;
				def.reject(error);
				if (path in queuedPromisesForPath) {
					log('!! Rejecting '+ queuedPromisesForPath[path].length +' queued promises', path);
					for (var l = queuedPromisesForPath[path].length; l--;) {
						queuedPromisesForPath[path][l].reject(error);
					}
					delete queuedPromisesForPath[path];
					delete firstQueuedPromiseForPath[path];
				}
			});
		}
		return def.promise;
	}
}

jh.updateAllJobs   = cachedApi('/api/json', 360);
jh.updateView      = cachedApi(function(name) { return '/view/'+ name +'/api/json';}, 8);

jh.updateJob       = cachedApi(function(name) { return '/job/'+ name +'/api/json'; }, 3600);
jh.updateJobFast   = cachedApi(function(name) { return '/job/'+ name +'/api/json'; }, 2, true);

jh.updateBuild     = cachedApi(function(name, buildNumber) { return '/job/'+ name +'/'+ buildNumber +'/api/json'}, 3600);
jh.updateBuildFast = cachedApi(function(name, buildNumber) { return '/job/'+ name +'/'+ buildNumber +'/api/json'}, 2, true);
