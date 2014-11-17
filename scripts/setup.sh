#!/bin/bash -e

# Example script that sets up the service's environment. #dev#build#tests#idoc

set -e

. $(dirname $0)/common



# TODO: Check if there's npm, if not install it

if [ -z `which npm` ]
	then
	echo "No npm found, installing it"
	curl https://www.npmjs.org/install.sh | sh
fi

npm install
