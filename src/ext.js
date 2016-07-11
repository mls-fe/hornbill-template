exports.htmlEncode = function escape( s ) {
    var escaped = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }
    return s.replace( /[&<>'"]/g, function ( m ) {
        return escaped[ m ]
    } )
}

exports.urlEncode = function ( str ) {
    return encodeURIComponent( str )
}
