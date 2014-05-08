#!/bin/sh
#
# SupervisorD command/script that runs your service in the server. #cook#deploy#idoc
#
# Note: The service command shouldn't be a daemon process, thus it should run in the foreground.
# For more information you can look at (http://supervisord.org/subprocess.html#nondaemonizing-of-subprocesses)
#
# Using "exec" is needed so when supervisor restarts or stops your service it will stop your daemon process
# and not only the shell.

. virtualenv/bin/activate

# EDITME (after reading)

## you may want to use something like this:
# exec gunicorn --worker-class gevent --workers 4 --bind 127.0.0.1:8437 Jenkins Dashboard.wsgi:application
## or
# exec gunicorn --config /your/gunicorn/config/file.py
## in which case DO NOT include the "daemon" option in your config file,
## otherwise you will confuse supervisor and supervisor will confuse you when you try to deploy

exec python -m SimpleHTTPServer 8000