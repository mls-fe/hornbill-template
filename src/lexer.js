'use strict'
/* token type */
const
    OFFSET_OF_TOKEN       = 2,
    TOKEN_BEGIN           = '<%',
    TOKEN_END             = '%>',
    TOKEN_FINISHED        = -1,
    TOKEN_HTML            = 'html',
    TOKEN_VALUE           = '=',
    TOKEN_ESCAPE          = '==',
    TOKEN_JS              = 'js',
    TOKEN_COMMENT         = '*',
    TOKEN_IMPORT          = '#',
    TOKEN_DIR             = '@',
    TOKEN_DIR_EXTENDS     = 'extends',
    TOKEN_DIR_BLOCK       = 'block',
    TOKEN_DIR_FOR         = 'for',
    TOKEN_DIR_IF          = 'if',
    TOKEN_DIR_EXTENDS_END = 'endextends',
    TOKEN_DIR_BLOCK_END   = 'endblock',
    TOKEN_DIR_FOR_END     = 'endfor',
    TOKEN_DIR_IF_END      = 'endif',
    PARENTHESIS_LEFT      = '(',
    BRACE_LEFT            = '{'

let directives = [ {
    name: TOKEN_DIR_BLOCK
}, {
    name: TOKEN_DIR_EXTENDS
}, {
    name: TOKEN_DIR_FOR
}, {
    name: TOKEN_DIR_IF
}, {
    name : TOKEN_DIR_BLOCK_END,
    isEnd: true
}, {
    name : TOKEN_DIR_EXTENDS_END,
    isEnd: true
}, {
    name : TOKEN_DIR_FOR_END,
    isEnd: true
}, {
    name : TOKEN_DIR_IF_END,
    isEnd: true
} ]

function tokenHelper( type, offset ) {
    let start = this._pos + OFFSET_OF_TOKEN + ( offset || 0 ),
        end   = this._source.indexOf( TOKEN_END, start )

    this._pos = end + OFFSET_OF_TOKEN

    return {
        type,
        value: this._source.substring( start, end )
    }
}

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
        let token
        /* eslint-disable */
        if ( token = this.consumeHTML() ) {
            this._tokens.push( token )
        }
        /* eslint-enable */

        if ( this._pos >= this._len ) {
            return {
                type: TOKEN_FINISHED
            }
        }

        //must begin with "<%", so offset is 2
        let start       = this._pos + OFFSET_OF_TOKEN,
            specialChar = this._source[ start ]

        switch ( specialChar ) {
        case TOKEN_VALUE:
            if ( this._source[ start + 1 ] === TOKEN_VALUE ) {
                token = this.consumeEscape()
                break
            }
            token = this.consumeValue()
            break

        case TOKEN_COMMENT:
            token = this.consumeComment()
            break

        case TOKEN_IMPORT:
            token = this.consumeImport()
            break

        case TOKEN_DIR:
            token = this.consumeDirective()
            break

        default:
            token = this.consumeJS()
            break
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

    peek( offset ) {
        let start = this._pos + OFFSET_OF_TOKEN + offset,
            end   = this._source.indexOf( TOKEN_END, start )

        return this._source.substring( start, end )
    }

    getDirective() {
        let fragments = this.peek( 1 ).trim()

        return fragments && directives.filter(
                ( directive ) => {
                    let isDirective = false

                    if ( directive.isEnd ) {
                        isDirective = directive.name === fragments
                        //TODO: check if code contains { or (
                    } else if ( fragments.indexOf( directive.name + ' ' ) === 0 &&
                        fragments.indexOf( PARENTHESIS_LEFT ) === -1 &&
                        fragments.indexOf( BRACE_LEFT ) === -1 ) {
                        isDirective = true
                    }

                    return isDirective
                } )
    }

    consumeHTML() {
        let start = this._pos,
            end   = 0,
            pos   = this._source.indexOf( TOKEN_BEGIN, start )

        if ( start === this._len ) {
            return
        }

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

    consumeJS() {
        return tokenHelper.call( this, TOKEN_JS, 0 )
    }

    consumeValue() {
        return tokenHelper.call( this, TOKEN_VALUE, 1 )
    }

    consumeEscape() {
        return tokenHelper.call( this, TOKEN_ESCAPE, 2 )
    }

    consumeComment() {
        return tokenHelper.call( this, TOKEN_COMMENT, 1 )
    }

    consumeImport() {
        return tokenHelper.call( this, TOKEN_IMPORT, 1 )
    }

    consumeDirective() {
        let dir

        if ( ( dir = this.getDirective() ) && dir.length > 0 ) {
            return tokenHelper.call( this, dir[ 0 ].name, 1 )
        } else {
            return null
        }
    }
}

module.exports = {
    lex( source ) {
        return ( new Tokenizer( source ) ).run()
    },

    TOKEN_BEGIN,
    TOKEN_END,
    TOKEN_FINISHED,
    TOKEN_HTML,
    TOKEN_VALUE,
    TOKEN_ESCAPE,
    TOKEN_JS,
    TOKEN_COMMENT,
    TOKEN_IMPORT,
    TOKEN_DIR,
    TOKEN_DIR_FOR,
    TOKEN_DIR_IF,
    TOKEN_DIR_EXTENDS,
    TOKEN_DIR_BLOCK,
    TOKEN_DIR_FOR_END,
    TOKEN_DIR_IF_END,
    TOKEN_DIR_EXTENDS_END,
    TOKEN_DIR_BLOCK_END
}
