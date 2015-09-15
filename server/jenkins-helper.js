var Q = require('q'),
	NodeCache = require('node-cache'),
	https = require('https'),
	fixtures = require('./fixtures'),
	jh = {};

https.globalAgent.maxSockets = Infinity;

module.exports = jh;

// If a jenkins request does not reply under this time (and we are queueing them up), force a refresh
var FORCE_REFRESH_MS = 20 * 1000;

jh.log = log = function() {
	if (!jh.debug) return;

	var pad = function(n) { return ('0' + n).slice(-2); },
		date = new Date(),
		dateString = pad(date.getHours()) +':'+ pad(date.getMinutes()) +':'+ pad(date.getSeconds());
	console.log.apply(this, [dateString].concat(Array.prototype.slice.apply(arguments)));
}

jh.cache = new NodeCache({ stdTTL: 120 });
jh.debug = true;

jh.setCredentials = function(data) { 
	this.authBase64 = 'Basic ' + (new Buffer(data).toString('base64'));
}
jh.setURL = function(url) {
	this.url = url;
	log('Using jenkins api from '+ url);
}
jh.setPORT = function(port) {
	this.port = port;
	log('Using jenkins api on port ' + port);
}
jh.setDebug = function(v) { this.debug = v; }
jh.setUseFixtures = function(v) {
	if (v) log('Not making any http call to jenkins: using fixtures');
	this.useFixtures = v; 
}

jh.get = function(path) {
	var def = Q.defer(),
		results = '',
		options = {
			host: this.url,
			port: this.port,
			secureProtocol: 'SSLv3_method',
			path: (path).replace(/\s/g,"%20"),
			timeout: FORCE_REFRESH_MS
		};
		
	if (typeof(this.authBase64) !== 'undefined') {
		options.headers = { 'Authorization': this.authBase64 };
	}

	// Use the fixtures? No jenkins requests at all.
	if (this.useFixtures) {

		// Finished = true -> no building job, 
		// seconds > 30 -> every 30s it switches from building to finished
		var finished = (new Date()).getSeconds() > 30;

		if (path.match(/^\/view/) !== null) {
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


	log('# https req ' + path);
	var timeStart = (new Date()).getTime();
	var req = https.get(options, function(res) {
		var duration = (new Date()).getTime() - timeStart;
		log("# https resp " + duration + "ms " + res.statusCode + " " + path);

		if (res.statusCode === 401) {
			console.log("#### Got a 401 from jenkins, check your credentials");
		}

		res.on("data", function(body) {
			if (res.statusCode === 200) {
				results += body.toString();
			}
		});

		res.on("end", function() {
			if (res.statusCode === 200) {
				def.resolve(results);
			} else {
				log("@@@ Error: jenkins replied with status code: "+ res.statusCode);
				def.reject();
			}
		});
	});

	req.on("error", function(e) {
		log("@@@ Error: Https.get: " + e.message);
		var duration = (new Date()).getTime() - timeStart;
		log("# https error " + duration + "ms " + path + " " + e);
		def.reject(e);
	});

	req.end();

	return def.promise;
}


var ttlForPath = {},
	isRequesting = {},
	queuedPromisesForPath = {},
	queuedIdsForPath = {},
	firstQueuedPromiseForPath = {};

function handleAllPromises(path, action, response) {
	var ids = [];
	for (var i in queuedIdsForPath[path])
		ids.push(i);

	if (path in queuedPromisesForPath) {
		log('!! '+ action +': '+ queuedPromisesForPath[path].length +' queued promises', path, ids.join('::'));
		for (var l = queuedPromisesForPath[path].length; l--;) {
			queuedPromisesForPath[path][l][action](response);
		}
		delete queuedPromisesForPath[path];
		delete firstQueuedPromiseForPath[path];
		delete queuedIdsForPath[path];
	}
}


function cachedApi(pathConstructor, ttl, force) {

	return function(id) {
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
		if (isRequesting[path] && path in firstQueuedPromiseForPath && timeNow - firstQueuedPromiseForPath[path] > FORCE_REFRESH_MS) {
			log('!!!!!! Resetting ' + path, timeNow - firstQueuedPromiseForPath[path]);
			isRequesting[path] = false;
			delete queuedPromisesForPath[path];
			delete firstQueuedPromiseForPath[path];
			delete queuedIdsForPath[path];
		}

		if (typeof(cached) !== "undefined" && Object.keys(cached).length > 0) {
			def.resolve(cached);

		} else if (isRequesting[path]) {

			if (id in queuedIdsForPath[path]) {
				log('+++ Skipping queue for', path, id);
			} else {
				queuedPromisesForPath[path].push(def);
				queuedIdsForPath[path][id] = true;
				log('+++ Queued '+ queuedPromisesForPath[path].length, path, timeNow - firstQueuedPromiseForPath[path], id);
			}

		} else {

			queuedPromisesForPath[path] = [def];
			firstQueuedPromiseForPath[path] = timeNow;
			queuedIdsForPath[path] = {};
			queuedIdsForPath[path][id] = true;

			isRequesting[path] = true;
			jh.get(path).then(function(data) {
				isRequesting[path] = false;

				var res;
				try {
					res = JSON.parse(data);
				} catch(e) {
					log('########### ERROR: Json too big?!?!? ', path, data.length, e);
					handleAllPromises(path, 'reject', 'Unable to parse '+data.length);
					return;
				}

				ttlForPath[path] = ttl;
				jh.cache.set(path, res, ttl);
				handleAllPromises(path, 'resolve', res);

			}, function(error) {
				isRequesting[path] = false;
				handleAllPromises(path, 'reject', error);
			});
		}
		return def.promise;
	}
}

jh.updateAllJobs   = cachedApi('/api/json', 1800);
jh.updateView      = cachedApi(function(id, name) { return '/view/'+ name +'/api/json';}, 8);

jh.updateLabel     = cachedApi(function(id, name) { return '/label/'+ name +'/api/json';}, 8);

jh.updateJob       = cachedApi(function(id, name) { return '/job/'+ name +'/api/json'; }, 3600);
jh.updateJobFast   = cachedApi(function(id, name) { return '/job/'+ name +'/api/json'; }, 2, true);

jh.updateBuild     = cachedApi(function(id, name, buildNumber) { return '/job/'+ name +'/'+ buildNumber +'/api/json'}, 3600);
jh.updateBuildFast = cachedApi(function(id, name, buildNumber) { return '/job/'+ name +'/'+ buildNumber +'/api/json'}, 2, true);
