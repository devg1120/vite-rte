/*jshint strict:false, undef:false, unused:false */

import {
	addLinks,
	splitBlock,
	removeZWS,
       } from './Editor';

import {
	getStartBlockOfRange,
	rangeDoesStartAtBlockBoundary,
	deleteContentsOfRange,
       } from './Range';

import {
	removeEmptyInlines,
       } from './Clean';

import {
	isIOS,
	isMac,
	isWin,
        ctrlKey,
	ELEMENT_NODE,
	TEXT_NODE,
       } from './Constants';

import {
	getNearest,
	isEmptyBlock,
	fixCursor,
	getLength,
	isInline,
	fixContainer,
	getPreviousBlock,
	mergeWithBlock,
       } from './Node';

var keys = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    37: 'left',
    39: 'right',
    46: 'delete',
    191: '/',
    219: '[',
    220: '\\',
    221: ']'
};

// Ref: http://unixpapa.com/js/key.html
export var onKey = function ( event ) {
    var code = event.keyCode,
        key = keys[ code ],
        modifiers = '',
        range = this.getSelection();

    if ( event.defaultPrevented ) {
        return;
    }

    if ( !key ) {
        key = String.fromCharCode( code ).toLowerCase();
        // Only reliable for letters and numbers
        if ( !/^[A-Za-z0-9]$/.test( key ) ) {
            key = '';
        }
    }

    // Function keys
    if ( 111 < code && code < 124 ) {
        key = 'f' + ( code - 111 );
    }

    // We need to apply the backspace/delete handlers regardless of
    // control key modifiers.
    if ( key !== 'backspace' && key !== 'delete' ) {
        if ( event.altKey  ) { modifiers += 'alt-'; }
        if ( event.ctrlKey ) { modifiers += 'ctrl-'; }
        if ( event.metaKey ) { modifiers += 'meta-'; }
        if ( event.shiftKey ) { modifiers += 'shift-'; }
    }
    // However, on Windows, shift-delete is apparently "cut" (WTF right?), so
    // we want to let the browser handle shift-delete in this situation.
    if ( isWin && event.shiftKey && key === 'delete' ) {
        modifiers += 'shift-';
    }

    key = modifiers + key;

    if ( this._keyHandlers[ key ] ) {
        this._keyHandlers[ key ]( this, event, range );
    // !event.isComposing stops us from blatting Kana-Kanji conversion in Safari
    } else if ( !range.collapsed && !event.isComposing &&
            !event.ctrlKey && !event.metaKey &&
            ( event.key || key ).length === 1 ) {
        // Record undo checkpoint.
        this.saveUndoState( range );
        // Delete the selection
        deleteContentsOfRange( range, this._root );
        this._ensureBottomLine();
        this.setSelection( range );
        this._updatePath( range, true );
    }
};

export var mapKeyTo = function ( method ) {
    return function ( self, event ) {
        event.preventDefault();
        self[ method ]();
    };
};

export var mapKeyToFormat = function ( tag, remove ) {
    remove = remove || null;
    return function ( self, event ) {
        event.preventDefault();
        var range = self.getSelection();
        if ( self.hasFormat( tag, null, range ) ) {
            self.changeFormat( null, { tag: tag }, range );
        } else {
            self.changeFormat( { tag: tag }, remove, range );
        }
    };
};

// If you delete the content inside a span with a font styling, Webkit will
// replace it with a <font> tag (!). If you delete all the text inside a
// link in Opera, it won't delete the link. Let's make things consistent. If
// you delete all text inside an inline tag, remove the inline tag.
export var afterDelete = function ( self, range ) {
    try {
        if ( !range ) { range = self.getSelection(); }
        var node = range.startContainer,
            parent;
        // Climb the tree from the focus point while we are inside an empty
        // inline element
        if ( node.nodeType === TEXT_NODE ) {
            node = node.parentNode;
        }
        parent = node;
        while ( isInline( parent ) &&
                ( !parent.textContent || parent.textContent === ZWS ) ) {
            node = parent;
            parent = node.parentNode;
        }
        // If focused in empty inline element
        if ( node !== parent ) {
            // Move focus to just before empty inline(s)
            range.setStart( parent,
                indexOf.call( parent.childNodes, node ) );
            range.collapse( true );
            // Remove empty inline(s)
            parent.removeChild( node );
            // Fix cursor in block
            if ( !isBlock( parent ) ) {
                parent = getPreviousBlock( parent, self._root );
            }
            fixCursor( parent, self._root );
            // Move cursor into text node
            moveRangeBoundariesDownTree( range );
        }
        // If you delete the last character in the sole <div> in Chrome,
        // it removes the div and replaces it with just a <br> inside the
        // root. Detach the <br>; the _ensureBottomLine call will insert a new
        // block.
        if ( node === self._root &&
                ( node = node.firstChild ) && node.nodeName === 'BR' ) {
            detach( node );
        }
        self._ensureBottomLine();
        self.setSelection( range );
        self._updatePath( range, true );
    } catch ( error ) {
        self.didError( error );
    }
};

export var detachUneditableNode = function ( node, root ) {
    var parent;
    while (( parent = node.parentNode )) {
        if ( parent === root || parent.isContentEditable ) {
            break;
        }
        node = parent;
    }
    detach( node );
};

export var handleEnter = function ( self, shiftKey, range ) {
    var root = self._root;
    var block, parent, node, offset, nodeAfterSplit;

    // Save undo checkpoint and add any links in the preceding section.
    // Remove any zws so we don't think there's content in an empty
    // block.
    self._recordUndoState( range );
    if ( self._config.addLinks ) {
        addLinks( range.startContainer, root, self );
    }
    self._removeZWS();
    self._getRangeAndRemoveBookmark( range );

    // Selected text is overwritten, therefore delete the contents
    // to collapse selection.
    if ( !range.collapsed ) {
        deleteContentsOfRange( range, root );
    }

    block = getStartBlockOfRange( range, root );

    // Inside a PRE, insert literal newline, unless on blank line.
    if ( block && ( parent = getNearest( block, root, 'PRE' ) ) ) {
        moveRangeBoundariesDownTree( range );
        node = range.startContainer;
        offset = range.startOffset;
        if ( node.nodeType !== TEXT_NODE ) {
            node = self._doc.createTextNode( '' );
            parent.insertBefore( node, parent.firstChild );
        }
        // If blank line: split and insert default block
        if ( !shiftKey &&
                ( node.data.charAt( offset - 1 ) === '\n' ||
                    rangeDoesStartAtBlockBoundary( range, root ) ) &&
                ( node.data.charAt( offset ) === '\n' ||
                    rangeDoesEndAtBlockBoundary( range, root ) ) ) {
            node.deleteData( offset && offset - 1, offset ? 2 : 1 );
            nodeAfterSplit =
                split( node, offset && offset - 1, root, root );
            node = nodeAfterSplit.previousSibling;
            if ( !node.textContent ) {
                detach( node );
            }
            node = self.createDefaultBlock();
            nodeAfterSplit.parentNode.insertBefore( node, nodeAfterSplit );
            if ( !nodeAfterSplit.textContent ) {
                detach( nodeAfterSplit );
            }
            range.setStart( node, 0 );
        } else {
            node.insertData( offset, '\n' );
            fixCursor( parent, root );
            // Firefox bug: if you set the selection in the text node after
            // the new line, it draws the cursor before the line break still
            // but if you set the selection to the equivalent position
            // in the parent, it works.
            if ( node.length === offset + 1 ) {
                range.setStartAfter( node );
            } else {
                range.setStart( node, offset + 1 );
            }
        }
        range.collapse( true );
        self.setSelection( range );
        self._updatePath( range, true );
        self._docWasChanged();
        return;
    }

    // If this is a malformed bit of document or in a table;
    // just play it safe and insert a <br>.
    if ( !block || shiftKey || /^T[HD]$/.test( block.nodeName ) ) {
        // If inside an <a>, move focus out
        moveRangeBoundaryOutOf( range, 'A', root );
        insertNodeInRange( range, self.createElement( 'BR' ) );
        range.collapse( false );
        self.setSelection( range );
        self._updatePath( range, true );
        return;
    }

    // If in a list, we'll split the LI instead.
    if ( parent = getNearest( block, root, 'LI' ) ) {
        block = parent;
    }

    if ( isEmptyBlock( block ) ) {
        // Break list
        if ( getNearest( block, root, 'UL' ) ||
                getNearest( block, root, 'OL' ) ) {
            return self.decreaseListLevel( range );
        }
        // Break blockquote
        else if ( getNearest( block, root, 'BLOCKQUOTE' ) ) {
            return self.modifyBlocks( removeBlockQuote, range );
        }
    }

    // Otherwise, split at cursor point.
    nodeAfterSplit = splitBlock( self, block,
        range.startContainer, range.startOffset );

    // Clean up any empty inlines if we hit enter at the beginning of the
    // block
    removeZWS( block );
    removeEmptyInlines( block );
    fixCursor( block, root );

    // Focus cursor
    // If there's a <b>/<i> etc. at the beginning of the split
    // make sure we focus inside it.
    while ( nodeAfterSplit.nodeType === ELEMENT_NODE ) {
        var child = nodeAfterSplit.firstChild,
            next;

        // Don't continue links over a block break; unlikely to be the
        // desired outcome.
        if ( nodeAfterSplit.nodeName === 'A' &&
                ( !nodeAfterSplit.textContent ||
                    nodeAfterSplit.textContent === ZWS ) ) {
            child = self._doc.createTextNode( '' );
            replaceWith( nodeAfterSplit, child );
            nodeAfterSplit = child;
            break;
        }

        while ( child && child.nodeType === TEXT_NODE && !child.data ) {
            next = child.nextSibling;
            if ( !next || next.nodeName === 'BR' ) {
                break;
            }
            detach( child );
            child = next;
        }

        // 'BR's essentially don't count; they're a browser hack.
        // If you try to select the contents of a 'BR', FF will not let
        // you type anything!
        if ( !child || child.nodeName === 'BR' ||
                child.nodeType === TEXT_NODE ) {
            break;
        }
        nodeAfterSplit = child;
    }
    range = self.createRange( nodeAfterSplit, 0 );
    self.setSelection( range );
    self._updatePath( range, true );
};

export var keyHandlers = {
    // This song and dance is to force iOS to do enable the shift key
    // automatically on enter. When you do the DOM split manipulation yourself,
    // WebKit doesn't reset the IME state and so presents auto-complete options
    // as though you were continuing to type on the previous line, and doesn't
    // auto-enable the shift key. The old trick of blurring and focussing
    // again no longer works in iOS 13, and I tried various execCommand options
    // but they didn't seem to do anything. The only solution I've found is to
    // let iOS handle the enter key, then after it's done that reset the HTML
    // to what it was before and handle it properly in Squire; the IME state of
    // course doesn't reset so you end up in the correct state!
    enter: isIOS ? function ( self, event, range ) {
        self._saveRangeToBookmark( range );
        var html = self._getHTML();
        var restoreAndDoEnter = function () {
            self.removeEventListener( 'keyup', restoreAndDoEnter );
            self._setHTML( html );
            range = self._getRangeAndRemoveBookmark();
            // Ignore the shift key on iOS, as this is for auto-capitalisation.
            handleEnter( self, false, range );
        };
        self.addEventListener( 'keyup', restoreAndDoEnter );
    } : function ( self, event, range ) {
        event.preventDefault();
        handleEnter( self, event.shiftKey, range );
    },

    'shift-enter': function ( self, event, range ) {
        return self._keyHandlers.enter( self, event, range );
    },

    backspace: function ( self, event, range ) {
        var root = self._root;
        self._removeZWS();
        // Record undo checkpoint.
        self.saveUndoState( range );
        // If not collapsed, delete contents
        if ( !range.collapsed ) {
            event.preventDefault();
            deleteContentsOfRange( range, root );
            afterDelete( self, range );
        }
        // If at beginning of block, merge with previous
        else if ( rangeDoesStartAtBlockBoundary( range, root ) ) {
            event.preventDefault();
            var current = getStartBlockOfRange( range, root );
            var previous;
            if ( !current ) {
                return;
            }
            // In case inline data has somehow got between blocks.
            fixContainer( current.parentNode, root );
            // Now get previous block
            previous = getPreviousBlock( current, root );
            // Must not be at the very beginning of the text area.
            if ( previous ) {
                // If not editable, just delete whole block.
                if ( !previous.isContentEditable ) {
                    detachUneditableNode( previous, root );
                    return;
                }
                // Otherwise merge.
                mergeWithBlock( previous, current, range, root );
                // If deleted line between containers, merge newly adjacent
                // containers.
                current = previous.parentNode;
                while ( current !== root && !current.nextSibling ) {
                    current = current.parentNode;
                }
                if ( current !== root && ( current = current.nextSibling ) ) {
                    mergeContainers( current, root );
                }
                self.setSelection( range );
            }
            // If at very beginning of text area, allow backspace
            // to break lists/blockquote.
            else if ( current ) {
                // Break list
                if ( getNearest( current, root, 'UL' ) ||
                        getNearest( current, root, 'OL' ) ) {
                    return self.decreaseListLevel( range );
                }
                // Break blockquote
                else if ( getNearest( current, root, 'BLOCKQUOTE' ) ) {
                    return self.modifyBlocks( decreaseBlockQuoteLevel, range );
                }
                self.setSelection( range );
                self._updatePath( range, true );
            }
        }
        // Otherwise, leave to browser but check afterwards whether it has
        // left behind an empty inline tag.
        else {
            self.setSelection( range );
            setTimeout( function () { afterDelete( self ); }, 0 );
        }
    },
    'delete': function ( self, event, range ) {
        var root = self._root;
        var current, next, originalRange,
            cursorContainer, cursorOffset, nodeAfterCursor;
        self._removeZWS();
        // Record undo checkpoint.
        self.saveUndoState( range );
        // If not collapsed, delete contents
        if ( !range.collapsed ) {
            event.preventDefault();
            deleteContentsOfRange( range, root );
            afterDelete( self, range );
        }
        // If at end of block, merge next into this block
        else if ( rangeDoesEndAtBlockBoundary( range, root ) ) {
            event.preventDefault();
            current = getStartBlockOfRange( range, root );
            if ( !current ) {
                return;
            }
            // In case inline data has somehow got between blocks.
            fixContainer( current.parentNode, root );
            // Now get next block
            next = getNextBlock( current, root );
            // Must not be at the very end of the text area.
            if ( next ) {
                // If not editable, just delete whole block.
                if ( !next.isContentEditable ) {
                    detachUneditableNode( next, root );
                    return;
                }
                // Otherwise merge.
                mergeWithBlock( current, next, range, root );
                // If deleted line between containers, merge newly adjacent
                // containers.
                next = current.parentNode;
                while ( next !== root && !next.nextSibling ) {
                    next = next.parentNode;
                }
                if ( next !== root && ( next = next.nextSibling ) ) {
                    mergeContainers( next, root );
                }
                self.setSelection( range );
                self._updatePath( range, true );
            }
        }
        // Otherwise, leave to browser but check afterwards whether it has
        // left behind an empty inline tag.
        else {
            // But first check if the cursor is just before an IMG tag. If so,
            // delete it ourselves, because the browser won't if it is not
            // inline.
            originalRange = range.cloneRange();
            moveRangeBoundariesUpTree( range, root, root, root );
            cursorContainer = range.endContainer;
            cursorOffset = range.endOffset;
            if ( cursorContainer.nodeType === ELEMENT_NODE ) {
                nodeAfterCursor = cursorContainer.childNodes[ cursorOffset ];
                if ( nodeAfterCursor && nodeAfterCursor.nodeName === 'IMG' ) {
                    event.preventDefault();
                    detach( nodeAfterCursor );
                    moveRangeBoundariesDownTree( range );
                    afterDelete( self, range );
                    return;
                }
            }
            self.setSelection( originalRange );
            setTimeout( function () { afterDelete( self ); }, 0 );
        }
    },
    tab: function ( self, event, range ) {
        var root = self._root;
        var node, parent;
        self._removeZWS();
        // If no selection and at start of block
        if ( range.collapsed && rangeDoesStartAtBlockBoundary( range, root ) ) {
            node = getStartBlockOfRange( range, root );
            // Iterate through the block's parents
            while ( ( parent = node.parentNode ) ) {
                // If we find a UL or OL (so are in a list, node must be an LI)
                if ( parent.nodeName === 'UL' || parent.nodeName === 'OL' ) {
                    // Then increase the list level
                    event.preventDefault();
                    self.increaseListLevel( range );
                    break;
                }
                node = parent;
            }
        }
    },
    'shift-tab': function ( self, event, range ) {
        var root = self._root;
        var node;
        self._removeZWS();
        // If no selection and at start of block
        if ( range.collapsed && rangeDoesStartAtBlockBoundary( range, root ) ) {
            // Break list
            node = range.startContainer;
            if ( getNearest( node, root, 'UL' ) ||
                    getNearest( node, root, 'OL' ) ) {
                event.preventDefault();
                self.decreaseListLevel( range );
            }
        }
    },
    space: function ( self, _, range ) {
        var node;
        var root = self._root;
        self._recordUndoState( range );
        if ( self._config.addLinks ) {
            addLinks( range.startContainer, root, self );
        }
        self._getRangeAndRemoveBookmark( range );

        // If the cursor is at the end of a link (<a>foo|</a>) then move it
        // outside of the link (<a>foo</a>|) so that the space is not part of
        // the link text.
        node = range.endContainer;
        if ( range.collapsed && range.endOffset === getLength( node ) ) {
            do {
                if ( node.nodeName === 'A' ) {
                    range.setStartAfter( node );
                    break;
                }
            } while ( !node.nextSibling &&
                ( node = node.parentNode ) && node !== root );
        }
        // Delete the selection if not collapsed
        if ( !range.collapsed ) {
            deleteContentsOfRange( range, root );
            self._ensureBottomLine();
            self.setSelection( range );
            self._updatePath( range, true );
        }

        self.setSelection( range );
    },
    left: function ( self ) {
        self._removeZWS();
    },
    right: function ( self ) {
        self._removeZWS();
    }
};

// Firefox pre v29 incorrectly handles Cmd-left/Cmd-right on Mac:
// it goes back/forward in history! Override to do the right
// thing.
// https://bugzilla.mozilla.org/show_bug.cgi?id=289384
if ( isMac && isGecko ) {
    keyHandlers[ 'meta-left' ] = function ( self, event ) {
        event.preventDefault();
        var sel = getWindowSelection( self );
        if ( sel && sel.modify ) {
            sel.modify( 'move', 'backward', 'lineboundary' );
        }
    };
    keyHandlers[ 'meta-right' ] = function ( self, event ) {
        event.preventDefault();
        var sel = getWindowSelection( self );
        if ( sel && sel.modify ) {
            sel.modify( 'move', 'forward', 'lineboundary' );
        }
    };
}

// System standard for page up/down on Mac is to just scroll, not move the
// cursor. On Linux/Windows, it should move the cursor, but some browsers don't
// implement this natively. Override to support it.
if ( !isMac ) {
    keyHandlers.pageup = function ( self ) {
        self.moveCursorToStart();
    };
    keyHandlers.pagedown = function ( self ) {
        self.moveCursorToEnd();
    };
}

const changeIndentationLevel = function ( methodIfInQuote, methodIfInList ) {
    return function ( self, event ) {
        event.preventDefault();
        var path = self.getPath();
        if ( /(?:^|>)BLOCKQUOTE/.test( path ) ||
                !/(?:^|>)[OU]L/.test( path ) ) {
            self[ methodIfInQuote ]();
        } else {
            self[ methodIfInList ]();
        }
    };
};

const toggleList = function ( listRegex, methodIfNotInList ) {
    return function ( self, event ) {
        event.preventDefault();
        var path = self.getPath();
        if ( !listRegex.test( path ) ) {
            self[ methodIfNotInList ]();
        } else {
            self.removeList();
        }
    };
};

keyHandlers[ ctrlKey + 'b' ] = mapKeyToFormat( 'B' );
keyHandlers[ ctrlKey + 'i' ] = mapKeyToFormat( 'I' );
keyHandlers[ ctrlKey + 'u' ] = mapKeyToFormat( 'U' );
keyHandlers[ ctrlKey + 'shift-7' ] = mapKeyToFormat( 'S' );
keyHandlers[ ctrlKey + 'shift-5' ] = mapKeyToFormat( 'SUB', { tag: 'SUP' } );
keyHandlers[ ctrlKey + 'shift-6' ] = mapKeyToFormat( 'SUP', { tag: 'SUB' } );
keyHandlers[ ctrlKey + 'shift-8' ] =
    toggleList( /(?:^|>)UL/, 'makeUnorderedList' );
keyHandlers[ ctrlKey + 'shift-9' ] =
    toggleList( /(?:^|>)OL/, 'makeOrderedList' );
keyHandlers[ ctrlKey + '[' ] =
    changeIndentationLevel( 'decreaseQuoteLevel', 'decreaseListLevel' );
keyHandlers[ ctrlKey + ']' ] =
    changeIndentationLevel( 'increaseQuoteLevel', 'increaseListLevel' );
keyHandlers[ ctrlKey + 'd' ] = mapKeyTo( 'toggleCode' );
keyHandlers[ ctrlKey + 'y' ] = mapKeyTo( 'redo' );
keyHandlers[ ctrlKey + 'z' ] = mapKeyTo( 'undo' );
keyHandlers[ ctrlKey + 'shift-z' ] = mapKeyTo( 'redo' );
