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
    }
}

module.exports = Ext
