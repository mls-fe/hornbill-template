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
                /* eslint-disable */
                console.log( `parse ${filepath} error.` )
                console.log( e )
                /* eslint-enable */
            }
        }

        typeof callback === 'function' && callback( fn.call( Object.assign( {}, data, {
            [ Compiler.EXT_OBJECT ] : Ext,
            [ Compiler.TE_OBJECT ]  : Template,
            [ Compiler.PATH_OBJECT ]: Path,
            [ Compiler.DIR_OBJECT ] : Path.dirname( filepath )
        } ) ) )
    },

    renderString( codes, data, callback ) {
        let fn = this.compile( codes )

        typeof callback === 'function' && callback( fn.call( Object.assign( {}, data, {
            [ Compiler.EXT_OBJECT ] : Ext,
            [ Compiler.TE_OBJECT ]  : Template,
            [ Compiler.PATH_OBJECT ]: Path,
            [ Compiler.DIR_OBJECT ] : __dirname
        } ) ) )
    }
}

module.exports = Template
