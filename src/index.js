'use strict'

let Path          = require( 'path' ),
    FS            = require( 'fs' ),
    EventEmitter  = require( 'events' ),
    Compiler      = require( './compiler' ),
    Ext           = require( './ext' ),
    cache         = new Map(),
    defaultConfig = {
        errorHandler( err ) {
            /* eslint-disable */
            console.error( err )
            /* eslint-enable */
        }
    }

class Template extends EventEmitter {
    constructor( config ) {
        super()
        this._config = Object.assign( {}, defaultConfig, config )
    }

    compile( codes, config ) {
        let sourceCode = Compiler.compile( codes, config )
        return new Function( sourceCode )
    }

    render( filepath, data, callback ) {
        filepath = Path.resolve( filepath )

        let config = this._config,
            fn

        if ( cache.has( filepath ) ) {
            fn = cache.get( filepath )
        } else {
            try {
                let codes = FS.readFileSync( filepath, {
                    encoding: 'utf8'
                } )

                fn = this.compile( codes, this._config )
                cache.set( filepath, fn )
            } catch ( e ) {
                /* eslint-disable */
                console.log( `parse ${filepath} error.` )
                console.log( e )
                /* eslint-enable */
            }
        }

        try {
            typeof callback === 'function' && callback( fn.call( Object.assign( {}, data, {
                [ Compiler.EXT_OBJECT ] : Ext,
                [ Compiler.TE_OBJECT ]  : Template,
                [ Compiler.PATH_OBJECT ]: Path,
                [ Compiler.DIR_OBJECT ] : config.basePath || Path.dirname( filepath )
            } ) ) )
        } catch ( e ) {
            this.emit( 'error', e )
        }

        return this
    }

    renderString( codes, data, callback ) {
        let config = this._config, /**/
            fn     = this.compile( codes )

        try {
            typeof callback === 'function' && callback( fn.call( Object.assign( {}, data, {
                [ Compiler.EXT_OBJECT ] : Ext,
                [ Compiler.TE_OBJECT ]  : Template,
                [ Compiler.PATH_OBJECT ]: Path,
                [ Compiler.DIR_OBJECT ] : config.basePath || __dirname
            } ) ) )
        } catch ( e ) {
            this.emit( 'error', e )
        }

        return this
    }
}

module.exports = ( config ) => {
    return new Template( config )
}
