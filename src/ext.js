'use strict'

let Ext = {
    htmlEncode( s ) {
        let escaped = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }
        return s.replace( /[&<>'"]/g, function ( m ) {
            return escaped[ m ]
        } )
    },

    urlEncode( str ) {
        return encodeURIComponent( str )
    },

    each( obj, handler ) {
        if ( Array.isArray( obj ) ) {
            for ( let i = 0; i < obj.length; i++ ) {
                handler.call( null, obj[ i ], i, obj )
            }
        } else {
            Object.getOwnPropertyNames( obj )
                .forEach( ( key ) => {
                    handler.call( null, obj[ key ], key, obj )
                } )
        }
    }
}

module.exports = Ext
