'use strict'

let normalSpace = '  ',
    rmorespace  = /\s{2,}/g,
    rquote      = /^(?:"|')/

const
    DOT  = '.',
    THIS = 'this'

module.exports = {
    stripCode( code ) {
        return code.replace( rmorespace, normalSpace ).trim()
    },

    wrapValue( value ) {
        value = value.trim()
        return !value.match( rquote ) ? `"${ value }"` : value
    },

    /**
     *only expr contains dot
     * input: a.b.c
     * output: a && a.b && a.b.c
     */
    generateValCheck( expr ) {
        if ( expr.includes( DOT ) ) {
            let arr = expr.split( DOT )

            arr = arr.map( ( v, i ) => {
                return v === THIS ? null : arr.slice( 0, i + 1 ).join( DOT )
            } )

            //do not check 'this'
            arr[ 0 ] === null && arr.splice( 0, 1 )
            return arr.join( ' && ' )
        }

        return expr
    }
}
