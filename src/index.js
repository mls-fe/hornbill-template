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

    privateParam        = '__html',
    privateConcatStrExp = `;${ privateParam } +=`,
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

exports.compile = compile = ( source ) => {
    if ( !isSetted ) {
        setOption()
    }

    log( 'start compile' )

    let contentStr    = `
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
                if ( Directives.hasDirective( fragment ) ) {
                    tmp = Directives.parse( fragment, source, tagStartPos + 2, tagEndPos )
                    if ( tmp ) {
                        concatContent( privateConcatStrExp + tmp.output )
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
        blocks : Directives.generateBlock()
    }
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

    let result = compile( source )

    console.log( result )

    return `${ codePrefix }
        /* source file path = ${ tmplFilePath } */
        module.exports = function compiledRenderHandler() {
        this.__blocks = {}
        ${
        Object.keys( result.blocks ).map( ( name ) => {
            return `this.__blocks['${ name }'] = () => {
                    ${ result.blocks[ name ] }
                    return ${ privateParam }
                }`
        } ).join( ';' )
        }
        ${ result.content }
        return ${ privateParam }
        }
        `
}

exports.renderFile = renderFile = ( tmplFilePath, prefix, data ) => {
    let cp       = globalOption.compiledFolder + '/' + generateName( tmplFilePath, prefix ),
        tmplFn,
        _compile = () => {
            cachedFiles[ cp ] = true
            FS.writeFileSync( cp, compileFile( tmplFilePath ) )
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
