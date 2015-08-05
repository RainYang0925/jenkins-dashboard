The NEW Jenkins Dashboard
=========================

## Install it 

You will need some node/npm (brew, http://nodejs.org/, whatever) stuff installed. Then run:
* `npm install`

Create a file named `auth.txt` in the root folder of the project with username and password to query jenkins, in the format `username:s0m3p4ssw0rd`.


## Run it
There's a server part and a client part. At the moment both are run through gulp with:
* `gulp`

.. and both gets rerun/refreshed if you change the sources (live reload, live development).

If you want to use your local copy of the nodejs backend, you need to configure it in the frontend: 
run gulp, open localhost:4000 in the browser, click configure (or the cogwheel in the top left part 
of the window) and insert localhost:4001 as server address.

In order to run the server, you will need that `/auth.txt` file.

## Use it
An instance is deployed on https://jd.prezi.com/, you should use that one if you just want to see how your jobs are doing.

#### Hidden feature: list jobs running on machines with a given label
You need to manually enter the "label:labelName" in the view name URL part, eg: https://jd.prezi.com/label:jenkins_boxfish/runningTimestamp