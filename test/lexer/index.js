var Lexer    = require( '../../src/lexer' ),
    Compiler = require( '../../src/compiler' )

var code = `
    <!DOCTYPE html>
    <html>
        <head>
            <title><%= this.title %></title>
        </head>
        <body>
        <%# abc.html %>
        </body>
    </html>
`

//console.log( Lexer.lex( code ) )
console.log( Compiler.compile( code ) )
