'use strict'

let Path                = require( 'path' ),
    FS                  = require( 'fs' ),
    Crypto              = require( 'crypto' ),
    Ext                 = require( './ext' ),
    Directives          = require( './directives' ),

    isSetted            = false,
    defaultOption       = {
        compiledFolder: './tmp'
    },
    globalOption        = defaultOption,
    setOption, compile, compileFile, renderFile,

    privateParam        = '__html',
    privateConcatStrExp = `;${ privateParam } +=`,
    codePrefix          = `'use strict';`,
    watchedFiles        = {},
    cachedFiles         = {},
    generatePath        = ( name, prefix ) => {
        return globalOption.compiledFolder + '/' + ( prefix || '' ) + Crypto.createHash( 'md5' ).update( name ).digest( 'hex' ) + '.est'
    },
    watchFile           = ( sourceFile, compiledFile ) => {
        if ( watchedFiles[ sourceFile ] ) {
            return
        }

        watchedFiles[ sourceFile ] = true

        FS.watch( sourceFile, ( err ) => {
            if ( err ) {
                return console.error( err )
            }

            delete require.cache[ compiledFile ]
            delete cachedFiles[ compiledFile ]
        } )
    },

    log                 = ( str ) => {
        console.log( `[ log ] ${ str }` )
    }

const
    BLANK    = '',
    EQUAL    = '=',
    ASTERISK = '*'

exports.compile = compile = ( source, sourcePath, prefix ) => {
    if ( !isSetted ) {
        setOption()
    }

    log( 'start compile' )

    let directive     = Directives( exports, sourcePath, prefix ),
        contentStr    = `
        var __html = '';
    `,

        /**
         *
         * @param str
         * @param isPlain 如果是普通文本, 追加到内部字符串拼接, 否则直接追加到 contentStr 上
         */
        concatContent = ( str, isPlain ) => {
            if ( !str ) return
            contentStr += isPlain ? `${ privateConcatStrExp } \`${ str }\`\n` : str
        },
        output        = ( str, start, end ) => {
            return typeof str === 'string' ? str.substring( start, end ) : str.toString( 'utf-8', start, end )
        },
        pos           = 0,
        tagStartPos   = 0,
        tagEndPos     = 0,
        tmp, contentLength

    contentLength = source.length

    //file does not exist or is empty
    if ( source ) {
        //@TODO: not finished
        while ( 1 ) {
            tagStartPos = source.indexOf( '<%', pos )

            if ( tagStartPos > -1 ) {
                tagEndPos = source.indexOf( '%>', pos + 2 )
            } else {
                //didn't contain any special tags
                concatContent( output( source, pos, contentLength ), true )
                break
            }

            concatContent( output( source, pos, tagStartPos ), true )

            let fragment = output( source, tagStartPos + 2, tagEndPos ).trim()

            switch ( fragment[ 0 ] ) {
            case EQUAL:
                if ( fragment[ 1 ] === EQUAL ) {
                    concatContent( `${ privateConcatStrExp } this.__ext.htmlEncode(' + ${ output( source, tagStartPos + 4, tagEndPos ) }')` )
                } else {
                    concatContent( privateConcatStrExp + output( source, tagStartPos + 3, tagEndPos ) )
                }
                break

            case ASTERISK:
                break

            default:
                if ( directive.hasDirective( fragment ) ) {
                    tmp = directive.parse( fragment, source, tagStartPos + 2, tagEndPos )
                    if ( tmp ) {
                        tmp.output && concatContent( privateConcatStrExp + tmp.output )
                        tagEndPos = tmp.nextPos
                    }
                    break
                }
                concatContent( fragment )
                break
            }

            pos = tagStartPos = tagEndPos + 2
        }
    }

    return {
        content: contentStr,
        blocks : directive._blocks,
        base   : directive._base
    }
}

exports.compileFile = compileFile = ( tmplFilePath, prefix ) => {
    if ( !isSetted ) {
        setOption()
    }

    log( 'start compile file' )

    tmplFilePath = Path.resolve( tmplFilePath )

    let source

    try {
        source = FS.readFileSync( tmplFilePath )
    } catch ( e ) {
        source = BLANK
    }

    let result = compile( source, tmplFilePath, prefix )

    return `${ codePrefix }
        /* source file path = ${ tmplFilePath } */
        ${ result.base ? 'exports.__base = require("' + result.base + '")' : '' }
        exports.__blocks = {
        ${
        Object.keys( result.blocks ).map( ( name ) => {
            return `${ name }() {
                    ${ result.blocks[ name ] }
                    return ${ privateParam }
                }`
        } ).join( ',' )
        }
        }
        exports.render = function compiledRenderHandler() {
        if( this.__base ) {
            var __base = this.__base;
            this.__base = null;
            this.__blocks = Object.assign( {}, __base.__blocks, this.__blocks )
            return __base.render.call( this )
        } else {
        ${ result.content }
        }
        return ${ privateParam }
        }
        `
}

exports.renderFile = renderFile = ( tmplFilePath, prefix, data ) => {
    tmplFilePath = Path.resolve( tmplFilePath )

    let cp       = generatePath( tmplFilePath, prefix ),
        tmplObj,
        _compile = () => {
            cachedFiles[ cp ] = true
            FS.writeFileSync( cp, compileFile( tmplFilePath, prefix ) )
            return renderFile( tmplFilePath, prefix, data )
        }

    if ( process.env.DEBUG ) {
        watchFile( tmplFilePath, cp )
    }

    if ( cachedFiles[ cp ] ) {
        try {
            FS.statSync( cp )
        } catch ( e ) {
            return _compile()
        }
    } else {
        return _compile()
    }

    tmplObj = require( cp )

    return data ? tmplObj.render.call( Object.assign( {}, data, {
        __ext   : Ext,
        __blocks: tmplObj.__blocks,
        __base  : tmplObj.__base
    } ) ) : BLANK
}

exports.setOption = setOption = ( options ) => {
    let folderPath

    isSetted     = true
    globalOption = Object.assign( {}, defaultOption, options )

    folderPath = globalOption.compiledFolder = Path.resolve( globalOption.compiledFolder )

    try {
        FS.statSync( folderPath )
    } catch ( e ) {
        FS.mkdirSync( folderPath )
    }
}

exports.generatePath = generatePath
