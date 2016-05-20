var noodle = require('noodlejs'),
    _      = require('lodash'),
    colors = require('colors');

module.exports = get;

'use strict';

/**
 *
 * @param arguments - optimist arguments object
 */
function get (args) {

    const site = 'https://www.postcode.nl/';

    //console.log('args._', args._);

    if (!(args._.length) > 0
        && !args.a
        && !args.adres
        && !args.s
        && !args.stad) {
        // c'mon, we didn't get any input...

        //throw new Error('Geef een zoekstring op!');
        console.log('Geef een zoekstring op!'.red);
        process.exit();
    }

    // default argument is the lookup query
    var address = (args._.length > 0) ? args._.join(' ') :  Array();

    if (!args._.length > 0) {
        // perhaps we can form a more specific query

        // a voor adres
        if (args.a) {
            address.push(args.a);
        }

        // adres
        if (args.adres) {
            address.push(args.adres);
        }

        // s for stad
        if (args.s) {
            address.push(args.s);
        }

        if (args.stad) {
            address.push(args.stad);
        }


        // in the end, join with spaces
        address = address.join(' ');
    }

    noodle.configure({
        debug               : false,
        defaultDocumentType : "html"
    });

    var query = {
            'url'     : site + 'zoek/' + address,
            map : {
                matches : {
                    selector : 'table.browse td',
                },
                postcode : {
                    selector : 'h1 .range-subtitle'
                }
            }
            //"extract": "href",
        };

    noodle.query(query).then(function (response) {
        //console.log(response);
        //console.log(typeof results.results);

        //if(results.results && typeof results.result === 'object'){
        response
            .results
            .forEach(parseResult);
        //} else {
        //    console.log('no array??');
        //}

        noodle.stopCache();
    });

    /**
     * @param result
     */
    function parseResult (result, response) {

        if(result.error){
            console.log('geen adres gevonden'.red, 'voor', address.green);
        }

        //console.log('result.results', result.results);

        // check if we have a direct result:
        if(!result.results.postcode.error) {
            //console.log('found a direct postcode!', result.results.postcode);
            let [postcode, city] = result.results.postcode[0].split(','); // first match
            console.log(postcode.magenta, 'in', city.trim().green);
            return;
        }

        // format 1 : [ postcode1, street1, numberrange1, city1, postcode2, ...]
        // divide it up by chunks
        var matches = _.chunk(result.results.matches, 4);

        matches.forEach(parseMatch);

        function parseMatch(match) {
            //console.log('match', match);
            if (isPostcode(match[0])) {
                console.log(match[0].magenta + ' in ' + match[3].green);
            } else if(_.isNumber(Number(match[0]))){
                // slightly more complicated, follow the link and parse the result
                //console.log('isNumber', match[0]);
                noodle.query(makeLinkQuery(query)).then(function(result){
                    console.log('link result', result.results[0].results);
                })
            } else {
                console.log('no match for', match[0]);
            }
        }
    }

    /**
     * check if a string is a valid Dutch postcode
     * @param str
     * @returns Boolean
     */
    function isPostcode (str) {
        return str.match(/[0-9]{4} ?[a-zA-Z]{2}/) !== null;
    }

    function makeLinkQuery (query){
        // make the query a bit more specific
        return Object.assign({}, query, {
            selector: 'table.browse td a',
            extract : ['innerHTML', 'href']});
    }
}