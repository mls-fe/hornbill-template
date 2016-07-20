var Lexer = require( '../../src/lexer' )

var lexer = Lexer.lex( `
    <!DOCTYPE html>
    <html>
        <head>
            <title><%= this.title %></title>
        </head>
        <body>
        </body>
    </html>
` )

//console.log( lexer.next() )
console.log( lexer.run() )
