'use strict'

let directives = [ {
    name: 'extends'
}, {
    name  : 'block',
    endTag: 'endblock'
} ]

class Directives {
    constructor( compiler ) {
        this._compiler = compiler
        this._blocks   = {}
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
        args.push( content.content )

        return {
            output : this[ name ].apply( this, args ),
            nextPos: endTagPosStart
        }
    }

    generateBlock() {
        return this._blocks
    }

    //directives

    extends( base ) {
        console.log( base )
    }

    block( name, content ) {
        if ( !name ) {
            throw Error( 'Please provide a name for block!' )
        }

        if ( name in this._blocks ) {
            throw Error( `${ name } is defined somewhere!` )
        }

        this._blocks[ name ] = content

        return `this.__blocks['${ name }']() || ''`
    }
}

module.exports = ( compiler ) => {
    return new Directives( compiler )
}
