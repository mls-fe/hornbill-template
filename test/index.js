process.env.DEBUG = true

var fs       = require( 'fs' ),
    Template = require( '../src' )

var templateEngine = Template( {
    fuss: true
} )

function test() {
    templateEngine.render( './tmpls/test.html', {
        name : 'test',
        time : new Date,
        items: [
            1, 2, 3, 4
        ]
    }, ( data ) => {
        fs.writeFileSync( 'result.html', data )
    } )

    templateEngine.preCompile( './tmpls/test.html', {
        dest: __dirname + '/tmp'
    } )
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
