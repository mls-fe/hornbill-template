'use strict'
let Lexer         = require( './lexer' ),
    defaultConfig = {
        fuss: false
    },
    normalSpace   = '  ',
    rmorespace    = /\s{2,}/g,
    rblank        = /^`?\s*`?$/,
    stripCode     = ( code ) => {
        return code.replace( rmorespace, normalSpace ).trim()
    }

const
    EXT_OBJECT = '__ext',
    SPLITTER   = ';\n'

class Compiler {
    constructor( source, config ) {
        this._tokens = Lexer.lex( source )
        this._codes  = []
        this._config = Object.assign( {}, defaultConfig, config )

        if ( this._config.fuss ) {
            this.emit = ( fragment, notConcat ) => {
                fragment = stripCode( fragment )

                if ( rblank.test( fragment ) ) {
                    return
                }

                this._codes.push( notConcat ? fragment : `__html += ${ fragment }` )
            }
        } else {
            this.emit = ( fragment, notConcat ) => {
                this._codes.push( notConcat ? fragment : `__html += ${ fragment }` )
            }
        }
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
}

module.exports = {
    compile( source, config ) {
        return ( new Compiler( source, config ) ).run()
    }
}
