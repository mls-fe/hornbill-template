var Template = require( '../src' )

Template.render( './tmpls/test.html', {
    time: 'jajaja'
}, ( data ) => {
    'use strict';
    console.log( data )
} )
