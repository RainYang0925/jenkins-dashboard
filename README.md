The NEW Jenkins Dashboard
=========================

## Installation 

You will need some node/npm (brew, http://nodejs.org/, whatever) stuff installed:
* `npm install -g gulp`
* `npm install`


## Run it
There's a server part and a client part. At the moment both are run through gulp with:
* `gulp`

.. and both gets rerun/refreshed if you change the sources (live reload, live development).


In order to run the server, you will need an `/auth.txt` file with valid user/pass for jenkins api (eg: "someuser:some1337password")