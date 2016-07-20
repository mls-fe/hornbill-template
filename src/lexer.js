'use strict'
/* token type */
const OFFSET_OF_TOKEN   = 2,
      TOKEN_BEGIN       = '<%',
      TOKEN_END         = '%>',
      TOKEN_FINISHED    = -1,
      TOKEN_HTML        = 'html',
      TOKEN_VALUE       = '=',
      TOKEN_ESCAPE      = '==',
      TOKEN_JS          = 'js',
      TOKEN_DIR         = '!',
      TOKEN_DIR_EXTENDS = 'extends',
      TOKEN_DIR_BLOCK   = 'block',
      TOKEN_DIR_IMPORT  = 'import',
      BLANK             = ''

class Tokenizer {
    constructor( source ) {
        this._source     = source
        this._pos        = 0
        this._len        = source.length
        this._isFinished = false
        this._tokens     = []
        this.quickTest()
    }

    quickTest() {
        if ( !this._len || this._source.indexOf( TOKEN_BEGIN ) === -1 ) {
            this._isFinished = true
            this._tokens     = [ {
                type : TOKEN_HTML,
                value: this._source
            }, {
                type: TOKEN_FINISHED
            } ]
        }
    }

    next() {
        if ( this._pos >= this._len ) {
            return {
                type: TOKEN_FINISHED
            }
        }

        let token

        if ( token = this.consumeHTML() ) {
            this._tokens.push( token )
        }

        //must begin with "<%", so offset is 2
        let start = this._pos + OFFSET_OF_TOKEN

        switch ( this._source[ start ] ) {
        case TOKEN_VALUE:
            if ( this._source[ start + 1 ] === TOKEN_VALUE ) {
                token = this.consumeEscape()
                break
            }
            token = this.consumeValue()
            break

        case TOKEN_DIR:
            token = this.consumeDirective()
            break

        case BLANK:
            token = this.consumeJS()
            break

        default:
            token = null
        }

        return token
    }

    run() {
        if ( this._isFinished ) {
            return this._tokens
        }

        let tokens = this._tokens,
            token

        while ( ( token = this.next() ) && token.type !== TOKEN_FINISHED ) {
            tokens.push( token )
        }

        this._isFinished = true
        return this._tokens
    }

    consumeHTML() {
        let start = this._pos,
            end   = 0,
            pos   = this._source.indexOf( TOKEN_BEGIN, start )

        if ( pos === -1 ) {
            end = this._len
        } else {
            if ( pos == 0 ) {
                return
            }
            end = pos
        }

        this._pos = end

        return {
            type : TOKEN_HTML,
            value: this._source.substring( start, end )
        }
    }

    consumeValue() {
        let start = this._pos + OFFSET_OF_TOKEN + 1,
            end   = this._source.indexOf( TOKEN_END, start )

        this._pos = end + OFFSET_OF_TOKEN

        return {
            type : TOKEN_VALUE,
            value: this._source.substring( start, end )
        }
    }

    consumeEscape() {
        let start = this._pos + OFFSET_OF_TOKEN + 2,
            end   = this._source.indexOf( TOKEN_END, start )

        this._pos = end + OFFSET_OF_TOKEN

        return {
            type : TOKEN_ESCAPE,
            value: this._source.substring( start, end )
        }
    }

    consumeJS() {
    }

    consumeDirective() {
    }
}

module.exports = {
    lex( source ) {
        return new Tokenizer( source )
    },

    TOKEN_BEGIN,
    TOKEN_END,
    TOKEN_FINISHED,
    TOKEN_HTML
}
