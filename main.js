import './style.css';
import './fa/css/all.min.css';

import {Squire}  from  './Squire/source/Editor';

  var div = document.getElementById( 'editor' );
  var editor = new Squire( div, {
      blockTag: 'p',
      blockAttributes: {'class': 'paragraph'},
      tagAttributes: {
          ul: {'class': 'UL'},
          ol: {'class': 'OL'},
          li: {'class': 'listItem'},
          a: {'target': '_blank'},
          pre: {
              style: 'border-radius:3px;border:1px solid #ccc;padding:7px 10px;background:#f6f6f6;font-family:menlo,consolas,monospace;font-size:90%;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;'
          },
          code: {
              style: 'border-radius:3px;border:1px solid #ccc;padding:1px 3px;background:#f6f6f6;font-family:menlo,consolas,monospace;font-size:90%;'
          },
      }
  });
/*
  Squire.prototype.makeHeader = function() {
    return this.modifyBlocks( function( frag ) {
      var output = this._doc.createDocumentFragment();
      var block = frag;
      while ( block = Squire.getNextBlock( block ) ) {
        output.appendChild(
          this.createElement( 'h2', [ Squire.empty( block ) ] )
        );
      }
      return output;
    });
  };

  document.addEventListener( 'click', function ( e ) {
    var id = e.target.id,
        value;
    if ( id && editor && editor[ id ] ) {
      if ( e.target.className === 'prompt' ) {
        value = prompt( 'Value:' );
      }
      editor[ id ]( value );
    }
  }, false );
*/

let state = {
    bold: false,
    italic: false,
    underline: false
};

//const colorPicker = document.getElementById('colorBox');

const removeActions = {
    bold: 'removeBold',
    italic: 'removeItalic',
    underline: 'removeUnderline'
}

const activate = (e, action) => {
    e.currentTarget.classList.add("active");
    editor[action]();
};

const disable = (e, action) => {
    e.currentTarget.classList.remove("active");
    editor[removeActions[action]]();
}

const changeActive = (e) => {
    const action = e.currentTarget.id;
    if(action in removeActions) {
        state[action] = !state[action];
        if(state[action]) {
            activate(e, action);
        } else {
            disable(e, action);
        }
    } else {
        editor[action]();
    }
};

/*
const changeColor = (e) => {
	var c = colorPicker.value;
	console.log(c);
        editor["setTextColour"](c);
};
*/

const changeColor = (e) => {
	//var c = colorPicker.value;
        const c = e.currentTarget.value;
	//console.log(c);
        editor["setTextColour"](c);
};

const setColor = (e) => {
    const action = e.currentTarget.id;
    editor["setTextColour"](action);
	/*
    if (action == "red") {
        editor["setTextColour"]("red");
    } else if (action == "red") {
    } else if (action == "red") {
    } else if (action == "red") {
    }
    */
};

/*
 * proto.bold = command( 'changeFormat', { tag: 'B' } );
 * proto.italic = command( 'changeFormat', { tag: 'I' } );
 * proto.underline = command( 'changeFormat', { tag: 'U' } );
 * proto.strikethrough = command( 'changeFormat', { tag: 'S' } );
 * proto.subscript = command( 'changeFormat', { tag: 'SUB' }, { tag: 'SUP' } );
 * proto.superscript = command( 'changeFormat', { tag: 'SUP' }, { tag: 'SUB' } );
 * 
 * proto.removeBold = command( 'changeFormat', null, { tag: 'B' } );
 * proto.removeItalic = command( 'changeFormat', null, { tag: 'I' } );
 * proto.removeUnderline = command( 'changeFormat', null, { tag: 'U' } );
 * proto.removeStrikethrough = command( 'changeFormat', null, { tag: 'S' } );
 * proto.removeSubscript = command( 'changeFormat', null, { tag: 'SUB' } );
 * proto.removeSuperscript = command( 'changeFormat', null, { tag: 'SUP' } );
 * proto.makeLink = function ( url, attributes ) {
 * proto.removeLink = function () {
 * proto.setFontFace = function ( name ) 
 * proto.setFontSize = function ( size ) 
 * proto.setTextColour = function ( colour ) 
 * proto.setHighlightColour = function ( colour ) 
 * proto.setTextAlignment = function ( alignment ) 
 * proto.setTextDirection = function ( direction ) 
 * var addPre = function ( frag ) {
 * var removePre = function ( frag ) {
 * proto.code = function () 
 * proto.removeCode = function () {
 *
 */

document.getElementById('bold').addEventListener('click', changeActive);
document.getElementById('italic').addEventListener('click', changeActive);
document.getElementById('underline').addEventListener('click', changeActive);
document.getElementById('makeOrderedList').addEventListener('click', changeActive);
//document.getElementById('setTextColour').addEventListener('click', changeColor);
document.getElementById('colorBox').addEventListener('input', changeColor);

document.getElementById('red').addEventListener('click', setColor);
document.getElementById('blue').addEventListener('click', setColor);
document.getElementById('green').addEventListener('click', setColor);
document.getElementById('yellow').addEventListener('click', setColor);

