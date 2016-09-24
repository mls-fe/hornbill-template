'use strict'

let Path     = require( 'path' ),
    FS       = require( 'fs' ),
    Compiler = require( './compiler' ),
    Ext      = require( './ext' ),
    cache    = new Map(),
    Template

Template = {
    compile( codes ) {
        let sourceCode = Compiler.compile( codes )
        return new Function( sourceCode )
    },

    render( filepath, data, callback ) {
        filepath = Path.resolve( filepath )

        let fn

        if ( cache.has( filepath ) ) {
            fn = cache.get( filepath )
        } else {
            try {
                let codes = FS.readFileSync( filepath, {
                    encoding: 'utf8'
                } )

                fn = this.compile( codes )
                cache.set( filepath, fn )
            } catch ( e ) {
                throw Error( `${filepath} not exist.` )
            }
        }

        typeof callback === 'function' && callback( fn.call( Object.assign( {}, data, {
            __ext: Ext
        } ) ) )
    },

    renderString( str, data, callback ) {
    }
}

module.exports = Template
