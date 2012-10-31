#!/bin/bash

function testFailure {
    if [ $? != 0 ]; then
        exit 1;
    fi
}

./node_modules/.bin/grunt $@
testFailure

phantomjs run-phantomjs-tests.js