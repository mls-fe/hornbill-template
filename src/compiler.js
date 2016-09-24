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
    EXT_OBJECT  = '__ext',
    HTML_BOJECT = '__html',
    SPLITTER    = ';\n'

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

                this._codes.push( notConcat ? fragment : `${ HTML_BOJECT } += ${ fragment }` )
            }
        } else {
            this.emit = ( fragment, notConcat ) => {
                this._codes.push( notConcat ? fragment : `${ HTML_BOJECT } += ${ fragment }` )
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

        return this
    }

    getCode() {
        let codeBlock  = this._codes.join( SPLITTER ),
            sourceCode = `
'use strict'
let ${ EXT_OBJECT } = this.${ EXT_OBJECT },
    coreFn = function() {
        let ${ HTML_BOJECT } = ''
        ${ codeBlock }
        return ${ HTML_BOJECT }
    },
    resultFn = function() {
        try {
            return coreFn.call( this )
        } catch( e ) {
            console.error( e )
            return
        } 
    }

return resultFn.call( this )
`
        return sourceCode
    }
}

module.exports = {
    compile( source, config ) {
        let compiler = new Compiler( source, config )
        return compiler
            .run()
            .getCode()
    }
}
