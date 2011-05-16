# sfpark.org

The intention of this project is to provide rewrite of the mapping functionality on sfpark.org.

## Setup

    git checkout git://github.com/opengeo/sfpark.org.git


## Debug Mode

Loads all scripts uncompressed.

    ant init
    ant debug

This will give you an application available at http://localhost:8080/ by
default.  You only need to run `ant init` once (or any time dependencies
change).

## Prepare App for Deployment

To create a servlet run the following:

    ant static-war

The servlet will be assembled in the build directory.
