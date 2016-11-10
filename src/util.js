'use strict'

let normalSpace = '  ',
    rbracket    = /([^[]+)(\[[^]]+)/,
    rmorespace  = /\s{2,}/g,
    rquote      = /^(?:"|')/

const
    DOT           = '.',
    BRACKET_LEFT  = '[',
    BRACKET_RIGHT = ']',
    THIS          = 'this'

module.exports = {
    stripCode( code ) {
        return code.replace( rmorespace, normalSpace ).trim()
    },

    wrapValue( value ) {
        value = value.trim()
        return !value.match( rquote ) ? `"${ value }"` : value
    },

    /**
     * check DOT or BRACKET
     *
     * eg.
     * input: a.b.c
     * output: a && a.b && a.b.c
     *
     * input a.b[2].c
     * output: a && a.b && a.b[2] && a.b[2].c
     */
    generateValCheck( expr ) {
        if ( expr.includes( DOT ) || ( expr.includes( BRACKET_LEFT ) && expr.includes( BRACKET_RIGHT )) ) {
            if ( expr.endsWith( DOT ) ) {
                throw Error( `"${ expr }" is not a correct format.` )
            }

            let arr    = expr.split( DOT ),
                newArr = []

            for ( let i = 0; i < arr.length; i++ ) {
                let item = arr[ i ]

                if ( item === THIS ) {
                    continue
                }

                let previous = arr.slice( 0, i + 1 )

                if ( item.includes( BRACKET_LEFT ) ) {
                    let matches = item.match( rbracket )

                    if ( matches && matches.length > 2 ) {
                        let tmp = previous.slice( 0, previous.length - 1 )
                        tmp.push( matches[ 1 ] )
                        newArr.push( tmp.join( DOT ) )
                    }
                }

                newArr.push( previous.join( '.' ) )
            }

            return newArr.join( ' && ' )
        }

        return expr
    }
}
