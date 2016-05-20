var noodle = require('noodlejs'),
    argv   = require('optimist').argv,
    _      = require('lodash');

// default argument is the lookup query
var address = argv._ || Array();

if (!argv._) {
    // perhaps we can form a more specific query

    // a voor adres
    if (argv.a) {
        address.push(argv.a);
    }

    // adres
    if (argv.adres) {
        address.push(argv.adres);
    }

    // s for stad
    if (argv.s) {
        address.push(argv.s);
    }

    if (argv.stad) {
        address.push(argv.stad);
    }


    // in the end, join with spaces
    address = address.join(' ');
}

noodle.configure({
    debug: false,
    defaultDocumentType: "html"
});

var queries = [
    {
        "url"      : "https://www.postcode.nl/zoek/" + address,
        "selector" : "table.browse td",
        //"extract": "href",
    }
];

noodle.query(queries).then(function (response) {
    //console.log(response);
    //console.log(typeof results.results);

    //if(results.results && typeof results.result === 'object'){
    response.results.forEach(parseResult);
    //} else {
    //    console.log('no array??');
    //}

    noodle.stopCache();
});

/**
 * @param result
 */
function parseResult(result){

    // format 1 : [ postcode1, street1, numberrange1, city1, postcode2, ...]
    // divide it up by chunks
    var matches = _.chunk(result.results, 4);

    matches.forEach(match => {
        console.log('match', match);
        if(isPostcode(match[0])){
            console.log(match[0] + ' in ' + match[3]);
        }
    });
}

/**
 * check if a string is a valid Dutch postcode
 * @param str
 * @returns Boolean
 */
function isPostcode (str){
    return str.match(/[0-9]{4} ?[a-zA-Z]{2}/) !== null;
}