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
        ext   : 'tmp'
    }

class Template extends EventEmitter {
    constructor( opts ) {
        super()
        this._config = Object.assign( {}, defaultConfig, opts )
    }

    compile( codes, opts ) {
        return this.wrap( Compiler.compile( codes, opts ) )
    }

    preCompile( src, opts ) {
        opts = Object.assign( {}, defaultPreCompileOpts, opts )

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

        if ( opts.dest ) {
            let dest = Path.resolve( opts.dest )

            try {
                if ( !FS.statSync( dest ).isDirectory() ) {
                    FS.mkdirSync( dest )
                }

                let filename = this.generateName( src )
                FS.writeFileSync( Path.resolve( dest, filename + '.' + opts.ext ), sourceCode )
            } catch ( e ) {
                /* eslint-disable */
                console.error( `create ${ dest } failed.\n${ e }` )
                /* eslint-enable */
            }
        } else {
            return sourceCode
        }
    }

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
            typeof callback === 'function' && callback( fn( data ) )
        } catch ( e ) {
            this.emit( 'error', e )
        }

        return this
    }

    renderString( codes, data, callback ) {
        let fn = this.compile( codes )

        try {
            typeof callback === 'function' && callback( fn( data ) )
        } catch ( e ) {
            this.emit( 'error', e )
        }

        return this
    }

    generateName( str ) {
        return Crypto.createHash( 'md5' ).update( str ).digest( 'hex' )
    }

    wrap( sourceCode ) {
        let config = this._config

        return new Function( 'helper', 'return ' + sourceCode + '()' )( {
            [ Compiler.EXT_OBJECT ] : Ext,
            [ Compiler.TE_OBJECT ]  : Template,
            [ Compiler.PATH_OBJECT ]: Path,
            [ Compiler.DIR_OBJECT ] : config.basePath || __dirname
        } )
    }
}

module.exports = ( config ) => {
    return new Template( config )
}
