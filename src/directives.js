'use strict'

let Path       = require( 'path' ),
    directives = [ {
        name: 'extends'
    }, {
        name  : 'block',
        endTag: 'endblock'
    } ]

class Directives {
    constructor( compiler, sourcePath, prefix ) {
        this._sourcePath = sourcePath && sourcePath.replace( /[^/]+\..+$/, '' )
        this._prefix     = prefix
        this._compiler   = compiler
        this._blocks     = {}
    }

    hasDirective( code ) {
        return directives.some( ( directive ) => code.trim().startsWith( directive.name ) )
    }

    getDirective( name ) {
        return directives.filter( ( directive ) => directive.name === name )[ 0 ]
    }

    parse( code, source, start, end ) {
        var codes          = code.trim().split( /\s+/ ),
            name           = codes[ 0 ],
            directive      = this.getDirective( name ),
            endTag,
            endTagReg,
            endTagPosStart = end,
            content,
            tmpSource

        if ( directive.endTag ) {
            endTagReg = new RegExp( `<%\\s*${ directive.endTag }\\s*%>`, 'm' )
            tmpSource = source.toString( 'utf-8', end + 2 )
            endTag    = tmpSource.match( endTagReg )

            if ( !endTag || !endTag.length ) {
                throw Error( `directive "${ name }" is not closed` )
            }

            endTagPosStart = source.indexOf( endTag[ 0 ], end )
            content        = this._compiler.compile( source.toString( 'utf8', end + 2, endTagPosStart ) )
            endTagPosStart += endTag[ 0 ].length
        }

        let args = codes.splice( 1 )
        //discard nested blocks
        content && args.push( content.content )

        return {
            output : this[ name ].apply( this, args ) || '',
            nextPos: endTagPosStart
        }
    }

    //directives

    extends( base ) {
        let name = Path.resolve( this._sourcePath, base.replace( /['"]/g, '' ) )
        this._compiler.renderFile( name, this._prefix )
        this._base = this._compiler.generatePath( name, this._prefix )
    }

    block( name, content ) {
        if ( !name ) {
            throw Error( 'Please provide a name for block!' )
        }

        if ( name in this._blocks ) {
            throw Error( `${ name } is defined somewhere!` )
        }

        this._blocks[ name ] = content

        return `this.__blocks['${ name }'].call( this ) || ''`
    }
}

module.exports = ( compiler, sourcePath, prefix ) => {
    return new Directives( compiler, sourcePath, prefix )
}
