'use strict'
let Lexer = require( './lexer' )

const EXT_OBJECT = '__ext',
      SPLITTER   = ';\n'

class Compiler {
    constructor( source ) {
        this._tokens = Lexer.lex( source )
        this._codes  = []
    }

    run() {
        let tokens = this._tokens,
            token

        while ( tokens.length ) {
            token = tokens.shift()

            switch ( token.type ) {
            case Lexer.TOKEN_HTML:
                this.emit( `\`${ token.value }\`` )
                break

            case Lexer.TOKEN_VALUE:
                this.emit( `${ token.value }` )
                break

            case Lexer.TOKEN_ESCAPE:
                this.emit( `${ EXT_OBJECT }.htmlEncode(\`${ token.value }\`)` )
                break

            case Lexer.TOKEN_JS:
                this.emit( `${ token.value }`, true )
                break

            case Lexer.TOKEN_IMPORT:
                this.emit( `${ EXT_OBJECT }.import( '${ token.value }')` )
                break
            }
        }

        return this._codes.join( SPLITTER )
    }

    emit( fragment, notConcat ) {
        let code = notConcat ? fragment : `__html += ${ fragment }`
        this._codes.push( code )
    }
}

module.exports = {
    compile( source ) {
        return ( new Compiler( source ) ).run()
    }
}
