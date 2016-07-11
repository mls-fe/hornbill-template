'use strict'

let Path                = require( 'path' ),
    FS                  = require( 'fs' ),
    Crypto              = require( 'crypto' ),

    isSetted            = false,
    defaultOption       = {
        compiledFolder: './tmp'
    },
    globalOption        = defaultOption,
    setOption, compile, renderFile,

    privateConcatStrExp = ';__html +=',
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
    }

const
    BLANK = '',
    EQUAL = '='

function log( str ) {
    console.log( `[ log ] ${ str }` )
}

exports.compile = compile = ( tmplFilePath, compiledFilePath ) => {
    if ( !isSetted ) {
        setOption()
    }

    //log( 'start compile' )

    tmplFilePath = Path.resolve( tmplFilePath )

    let contentStr    = `'use strict';
    /* source file path = ${ tmplFilePath } */
module.exports = function compiledRenderHandler() {
    let __html = '';
    `,
        isInComment   = false,

        /**
         *
         * @param str
         * @param isPlain 如果是普通文本, 追加到内部字符串拼接, 否则直接追加到 contentStr 上
         */
        concatContent = ( str, isPlain ) => {
            if ( isInComment ) {
                return
            }

            contentStr += isPlain ? `${ privateConcatStrExp } \`${ str }\`\n` : str
        },
        output        = ( str, start, end ) => {
            return str.toString( 'utf-8', start, end )
        },
        source,
        pos           = 0,
        tagStartPos   = 0,
        tagEndPos     = 0,
        contentLength

    //log( tmplFilePath )

    try {
        source = FS.readFileSync( tmplFilePath )
    } catch ( e ) {
        source = BLANK
    }

    contentLength = source.length

    //file does not exist or is empty
    if ( !source ) {
        return () => {
            return BLANK
        }
    }

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
        log( fragment )

        switch ( fragment[ 0 ] ) {
        case EQUAL:
            if ( fragment[ 1 ] === EQUAL ) {
                concatContent( `${ privateConcatStrExp } extFn.htmlEncode(' + ${ output( source, tagStartPos + 4, tagEndPos ) }')` )
            } else {
                concatContent( privateConcatStrExp + output( source, tagStartPos + 3, tagEndPos ) )
            }
            break

        default:
            concatContent( output( source, tagStartPos + 2, tagEndPos ) )
            break
        }

        pos = tagStartPos = tagEndPos + 2
    }

    contentStr += `
        return __html; 
    }`

    FS.writeFileSync( compiledFilePath, contentStr )
    cachedFiles[ compiledFilePath ] = true
    return contentStr
}

exports.renderFile = renderFile = ( tmplFilePath, prefix, data ) => {
    let cp       = globalOption.compiledFolder + '/' + generateName( tmplFilePath, prefix ),
        tmplFn,
        _compile = () => {
            tmplFn = compile( tmplFilePath, cp )
            return renderFile( tmplFilePath, prefix, data )
        }

    if ( process.env.DEBUG ) {
        watchFile( tmplFilePath, cp )
    }

    if ( cachedFiles[ cp ] ) {
        try {
            tmplFn = require( cp )
        } catch ( e ) {
            return _compile()
        }
    } else {
        return _compile()
    }

    return data ? tmplFn.call( data ) : BLANK
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
