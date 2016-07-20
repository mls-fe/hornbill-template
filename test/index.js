process.env.DEBUG = true

var fs       = require( 'fs' ),
    Template = require( '../src' )

Template.setOption( {
    compiledFolder: './tmp'
} )

function test() {
    fs.writeFileSync( 'result.html', Template.renderFile( './tmpls/test.html', 'pc', {
        name : 'test',
        time : new Date,
        items: [
            1, 2, 3, 4
        ]
    } ) )
}

test()
//console.log( Template.generateName( 'test.html', 'www' ) )
//
//console.time( 'first' )
//test()
//console.timeEnd( 'first' )
//
//console.time( 'second' )
//for ( var i = 0; i < 1000; i++ ) {
//    test()
//}
//
//console.timeEnd( 'second' )
