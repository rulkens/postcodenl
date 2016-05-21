var noodle = require('noodlejs'),
    _      = require('lodash'),
    colors = require('colors'),
    prompt = require('prompt');

module.exports = getFromPostcodeDotNl;

'use strict';

/**
 *
 * @param arguments - optimist arguments object
 */
function getFromPostcodeDotNl (args) {

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
    var address = (args._.length > 0) ? args._.join(' ') : Array();

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
        'url' : site + 'zoek/' + address,
        map   : {
            matches  : {
                selector : 'table.browse td',
            },
            postcode : {
                selector : 'h1 .range-subtitle'
            },
            pages    : {
                selector : 'ul.pagination li a',
                extract  : 'href'
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

        if (result.error) {
            console.log('geen adres gevonden'.red, 'voor', address.green);
        }

        //console.log('result.results', result.results);

        // check if we have a direct result:
        if (!result.results.postcode.error) {
            //console.log('found a direct postcode!', result.results.postcode);
            let [postcode, city] = result.results.postcode[0].split(','); // first match
            console.log(postcode.magenta, 'in', city.trim().green);

            return;
        }

        if (!result.results.pages.error) {

            // multiple pages!!

            // check if we have pages
            console.log('multiple pages found!'.cyan, result.results.pages);

            // TODO: combine all pages before we go on
        }

        // so we have multiple matches. Let's limit the results.
        /*
         TODO: actually implement this
         */

        // format 1 : [ postcode1, street1, numberrange1, city1, postcode2, ...]
        // divide it up by chunks, we have four columns on each row
        var matches = _.chunk(result.results.matches, 4);
        // Check for multiple cities and make the user select

        const INDEX_CITY     = 3,
              INDEX_STREET   = 1,
              INDEX_NUMBER   = 2,
              INDEX_POSTCODE = 0;

        var sameCity     = allItemsTheSame(matches, INDEX_CITY),
            sameStreet   = allItemsTheSame(matches, INDEX_STREET),
            sameNumber   = allItemsTheSame(matches, INDEX_NUMBER),
            samePostcode = allItemsTheSame(matches, INDEX_POSTCODE);

        // Check for multiple street names and let the user select

        // Check for multiple numbers and let the user select

        if (sameCity && sameStreet) {
            // only the number matters

            // at least show some feedback
            console.log('Meerdere adressen gevonden!'.yellow);
            matches.forEach(parseMatch);
            // let the user select
            prompt.message = 'Wat is het '.green;
            prompt.delimiter = '';
            prompt.colors = false;
            prompt.start();
            prompt.get(['huisnummer?'], (err, result) => {
                //also filter out the number, remove the extension
                // TODO: check if there are different
                let huisnummer = parseInt(result['huisnummer?']);
                //console.log('huisnummer', huisnummer);
                let filteredMatches = matches
                    .filter(match => withinRange(huisnummer, match[INDEX_NUMBER]))
                    .filter(match => matchParity(huisnummer, match[INDEX_NUMBER]));

                filteredMatches.forEach(parseMatch);

                if(filteredMatches.length === 0){
                    console.log('Geen resultaten gevonden!'.red);
                }
            });
        } else {
            matches.forEach(parseMatch);
        }


        function parseMatch (match) {
            //console.log('match', match);
            if (isPostcode(match[0])) {
                console.log(match[0].magenta, match[1].green, match[2].green, 'in', match[3].green);
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

    function allItemsTheSame (arr, index) {
        return arr
            .map(match => match[index])
            .every(match => match === arr[0][index]);
    }

    /**
     * check if a number is within a range. The range is in the format of a string 'low - high'
     * @param {String} number
     * @param {String} range
     * @returns {boolean}
     */
    function withinRange(number, range){
        // first parse range
        let [low, high] = range
            .split('-')
            .map(item => item.trim())
            .map(item => Number(item));

        return (Number(number) >= low) && (Number(number) <= high);
    }

    /**
     *
     * @param {String} number
     * @param {String} range
     * @returns {boolean}
     */
    function matchParity(number, range){
        let [low, high] = range
            .split('-')
            .map(item => item.trim())
            .map(item => Number(item));

        // expect low and high to be either even or odd

        return (Number(number) % 2) === (low % 2);

    }
}