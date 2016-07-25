var Lexer    = require( '../../src/lexer' ),
    Compiler = require( '../../src/compiler' )

var code  = `
    <!DOCTYPE html>
    <html>
        <head>
            <title><%= this.title %></title>
        </head>
        <body>
        <%# abc.html %>
        <% block title %>
        <div class="title-area">
        </div>
        <% endblock %>
        
        <% if ( this.is.not.a.directive ) {%>
        <p>Not directive<p>
        <% } %>
        </body>
    </html>
`,
    code1 = `
    <% extends "a.html" %>
    
    <% block title %>
            <div class="title-area">
            </div>
            <% endblock %>
`

console.log( Lexer.lex( code1 ) )
//console.log( Compiler.compile( code1 ) )
