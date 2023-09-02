//download.js v4.21, by dandavis; 2008-2018. [MIT] see http://danml.com/download.html for tests/usage
;(function(root,factory){typeof define=="function"&&define.amd?define([],factory):typeof exports=="object"?module.exports=factory():root.download=factory()})(this,function(){return function download(data,strFileName,strMimeType){var self=window,defaultMime="application/octet-stream",mimeType=strMimeType||defaultMime,payload=data,url=!strFileName&&!strMimeType&&payload,anchor=document.createElement("a"),toString=function(a){return String(a)},myBlob=self.Blob||self.MozBlob||self.WebKitBlob||toString,fileName=strFileName||"download",blob,reader;myBlob=myBlob.call?myBlob.bind(self):Blob,String(this)==="true"&&(payload=[payload,mimeType],mimeType=payload[0],payload=payload[1]);if(url&&url.length<2048){fileName=url.split("/").pop().split("?")[0],anchor.href=url;if(anchor.href.indexOf(url)!==-1){var ajax=new XMLHttpRequest;return ajax.open("GET",url,!0),ajax.responseType="blob",ajax.onload=function(e){download(e.target.response,fileName,defaultMime)},setTimeout(function(){ajax.send()},0),ajax}}if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)){if(!(payload.length>2096103.424&&myBlob!==toString))return navigator.msSaveBlob?navigator.msSaveBlob(dataUrlToBlob(payload),fileName):saver(payload);payload=dataUrlToBlob(payload),mimeType=payload.type||defaultMime}else if(/([\x80-\xff])/.test(payload)){var i=0,tempUiArr=new Uint8Array(payload.length),mx=tempUiArr.length;for(i;i<mx;++i)tempUiArr[i]=payload.charCodeAt(i);payload=new myBlob([tempUiArr],{type:mimeType})}blob=payload instanceof myBlob?payload:new myBlob([payload],{type:mimeType});function dataUrlToBlob(strUrl){var parts=strUrl.split(/[:;,]/),type=parts[1],indexDecoder=strUrl.indexOf("charset")>0?3:2,decoder=parts[indexDecoder]=="base64"?atob:decodeURIComponent,binData=decoder(parts.pop()),mx=binData.length,i=0,uiArr=new Uint8Array(mx);for(i;i<mx;++i)uiArr[i]=binData.charCodeAt(i);return new myBlob([uiArr],{type:type})}function saver(url,winMode){if("download"in anchor)return anchor.href=url,anchor.setAttribute("download",fileName),anchor.className="download-js-link",anchor.innerHTML="downloading...",anchor.style.display="none",anchor.addEventListener("click",function(e){e.stopPropagation(),this.removeEventListener("click",arguments.callee)}),document.body.appendChild(anchor),setTimeout(function(){anchor.click(),document.body.removeChild(anchor),winMode===!0&&setTimeout(function(){self.URL.revokeObjectURL(anchor.href)},250)},66),!0;if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent))return/^data:/.test(url)&&(url="data:"+url.replace(/^data:([\w\/\-\+]+)/,defaultMime)),window.open(url)||confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")&&(location.href=url),!0;var f=document.createElement("iframe");document.body.appendChild(f),!winMode&&/^data:/.test(url)&&(url="data:"+url.replace(/^data:([\w\/\-\+]+)/,defaultMime)),f.src=url,setTimeout(function(){document.body.removeChild(f)},333)}if(navigator.msSaveBlob)return navigator.msSaveBlob(blob,fileName);if(self.URL)saver(self.URL.createObjectURL(blob),!0);else{if(typeof blob=="string"||blob.constructor===toString)try{return saver("data:"+mimeType+";base64,"+self.btoa(blob))}catch(y){return saver("data:"+mimeType+","+encodeURIComponent(blob))}reader=new FileReader,reader.onload=function(e){saver(this.result)},reader.readAsDataURL(blob)}return!0}});

if (typeof (window.__pages) === 'undefined') {
  window.__pages = {};
}
if (typeof (window.__user) === 'undefined') {
  window.__user = {};
}
if (typeof (window.__io) === 'undefined') {
  if(typeof (io) !== 'undefined')
    window.__socket = io({ path: '/messaging' });
}
; (function ($, w) {
  var pictureList = [
    'https://img1.imgtp.com/2023/04/09/ZMRxygwS.jpeg',
    'https://img1.imgtp.com/2023/04/09/E0bdK0tl.jpeg'
  ];
  w.__utility = {
    stopEvent: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    },
    loading: function (isLoading, jLoading) {
      if (typeof (jLoading) === 'undefined') {
        jLoading = $('.data-loading');
      }
      if (isLoading) {
        jLoading.removeClass('visually-hidden');
      }
      else {
        jLoading.addClass('visually-hidden');
      }
    },
    randomBackground: function () {
      var r = Math.floor(Math.random() * pictureList.length);
      var backgroundUrl = pictureList[r];
      var backgroundImage = new Image();
      backgroundImage.onload = function () {
        $('body').css('background-image', `url(${backgroundUrl})`);
      };
      backgroundImage.src = backgroundUrl;
      setTimeout(function () {
        w.__utility.randomBackground();
      }, 60000);
    },
    join: function(type, typeId) {
      w.__socket.emit(`join:${type}`, typeId);
    },
    reloadPage: function(timeout) {
      setTimeout(function() {
        w.location.reload();
      }, typeof(timeout) === 'undefined' ? 1000 : timeout);
    },
    storage: {
      save: function(key, value) {
        w.localStorage.setItem(key, value);
      },
      get: function(key) {
        return w.localStorage.getItem(key);
      },
      remove: function(key) {
        w.localStorage.removeItem(key);
      }
    },
  };
  var pages = {
    __call: function (entries, method, params) {
      for (var i in entries) {
        if (typeof (w.__pages[entries[i]]) === 'object') {
          if (typeof (w.__pages[entries[i]][method]) === 'function') {
            w.__pages[entries[i]][method].apply(params);
            $(`.menu-${entries[i]}`).addClass('active');
          }
        }
      }
    },
    init: function (className) {
      if(className) {
        var entries = className.split(' ');
        console.log(`### INIT: ${entries.join(', ').toUpperCase()} ###`);
        pages.__call(entries, 'init', {});
      }
      w.__utility.randomBackground();
    }
  };

  var jbody = $('body');
  var jclass = jbody.attr('class');
  w.__pages = Object.assign(w.__pages, pages);
  w.__pages.init(jclass);
})(jQuery, window);