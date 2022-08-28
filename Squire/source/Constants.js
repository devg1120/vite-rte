/*jshint strict:false, undef:false, unused:false */

export var DOCUMENT_POSITION_PRECEDING = 2; // Node.DOCUMENT_POSITION_PRECEDING
export var ELEMENT_NODE = 1;                // Node.ELEMENT_NODE;
export var TEXT_NODE = 3;                   // Node.TEXT_NODE;
export var DOCUMENT_NODE = 9;               // Node.DOCUMENT_NODE;
export var DOCUMENT_FRAGMENT_NODE = 11;     // Node.DOCUMENT_FRAGMENT_NODE;
export var SHOW_ELEMENT = 1;                // NodeFilter.SHOW_ELEMENT;
export var SHOW_TEXT = 4;                   // NodeFilter.SHOW_TEXT;
 
export var START_TO_START = 0; // Range.START_TO_START
export var START_TO_END = 1;   // Range.START_TO_END
export var END_TO_END = 2;     // Range.END_TO_END
export var END_TO_START = 3;   // Range.END_TO_START
 
export var ZWS = '\u200B';

//var win = doc.defaultView;

export var ua = navigator.userAgent;

export var isAndroid = /Android/.test( ua );
export var isMac = /Mac OS X/.test( ua );
export var isWin = /Windows NT/.test( ua );
export var isIOS = /iP(?:ad|hone|od)/.test( ua ) ||
    ( isMac && !!navigator.maxTouchPoints );

export var isGecko = /Gecko\//.test( ua );
export var isEdge = /Edge\//.test( ua );
export var isWebKit = !isEdge && /WebKit\//.test( ua );
export var isIE = /Trident\/[4567]\./.test( ua );

export var ctrlKey = isMac ? 'meta-' : 'ctrl-';

export var cantFocusEmptyTextNodes = isWebKit;

export var canObserveMutations = typeof MutationObserver !== 'undefined';
export var canWeakMap = typeof WeakMap !== 'undefined';

// Use [^ \t\r\n] instead of \S so that nbsp does not count as white-space
export var notWS = /[^ \t\r\n]/;

export var indexOf = Array.prototype.indexOf;
