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

const changeBgColor = (e) => {
	//var c = colorPicker.value;
        const c = e.currentTarget.value;
	//console.log(c);
        editor["setHighlightColour"](c);
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

const setBgColor = (e) => {
    const action = e.currentTarget.id;
    let param = action.split('_');
    editor["setHighlightColour"](param[1]);
	/*
    if (action == "red") {
        editor["setTextColour"]("red");
    } else if (action == "red") {
    } else if (action == "red") {
    } else if (action == "red") {
    }
    */
};
const setFontName = (e) => {
        //const c = e.currentTarget.value;
	//console.log(c);
        editor["setFontFace"]("Noto Sans JP");
	//https://ics.media/entry/13498/
	//Noto Sans JP
	//源ノ角ゴシック
	//みんなの文字
	//M+ Type-2
};
const setFontSize = (e) => {
        //const c = e.currentTarget.value;
	//console.log(c);
        editor["setFontSize"](30);
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
document.getElementById('white').addEventListener('click', setColor);

document.getElementById('bg_red').addEventListener('click', setBgColor);
document.getElementById('bg_blue').addEventListener('click', setBgColor);
document.getElementById('bg_green').addEventListener('click', setBgColor);
document.getElementById('bg_yellow').addEventListener('click', setBgColor);
document.getElementById('bg_white').addEventListener('click', setBgColor);

document.getElementById('fontname').addEventListener('click', setFontName);
document.getElementById('fontsize').addEventListener('click', setFontSize);
document.getElementById('colorsel').addEventListener('click', clickBtn1);
document.getElementById('fontsel').addEventListener('click', clickBtn2);

document.getElementById('select_color').addEventListener('change', change_color);
document.getElementById('fontsizesel').addEventListener('click', change_font_size);

change_color();

function change_color(){

	console.log("change color");
	const color = document.form1.color;

	// 値(数値)を取得
	const num = color.selectedIndex;
	//const num = document.form1.color1.selectedIndex;

	// 値(数値)から値(value値)を取得
	const str = color.options[num].value;
        //document.getElementById('select_color').classList.remove('red blue green yellow').classList.add(str);
        color.classList.remove('red');
        color.classList.remove('blue');
        color.classList.remove('green');
        color.classList.remove('yellow');
        color.classList.add(str);

}

function change_font_size(){

	console.log("change font size");
        let spin_font_size = document.getElementById('spin_font_size');
	console.log(spin_font_size.value);
	let size = parseInt(spin_font_size.value);
       //editor["setFontSize"](spin_font_size.value);
       editor["setFontSize"](size);


}
function clickBtn1(){

	const color = document.form1.color;

	// 値(数値)を取得
	const num = color.selectedIndex;
	//const num = document.form1.color1.selectedIndex;

	// 値(数値)から値(value値)を取得
	const str = color.options[num].value;
	console.log(str);
        editor["setTextColour"](str);
}
function clickBtn2(){

	const font = document.form2.font;

	// 値(数値)を取得
	const num = font.selectedIndex;
	//const num = document.form1.color1.selectedIndex;

	// 値(数値)から値(value値)を取得
	const str = font.options[num].value;
	console.log(str);
        editor["setFontFace"](str);
}

// SPIN BUTTON
//vanilla jsで親要素探索する用の関数
function getParents(el, parentSelector /* optional */) {
    if (parentSelector === undefined) {
        return false;
    }

    var p = el.parentNode;

    while (!p.classList.contains(parentSelector)) {
        var o = p;
        p = o.parentNode;
    }
    return p;
}



document.addEventListener('click',function(e){
  e = e || window.event;
  var target = e.target || e.srcElement,
      text = target.textContent || target.innerText;

  var val = 0;

  //クリックしたDOMが.js-qty_upだったら
  if(target.classList.contains('js-qty_up')){
    val = 1;
  } else if(target.classList.contains('js-qty_down')) {
    val = -1;
  } else {
    return false;
  }
  var parent = getParents(target,'js-qty');//親の.js-qtyを取得して
  var input = parent.querySelectorAll('.js-qty_target');//親の.js-qtyの子の.js-qty_targetを取得して
  //Nodelistを回す
  for (let i = 0; i < input.length; i++) {
    if(input[i].classList.contains('js-qty_target')){
      //.js-qty_target持ってるDOMに対して
      var num = parseInt(input[i].value);
      num = isNaN(num) ? 1 : num;
      input[i].value = num + val < 1 ? 1 : num + val;
    }
  }

},false);

