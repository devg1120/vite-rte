/*jshint strict:false, undef:false, unused:false */

import {
        canObserveMutations,
        canWeakMap,
	TEXT_NODE,
	ELEMENT_NODE,
	DOCUMENT_FRAGMENT_NODE,
	SHOW_ELEMENT,
	indexOf,
	cantFocusEmptyTextNodes,
	ZWS,
                    } from './Constants';

import {
        TreeWalker,
                    } from './TreeWalker';

import {
        removeEmptyInlines ,
                    } from './Clean';


var inlineNodeNames  = /^(?:#text|A(?:BBR|CRONYM)?|B(?:R|D[IO])?|C(?:ITE|ODE)|D(?:ATA|EL|FN)|EM|FONT|HR|I(?:FRAME|MG|NPUT|NS)?|KBD|Q|R(?:P|T|UBY)|S(?:AMP|MALL|PAN|TR(?:IKE|ONG)|U[BP])?|TIME|U|VAR|WBR)$/;

export var leafNodeNames = {
    BR: 1,
    HR: 1,
    IFRAME: 1,
    IMG: 1,
    INPUT: 1
};

function every ( nodeList, fn ) {
    var l = nodeList.length;
    while ( l-- ) {
        if ( !fn( nodeList[l] ) ) {
            return false;
        }
    }
    return true;
}

// ---

var UNKNOWN = 0;
var INLINE = 1;
var BLOCK = 2;
var CONTAINER = 3;

export var nodeCategoryCache = canWeakMap ? new WeakMap() : null;

export function isLeaf ( node ) {
    return node.nodeType === ELEMENT_NODE && !!leafNodeNames[ node.nodeName ];
}
export function getNodeCategory ( node ) {
    switch ( node.nodeType ) {
    case TEXT_NODE:
        return INLINE;
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
        if ( canWeakMap && nodeCategoryCache.has( node ) ) {
            return nodeCategoryCache.get( node );
        }
        break;
    default:
        return UNKNOWN;
    }

    var nodeCategory;
    if ( !every( node.childNodes, isInline ) ) {
        // Malformed HTML can have block tags inside inline tags. Need to treat
        // these as containers rather than inline. See #239.
        nodeCategory = CONTAINER;
    } else if ( inlineNodeNames.test( node.nodeName ) ) {
        nodeCategory = INLINE;
    } else {
        nodeCategory = BLOCK;
    }
    if ( canWeakMap ) {
        nodeCategoryCache.set( node, nodeCategory );
    }
    return nodeCategory;
}
export function isInline ( node ) {
    return getNodeCategory( node ) === INLINE;
}
export function isBlock ( node ) {
    return getNodeCategory( node ) === BLOCK;
}
export function isContainer ( node ) {
    return getNodeCategory( node ) === CONTAINER;
}

export function getBlockWalker ( node, root ) {
    var walker = new TreeWalker( root, SHOW_ELEMENT, isBlock );
    walker.currentNode = node;
    return walker;
}
export function getPreviousBlock ( node, root ) {
    node = getBlockWalker( node, root ).previousNode();
    return node !== root ? node : null;
}
export function getNextBlock ( node, root ) {
    node = getBlockWalker( node, root ).nextNode();
    return node !== root ? node : null;
}

export function isEmptyBlock ( block ) {
    return !block.textContent && !block.querySelector( 'IMG' );
}

export function areAlike ( node, node2 ) {
    return !isLeaf( node ) && (
        node.nodeType === node2.nodeType &&
        node.nodeName === node2.nodeName &&
        node.nodeName !== 'A' &&
        node.className === node2.className &&
        ( ( !node.style && !node2.style ) ||
          node.style.cssText === node2.style.cssText )
    );
}
export function hasTagAttributes ( node, tag, attributes ) {
    if ( node.nodeName !== tag ) {
        return false;
    }
    for ( var attr in attributes ) {
        if ( node.getAttribute( attr ) !== attributes[ attr ] ) {
            return false;
        }
    }
    return true;
}
export function getNearest ( node, root, tag, attributes ) {
    while ( node && node !== root ) {
        if ( hasTagAttributes( node, tag, attributes ) ) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}
export function isOrContains ( parent, node ) {
    while ( node ) {
        if ( node === parent ) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

export function getPath ( node, root, config ) {
    var path = '';
    var id, className, classNames, dir, styleNames;
    if ( node && node !== root ) {
        path = getPath( node.parentNode, root, config );
        if ( node.nodeType === ELEMENT_NODE ) {
            path += ( path ? '>' : '' ) + node.nodeName;
            if ( id = node.id ) {
                path += '#' + id;
            }
            if ( className = node.className.trim() ) {
                classNames = className.split( /\s\s*/ );
                classNames.sort();
                path += '.';
                path += classNames.join( '.' );
            }
            if ( dir = node.dir ) {
                path += '[dir=' + dir + ']';
            }
            if ( classNames ) {
                styleNames = config.classNames;
                if ( indexOf.call( classNames, styleNames.highlight ) > -1 ) {
                    path += '[backgroundColor=' +
                        node.style.backgroundColor.replace( / /g,'' ) + ']';
                }
                if ( indexOf.call( classNames, styleNames.colour ) > -1 ) {
                    path += '[color=' +
                        node.style.color.replace( / /g,'' ) + ']';
                }
                if ( indexOf.call( classNames, styleNames.fontFamily ) > -1 ) {
                    path += '[fontFamily=' +
                        node.style.fontFamily.replace( / /g,'' ) + ']';
                }
                if ( indexOf.call( classNames, styleNames.fontSize ) > -1 ) {
                    path += '[fontSize=' + node.style.fontSize + ']';
                }
            }
        }
    }
    return path;
}

export function getLength ( node ) {
    var nodeType = node.nodeType;
    return nodeType === ELEMENT_NODE || nodeType === DOCUMENT_FRAGMENT_NODE ?
        node.childNodes.length : node.length || 0;
}

export function detach ( node ) {
    var parent = node.parentNode;
    if ( parent ) {
        parent.removeChild( node );
    }
    return node;
}
export function replaceWith ( node, node2 ) {
    var parent = node.parentNode;
    if ( parent ) {
        parent.replaceChild( node2, node );
    }
}
export function empty ( node ) {
    var frag = node.ownerDocument.createDocumentFragment(),
        childNodes = node.childNodes,
        l = childNodes ? childNodes.length : 0;
    while ( l-- ) {
        frag.appendChild( node.firstChild );
    }
    return frag;
}

export function createElement ( doc, tag, props, children ) {
    var el = doc.createElement( tag ),
        attr, value, i, l;
    if ( props instanceof Array ) {
        children = props;
        props = null;
    }
    if ( props ) {
        for ( attr in props ) {
            value = props[ attr ];
            if ( value !== undefined ) {
                el.setAttribute( attr, value );
            }
        }
    }
    if ( children ) {
        for ( i = 0, l = children.length; i < l; i += 1 ) {
            el.appendChild( children[i] );
        }
    }
    return el;
}

export function fixCursor ( node, root ) {
    // In Webkit and Gecko, block level elements are collapsed and
    // unfocusable if they have no content. To remedy this, a <BR> must be
    // inserted. In Opera and IE, we just need a textnode in order for the
    // cursor to appear.
    var self = root.__squire__;
    var doc = node.ownerDocument;
    var originalNode = node;
    var fixer, child;

    if ( node === root ) {
        if ( !( child = node.firstChild ) || child.nodeName === 'BR' ) {
            fixer = self.createDefaultBlock();
            if ( child ) {
                node.replaceChild( fixer, child );
            }
            else {
                node.appendChild( fixer );
            }
            node = fixer;
            fixer = null;
        }
    }

    if ( node.nodeType === TEXT_NODE ) {
        return originalNode;
    }

    if ( isInline( node ) ) {
        child = node.firstChild;
        while ( cantFocusEmptyTextNodes && child &&
                child.nodeType === TEXT_NODE && !child.data ) {
            node.removeChild( child );
            child = node.firstChild;
        }
        if ( !child ) {
            if ( cantFocusEmptyTextNodes ) {
                fixer = doc.createTextNode( ZWS );
                self._didAddZWS();
            } else {
                fixer = doc.createTextNode( '' );
            }
        }
    } else if ( !node.querySelector( 'BR' ) ) {
        fixer = createElement( doc, 'BR' );
        while ( ( child = node.lastElementChild ) && !isInline( child ) ) {
            node = child;
        }
    }
    if ( fixer ) {
        try {
            node.appendChild( fixer );
        } catch ( error ) {
            self.didError({
                name: 'Squire: fixCursor ?????' + error,
                message: 'Parent: ' + node.nodeName + '/' + node.innerHTML +
                    ' appendChild: ' + fixer.nodeName
            });
        }
    }

    return originalNode;
}

// Recursively examine container nodes and wrap any inline children.
export function fixContainer ( container, root ) {
    var children = container.childNodes;
    var doc = container.ownerDocument;
    var wrapper = null;
    var i, l, child, isBR;

    for ( i = 0, l = children.length; i < l; i += 1 ) {
        child = children[i];
        isBR = child.nodeName === 'BR';
        if ( !isBR && isInline( child ) ) {
            if ( !wrapper ) {
                 wrapper = createElement( doc, 'div' );
            }
            wrapper.appendChild( child );
            i -= 1;
            l -= 1;
        } else if ( isBR || wrapper ) {
            if ( !wrapper ) {
                wrapper = createElement( doc, 'div' );
            }
            fixCursor( wrapper, root );
            if ( isBR ) {
                container.replaceChild( wrapper, child );
            } else {
                container.insertBefore( wrapper, child );
                i += 1;
                l += 1;
            }
            wrapper = null;
        }
        if ( isContainer( child ) ) {
            fixContainer( child, root );
        }
    }
    if ( wrapper ) {
        container.appendChild( fixCursor( wrapper, root ) );
    }
    return container;
}

export function split ( node, offset, stopNode, root ) {
    var nodeType = node.nodeType,
        parent, clone, next;
    if ( nodeType === TEXT_NODE && node !== stopNode ) {
        return split(
            node.parentNode, node.splitText( offset ), stopNode, root );
    }
    if ( nodeType === ELEMENT_NODE ) {
        if ( typeof( offset ) === 'number' ) {
            offset = offset < node.childNodes.length ?
                node.childNodes[ offset ] : null;
        }
        if ( node === stopNode ) {
            return offset;
        }

        // Clone node without children
        parent = node.parentNode;
        clone = node.cloneNode( false );

        // Add right-hand siblings to the clone
        while ( offset ) {
            next = offset.nextSibling;
            clone.appendChild( offset );
            offset = next;
        }

        // Maintain li numbering if inside a quote.
        if ( node.nodeName === 'OL' &&
                getNearest( node, root, 'BLOCKQUOTE' ) ) {
            clone.start = ( +node.start || 1 ) + node.childNodes.length - 1;
        }

        // DO NOT NORMALISE. This may undo the fixCursor() call
        // of a node lower down the tree!

        // We need something in the element in order for the cursor to appear.
        fixCursor( node, root );
        fixCursor( clone, root );

        // Inject clone after original node
        if ( next = node.nextSibling ) {
            parent.insertBefore( clone, next );
        } else {
            parent.appendChild( clone );
        }

        // Keep on splitting up the tree
        return split( parent, clone, stopNode, root );
    }
    return offset;
}

function _mergeInlines ( node, fakeRange ) {
    var children = node.childNodes,
        l = children.length,
        frags = [],
        child, prev, len;
    while ( l-- ) {
        child = children[l];
        prev = l && children[ l - 1 ];
        if ( l && isInline( child ) && areAlike( child, prev ) &&
                !leafNodeNames[ child.nodeName ] ) {
            if ( fakeRange.startContainer === child ) {
                fakeRange.startContainer = prev;
                fakeRange.startOffset += getLength( prev );
            }
            if ( fakeRange.endContainer === child ) {
                fakeRange.endContainer = prev;
                fakeRange.endOffset += getLength( prev );
            }
            if ( fakeRange.startContainer === node ) {
                if ( fakeRange.startOffset > l ) {
                    fakeRange.startOffset -= 1;
                }
                else if ( fakeRange.startOffset === l ) {
                    fakeRange.startContainer = prev;
                    fakeRange.startOffset = getLength( prev );
                }
            }
            if ( fakeRange.endContainer === node ) {
                if ( fakeRange.endOffset > l ) {
                    fakeRange.endOffset -= 1;
                }
                else if ( fakeRange.endOffset === l ) {
                    fakeRange.endContainer = prev;
                    fakeRange.endOffset = getLength( prev );
                }
            }
            detach( child );
            if ( child.nodeType === TEXT_NODE ) {
                prev.appendData( child.data );
            }
            else {
                frags.push( empty( child ) );
            }
        }
        else if ( child.nodeType === ELEMENT_NODE ) {
            len = frags.length;
            while ( len-- ) {
                child.appendChild( frags.pop() );
            }
            _mergeInlines( child, fakeRange );
        }
    }
}

export function mergeInlines ( node, range ) {
    if ( node.nodeType === TEXT_NODE ) {
        node = node.parentNode;
    }
    if ( node.nodeType === ELEMENT_NODE ) {
        var fakeRange = {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };
        _mergeInlines( node, fakeRange );
        range.setStart( fakeRange.startContainer, fakeRange.startOffset );
        range.setEnd( fakeRange.endContainer, fakeRange.endOffset );
    }
}

export function mergeWithBlock ( block, next, range, root ) {
    var container = next;
    var parent, last, offset;
    while ( ( parent = container.parentNode ) &&
            parent !== root &&
            parent.nodeType === ELEMENT_NODE &&
            parent.childNodes.length === 1 ) {
        container = parent;
    }
    detach( container );

    offset = block.childNodes.length;

    // Remove extra <BR> fixer if present.
    last = block.lastChild;
    if ( last && last.nodeName === 'BR' ) {
        block.removeChild( last );
        offset -= 1;
    }

    block.appendChild( empty( next ) );

    range.setStart( block, offset );
    range.collapse( true );
    mergeInlines( block, range );
}

export function mergeContainers ( node, root ) {
    var prev = node.previousSibling,
        first = node.firstChild,
        doc = node.ownerDocument,
        isListItem = ( node.nodeName === 'LI' ),
        needsFix, block;

    // Do not merge LIs, unless it only contains a UL
    if ( isListItem && ( !first || !/^[OU]L$/.test( first.nodeName ) ) ) {
        return;
    }

    if ( prev && areAlike( prev, node ) ) {
        if ( !isContainer( prev ) ) {
            if ( isListItem ) {
                block = createElement( doc, 'DIV' );
                block.appendChild( empty( prev ) );
                prev.appendChild( block );
            } else {
                return;
            }
        }
        detach( node );
        needsFix = !isContainer( node );
        prev.appendChild( empty( node ) );
        if ( needsFix ) {
            fixContainer( prev, root );
        }
        if ( first ) {
            mergeContainers( first, root );
        }
    } else if ( isListItem ) {
        prev = createElement( doc, 'DIV' );
        node.insertBefore( prev, first );
        fixCursor( prev, root );
    }
}
