'use strict'

let Path          = require( 'path' ),
    FS            = require( 'fs' ),

    isSetted      = false,
    defaultOption = {
        compiledFolder: './tmp'
    },
    globalOption  = defaultOption,
    setOption

exports.compile = () => {
    if ( !isSetted ) {
        setOption()
    }
}

exports.renderFile = () => {
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
