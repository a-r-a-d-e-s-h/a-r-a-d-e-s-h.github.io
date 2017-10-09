var imageSize = [109, 109];

var kanjiPerRow = 7;
var rowsPerPage = 5;


function getKanji() {
 var request = new XMLHttpRequest();
 request.onreadystatechange = function() {
  if (request.readyState == 4 && request.status == 200)
   parseLines(request.responseText);
 };
 request.overrideMimeType('text/plain');
 request.open("GET", "kanji.data", true);
 request.send(null);
}

function parseLines(rawData) {
 rawData = rawData.replace(/\r/g, '');
 var lines = rawData.split('\n');
 var processedLines = [];
 for(var i=0; i<lines.length; i++){
     var parsed = parseLine(lines[i]);
     if(!parsed) continue;
     processedLines.push(parsed);
 }
 setup(processedLines);
}

function parseLine(line) {
    if (line.length == 0) return false;
    var parts = line.split('#');
    var number = parts.splice(0,1)[0].match(/[0-9]+/);
    if (number.length == 0) return false;
    number = number[0];
    var comment = parts.join('#').replace(/^[\s]+|[\s]+$/g, '');
    var toReturn = {'number': number};
    if (comment.length > 0) toReturn['comment'] = comment;
    return toReturn;    
}

function kanjiItem(val) {
    var container = kanjiContainer();
    var img = new strokeImg(val);
    var links = naviLinks(img);
    container.appendChild(img.elem);
    container.appendChild(links);
    return container;
}

function kanjiContainer(){
 var e = document.createElement('div');
 e.setAttribute('class', 'kanji-container');
 return e;
}

function strokeImg(val) {
 var e = document.createElement('div');
 e.setAttribute('class', 'stroke-image');
 e.setAttribute('id', 'kanji_' + val['number']);
 if(val.hasOwnProperty('comment')){
     e.setAttribute('title', val['comment']);
 }
 var src = "url('images/" + val['number'] + "_frames.png')";
 e.style['background-image'] = src;
 this.elem = e;
 var bgPos = [imageSize[0], 0];
 this.translate = function (x, y) {
  bgPos[0] += x;
  bgPos[1] += y;
  e.style['background-position'] = bgPos[0] + 'px ' + bgPos[1] + 'px';
 }
 this.translate(0, 0);
}

function naviLinks(img) {
 var e = document.createElement('div');
 e.setAttribute('class', 'navi-links');
 e.appendChild(naviButton('<', 1, img));
 e.appendChild(naviButton('>', -1, img));
 return e;
}

function naviButton(text, direction, img) {
 var button = document.createElement('div');
 var container = document.createElement('div');
 button.setAttribute('class', 'navi-button');
 container.setAttribute('class', 'navi-button-container');
 function move(d) {
  return function (event) {
   event.preventDefault();
   img.translate(imageSize[0]*d, 0);
  }
 }
 button.addEventListener('click', move(direction));
 var t = document.createElement('a');
 t.setAttribute('href', '');
 t.innerHTML = text;
 button.appendChild(t);
 container.appendChild(button);
 return container;
}

function pageObj(pageNum) {
 var e = this.elem = document.createElement('div');
 e.setAttribute('id', 'page' + pageNum);
 this.row = document.createElement('div');
 e.appendChild(this.row);
 this.addRow = function() {
  this.row = document.createElement('div');
  e.appendChild(this.row); 
 }
 this.addKanji = function(val) {
  this.row.appendChild(kanjiItem(val));
 }
}

function createPage(kanjiPerRow, kanjiVals, pageNum){
 var elem = document.createElement('div');
 elem.setAttribute('id', 'page' + pageNum);
 while(kanjiVals.length) {
  var row = document.createElement('div');
  var nextKanji = kanjiVals.splice(0, kanjiPerRow);
  for(var i=0; i < nextKanji.length; i++)
   row.appendChild(kanjiItem(nextKanji[i]));
  elem.appendChild(row);
 }
 function hide(){
     elem.style.display = 'none';
 }
 function show() {
     elem.style.display = 'block';
 }
 var page = {
     'elem': elem,
     'hide': hide,
     'show': show,
 }
 return page;
}

function createNavigation(pages) {
 var navBar = document.createElement('div');
 navBar.setAttribute('class', 'nav-bar');

 function setSelected(elem, show){
     if (show === undefined) show = true;
     var classes = elem.getAttribute('class');
     if (classes.length == 0) {classes = [];}
     else {classes = classes.split(' ');}
     if(classes.indexOf('selected') < 0) {
        if(show) classes.push('selected');}
     else {
         if(!show) classes.splice(classes.indexOf('selected'), 1);
     }
     elem.setAttribute('class', classes.join(' '));
 }
 
 function swapToPage(pages, i){
  function handler(event) {
   if(!!event)
     event.preventDefault();
   for(var j=0;j<pages.length;j++){
    pages[j].hide();
    setSelected(navBarButtons[j], false);
   }
   pages[i].show();
   setSelected(navBarButtons[i]);
  }
  return handler;
 }
 var navBarButtons = [];
 for(var i=0; i<pages.length;i++){
  var link = document.createElement('a');
  navBarButtons.push(link);
  link.setAttribute('href', '');
  link.setAttribute('class', '');
  link.innerHTML = ("Page " + (i+1));
  //link.addEventListener("click", swapToPage(pages, i));
  (function(i){
  link.addEventListener("click", function(e) {
      e.preventDefault();
      window.location.hash = 'p='+(i+1);});
  navBar.appendChild(link);})(i);
 }
 
 function getPageNo(){
     var pageNo = window.location.hash.match(/p=[0-9]+/);
     if (!! pageNo) {
         pageNo = pageNo[0].split('=')[1];
     }
     else {pageNo = 1};
     if (pageNo > pages.length || pageNo < 1){
         pageNo = 1;
     }
     return pageNo;
 }
 var pageNo = getPageNo();
 swapToPage(pages, pageNo-1)();
 window.addEventListener('hashchange', function(event) {
     swapToPage(pages, getPageNo() - 1)();
 });
 return navBar;
}

function setup(kanjiVals) {
 var mainDiv = document.getElementById('main');
 var totalKanji = kanjiVals.length;
 var kanjiPerPage = kanjiPerRow*rowsPerPage;
 var totalPages = Math.ceil(totalKanji/kanjiPerPage);

 var pages = [];
 for (var i=0; i<totalPages; i++){
  pages.push(createPage(kanjiPerRow, kanjiVals.splice(0, kanjiPerPage), i));
 }

 if (pages.length === 1) {
  mainDiv.appendChild(pages[0].elem);
  return;
 }
 mainDiv.appendChild(createNavigation(pages));
 for(var i=0; i<pages.length; i++)
  mainDiv.appendChild(pages[i].elem);
}

function setGoFuntion(f) {
    var go = document.getElementById('go-button');
}
