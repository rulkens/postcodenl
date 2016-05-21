Simple Postcode Lookup for the Netherlands
==========================================

Disclaimer: this code uses the postcode.nl website and parses its contents.
Please only use it for personal use

Usage
-----

Install globally with npm

    npm install -g postcodenl
    
Then use it on your command line like so:

    postcode Kalverstraat 14 Amsterdam
    
It will return a nicely formatted string with the postcode and city name.

    1012PC in Amsterdam
    
That's it!

Todo
----

* Write some tests
* Add different sites to parse
* Perhaps just use a public API?


Requirements
------------

* Node 6.0.0 and higher (sorry, I'm lazy and want to use ES6)
