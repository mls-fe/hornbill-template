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

test( 'parse basic tag', ( t ) => {
    let html1 = '<% 1 %>',
        html2 = '<%= 1 %>'

    t.deepEqual( Lexer.lex( html1 ), [ {
        type : Lexer.TOKEN_JS,
        value: ' 1 '
    } ] )

    t.deepEqual( Lexer.lex( html2 ), [ {
        type : Lexer.TOKEN_VALUE,
        value: ' 1 '
    } ] )
} )
