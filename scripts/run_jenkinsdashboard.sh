#!/bin/sh

# exec node /opt/prezi/jenkinsdashboard/current/node_modules/gulp/bin/gulp.js

cd node /opt/prezi/jenkinsdashboard/current/
exec node node_modules/forever/bin/forever start server/server.js