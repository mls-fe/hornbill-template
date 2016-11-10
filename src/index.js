'use strict'

let Path                  = require( 'path' ),
    FS                    = require( 'fs' ),
    Crypto                = require( 'crypto' ),
    EventEmitter          = require( 'events' ),
    Compiler              = require( './compiler' ),
    Ext                   = require( './ext' ),
    cache                 = new Map(),
    defaultConfig         = {
        errorHandler( err ) {
            /* eslint-disable */
            console.error( err )
            /* eslint-enable */
        }
    },

    defaultPreCompileOpts = {
        isFile: true,
        dest  : './tmp',
        ext   : 'tmp'
    }

class Template extends EventEmitter {
    constructor( opts ) {
        super()
        this._config = Object.assign( {}, defaultConfig, opts )
    }

    compile( codes, opts ) {
        let sourceCode = Compiler.compile( codes, opts )
        return new Function( sourceCode )
    }

    preCompile( src, opts ) {
        opts      = Object.assign( {}, defaultPreCompileOpts, opts )
        opts.dest = Path.resolve( opts.dest )

        let content

        if ( opts.isFile ) {
            try {
                content = FS.readFileSync( src, {
                    encoding: 'utf8'
                } )
            } catch ( e ) {
                /* eslint-disable */
                console.error( `${ src } is not exist.\n${ e }` )
                /* eslint-enable */
            }
        } else {
            content = src
        }

        let sourceCode = Compiler.compile( content, opts )

        try {
            if ( !FS.statSync( opts.dest ).isDirectory() ) {
                FS.mkdirSync( opts.dest )
            }

            let filename = this.generateName( src )
            FS.writeFileSync( Path.resolve( opts.dest, filename + '.' + opts.ext ), sourceCode )
        } catch ( e ) {
            /* eslint-disable */
            cosole.error( `create ${ opts.dest } failed.\n${ e }` )
            /* eslint-enable */
        }
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
                console.log( `parse ${ filepath } error.` )
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

    generateName( str ) {
        return Crypto.createHash( 'md5' ).update( str ).digest( 'hex' )
    }
}

module.exports = ( config ) => {
    return new Template( config )
}
