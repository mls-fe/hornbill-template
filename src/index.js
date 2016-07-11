'use strict'

let Path                = require( 'path' ),
    FS                  = require( 'fs' ),
    Crypto              = require( 'crypto' ),
    Ext                 = require( './ext' ),
    Directives          = require( './directives' )( exports ),

    isSetted            = false,
    defaultOption       = {
        compiledFolder: './tmp'
    },
    globalOption        = defaultOption,
    setOption, compile, compileFile, renderFile,

    privateConcatStrExp = ';__html +=',
    codePrefix          = `'use strict';`,
    watchedFiles        = {},
    cachedFiles         = {},
    generateName        = ( name, prefix ) => {
        return ( prefix || '' ) + Crypto.createHash( 'md5' ).update( name ).digest( 'hex' ) + '.est'
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

exports.compile = compile = ( source, tmplFilePath ) => {
    if ( !isSetted ) {
        setOption()
    }

    log( 'start compile' )

    let contentStr    = `
    /* source file path = ${ tmplFilePath || 'in memory' } */
     module.exports = function compiledRenderHandler() {
        let __html = '';
    `,

        /**
         *
         * @param str
         * @param isPlain 如果是普通文本, 追加到内部字符串拼接, 否则直接追加到 contentStr 上
         */
        concatContent = ( str, isPlain ) => {
            contentStr += isPlain ? `${ privateConcatStrExp } \`${ str }\`\n` : str
        },
        output        = ( str, start, end ) => {
            return str.toString( 'utf-8', start, end )
        },
        pos           = 0,
        tagStartPos   = 0,
        tagEndPos     = 0,
        contentLength

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
                if ( Directives.hasDirective( fragment ) ) {
                    tagEndPos = Directives.parse( fragment, source, tagStartPos + 2, tagEndPos )
                    break
                }
                concatContent( fragment )
                break
            }

            pos = tagStartPos = tagEndPos + 2
        }
    }

    return contentStr
}

exports.compileFile = compileFile = ( tmplFilePath ) => {
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

    return codePrefix + compile( source )
}

exports.renderFile = renderFile = ( tmplFilePath, prefix, data ) => {
    let cp       = globalOption.compiledFolder + '/' + generateName( tmplFilePath, prefix ),
        tmplFn,
        _compile = () => {
            FS.writeFileSync( cp, compileFile( tmplFilePath ) )
            cachedFiles[ cp ] = true
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

    tmplFn = require( cp )

    return data ? tmplFn.call( Object.assign( {}, data, {
        __ext: Ext
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

exports.generateName = generateName
