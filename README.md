The NEW Jenkins Dashboard
=========================

## Install it 

You will need some node/npm (brew, http://nodejs.org/, whatever) stuff installed. Then run:
* `npm install -g gulp`
* `npm install -g bower`
* `npm install`

Create a file named `auth.txt` in the root folder of the project with username and password to query jenkins, in the format `username:s0m3p4ssw0rd`.


## Run it
There's a server part and a client part. At the moment both are run through gulp with:
* `gulp`

.. and both gets rerun/refreshed if you change the sources (live reload, live development).


In order to run the server, you will need an `/auth.txt` file with valid user/pass for jenkins api (eg: "someuser:some1337password")