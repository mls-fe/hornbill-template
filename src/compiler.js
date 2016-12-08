'use strict'
let Lexer            = require( './lexer' ),
    Util             = require( './util' ),
    defaultConfig    = {
        fuss: false
    },
    rblank           = /^`?\s*`?$/,
    rfor             = /^for\s+(.+?)\s+in\s+(.+)$/,
    rif              = /^if\s+(.+)$/,

    stripCode        = Util.stripCode,
    generateValCheck = Util.generateValCheck,
    wrapValue        = Util.wrapValue

const
    EXT_OBJECT  = '__ext',
    HTML_OBJECT = '__html',
    TE_OBJECT   = '__template_engine',
    PATH_OBJECT = '__path',
    DIR_OBJECT  = '__dirname',
    SPLITTER    = '\n'

class Compiler {
    constructor( source, config ) {
        this._tokens = Lexer.lex( source )
        this._codes  = []
        this._config = Object.assign( {}, defaultConfig, config )

        if ( this._config.fuss ) {
            this.emit = ( fragment, notConcat, notFuss ) => {
                if ( !notFuss ) {
                    fragment = stripCode( fragment )

                    if ( rblank.test( fragment ) ) {
                        return
                    }
                }

                this._codes.push( notConcat ? fragment : `${ HTML_OBJECT } += ${ fragment }` )
            }
        } else {
            this.emit = ( fragment, notConcat ) => {
                this._codes.push( notConcat ? fragment : `${ HTML_OBJECT } += ${ fragment }` )
            }
        }
    }

    //TODO
    parseForDirective( token ) {
        let value = token.value.trim(),
            match = value.match( rfor )

        /**
         * match: value, key, expr
         * for key, value in obj
         * for value in array
         */
        if ( match && match.length === 3 ) {
            let keyAndVal = match[ 1 ].split( ',' ),
                key, val

            if ( keyAndVal.length > 1 ) {
                key = keyAndVal[ 0 ]
                val = keyAndVal[ 1 ]
            } else {
                key = '_'
                val = keyAndVal[ 0 ]
            }

            this.emit( `${ EXT_OBJECT }.each( ${ generateValCheck( match[ 2 ] ) }, ( ${ val }, ${ key } ) => {`, true )
        } else {
            throw Error( `parse 'for' error: \n ${ value }` )
        }
    }

    //TODO
    parseIfDirective( token ) {
        let value = token.value.trim(),
            match = value.match( rif )

        if ( match && match[ 1 ] ) {
            this.emit( `if ( ${ generateValCheck( match[ 1 ] ) } ) {`, true )
        } else {
            throw Error( `parse 'if' error: \n ${ value }` )
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
                this.emit( `${ token.value }`, true, true )
                break

            case Lexer.TOKEN_IMPORT:
                this.emit( `;( new ${ TE_OBJECT } ).render( ${ PATH_OBJECT }.resolve( ${ DIR_OBJECT }, ${ wrapValue( token.value ) } ), this, ( data ) => {`, true )
                this.emit( 'data' )
                this.emit( '} )', true )
                break

            case Lexer.TOKEN_DIR_FOR:
                this.parseForDirective( token )
                break

            case Lexer.TOKEN_DIR_IF:
                this.parseIfDirective( token )
                break

            case Lexer.TOKEN_DIR_FOR_END:
                this.emit( '})', true )
                break

            case Lexer.TOKEN_DIR_IF_END:
                this.emit( '}', true )
                break
            }
        }

        return this
    }

    getCode() {
        let codeBlock  = this._codes.join( SPLITTER ),
            sourceCode = `function _hornbillGeneratedFn(helper) {
'use strict'
let ${ EXT_OBJECT }  = helper.${ EXT_OBJECT },
    ${ TE_OBJECT }   = helper.${ TE_OBJECT },
    ${ PATH_OBJECT } = helper.${ PATH_OBJECT },
    ${ DIR_OBJECT }  = helper.${ DIR_OBJECT },
    coreFn = function() {
        let ${ HTML_OBJECT } = ''
        ${ codeBlock }
        return ${ HTML_OBJECT }
    },
    resultFn = ( data ) => {
        try {
            return coreFn.call( data )
        } catch( e ) {
            console.error( e )
            return null
        } 
    }
return resultFn
}
`
        return sourceCode
    }
}

module.exports = {
    compile( source, config ) {
        if ( !source ) {
            throw Error( 'Please provide source code!' )
        }

        let compiler = new Compiler( source, config )
        return compiler
            .run()
            .getCode()
    },

    EXT_OBJECT : EXT_OBJECT,
    TE_OBJECT  : TE_OBJECT,
    PATH_OBJECT: PATH_OBJECT,
    DIR_OBJECT : DIR_OBJECT
}
