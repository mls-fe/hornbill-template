import test from 'ava'
import Lexer from '../../src/lexer'

test( 'pure html', ( t ) => {
    let html = '<html></html>'
    t.deepEqual( Lexer.lex( html ),
        [ {
            type : Lexer.TOKEN_HTML,
            value: html
        }, {
            type: Lexer.TOKEN_FINISHED
        } ] )
} )
