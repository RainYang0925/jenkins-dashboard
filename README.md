A better Jenkins Dashboard
=========================

<p align="center">
    <img src="https://dl.dropboxusercontent.com/u/769042/prezi/jd-1.gif">
    <img src="https://dl.dropboxusercontent.com/u/769042/prezi/jd-2.gif">
</p>

A simple client-server app to display in real time the status of your favourite jenkins jobs, get alerts when something
goes wrong or fancy animated gifs when everything is good.

### How does it work

The server app is a single caching point for every client, allowing for dozens of clients to get real time updates without
having to flood the jenkins API.

When a job is running, the server will make sure to poll jenkins about it not more than once every 2 seconds, sharing the
same result to all clients intersted. A view is updated, with the same mechanism, every 9 seconds. This means that you get to
know that a job started in less than 10 seconds, and of its completion in less than 2.

Besides the thing working pretty nicely, the whole project started as a weekend-garage-hackaton-project, so the code might not be
top notch! :P

### What does it show?

All of the jobs belonging to the configured views, sorted by name or last build time, or running first, broken second then everything
else.

If all of the jobs are green, the background will be green. If any of the jobs is either yellow or red (in jenkins terms), the background
will be red. FIX THEM!

If a job fails, you can receive a message telling you what is broken and who broke it. The dashboard can tell it to you with a configured
accent! Or show a message. Or both.

When everything is green, you will be able to enjoy your well deserved configured screen saver.


## Install it 

You will need some node/npm (brew, http://nodejs.org/, whatever) stuff installed. Then run:
* `npm install`

## Configure it

Create `jd.conf.json` (eg by copying the given -dist file), and configure:

- `jenkinsURL` the jenkins installation URL
- `serverURL` server part of the jenkins-dashboard, if run on localhost it's `localhost:4001`
- `jenkinsAuth` requires a path to a plain text file with `user:password` informations to authenticato to jenkins with basic auth
- `wsAuth` is the authentication for the websocket, atm only prezi's godauth is supported
- `debug` activates some output to check what the server part is doing, useful
- `useFixtures` makes the server part _not_ query jenkins at all, but instead provides some fixtures for the client parts. Useful for development
- `pronunciationTable` key-value pairs to have the vocal announcements speak better, or just different things

Create the configured auth file with username and password to query jenkins, in the format 
`username:s0m3p4ssw0rd`, if needed.

### Run it locally / develop
There's a server part and a client part. Both are run through gulp with:
* `gulp`

.. and both gets rerun/refreshed if you change the sources (live reload, live development).

## Deploy it
You just need to run the server part (`node server/server.js`), keeping it up (with supervisord, forever.. whatever)
and provide the HTML through apache or something. With apache you might want to use a `RewriteRule ^ index.html [L]`, to allow 
HTML5 deep links. Also you need to provide the same `jd.conf.json` to both parts.

### Hidden feature: list jobs running on machines with a given label
You need to manually enter the "label:labelName" in the view name URL part, eg: https://localhost:4000/label:jenkins_cool_label/runningTimestamp