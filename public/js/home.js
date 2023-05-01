if(typeof(window.__pages) === 'undefined') {
  window.__pages = {};
}

;(function($, w){
  var jHistoryScroll = $('.chat-history');
  var jHistory = jHistoryScroll.find('.list');

  var jUserScroll = $('.chat-users');
  var jUserList = jUserScroll.find('.list');

  var jNickname = $('.form-view .nickname');
  var jRoom = $('.form-view .room');
  var jMessage = $('.message-view');
  var jToWhom = $('.tool-view .to input');

  var CONSTS = {
    __EVERYONE: '大家',
    // __AI: '机器人'
  };

  var VARS = {
    timestamp: 0,
    files: {
      // Cached data for receiver
      receive: {},
      // Cached data for sender
      transfer: {}
    },
  };

  var TYPES = {
    CHAT: 'CHAT',
    FILE: 'FILE',
  };

  var KEYS = {
    ID: 'ID',
  };

  var storage = {
    save(key, value) {
      w.localStorage.setItem(key, value);
    },
    get(key) {
      return w.localStorage.getItem(key);
    }
  };

  var methods = {
    getId() {
      return `${new Date().getTime().toString(16)}-${Math.random().toString(16).substring(2)}`.toUpperCase();
    },
    time() {
      var date = new Date();
      // var year = date.getFullYear();
      // var month = date.getMonth() + 1;
      // var day = date.getDate();
      var minute = date.getMinutes();
      // var second = date.getSeconds();
      var hour = date.getHours();
      // var monString = (month < 10) ? `0${month}` : month;
      // var dayString = (day < 10) ? `0${day}` : day;
      var hourString = (hour < 10) ? `0${hour}` : hour;
      var minString = (minute < 10) ? `0${minute}` : minute;
      // var secString = (second < 10) ? `0${second}` : second;
      // return `${year}-${monString}-${dayString} ${hourString}:${minString}:${secString}`
      return `${hourString}:${minString}`; //:${secString}
    },
    list(users) {
      jUserList.empty();
      for(var key in CONSTS) {
        jUserList.append(`
          <li id="user-${key}"><a href="javascript:;" data-id="${key}" data-name="${CONSTS[key]}">${CONSTS[key]}</a></li>
        `);
      }

      var sortedUsers = [];
      
      if(users) {
        sortedUsers = users.sort((a, b) => {
          if (a.self) return -1;
          if (b.self) return 1;
          if (a.nickname < b.nickname) return -1;
          return a.nickname > b.nickname ? 1 : 0;
        });
      }

      for(var i in sortedUsers) {
        var user = sortedUsers[i];
        if(user.nickname) {
          var classAttribute = '';
          var selectedId = jToWhom.data('id');
          if(selectedId === user.sid) {
            classAttribute = ' class="active"';
          }
          if(user.sid === w.__user.sid) { continue; }
          jUserList.append(`
            <li id="user-${user.sid}"${classAttribute}><a href="javascript:;" data-id="${user.sid}" data-name="${user.nickname}">${user.nickname}</a></li>
          `);
        }
      }
    },
    chat(input, data) {
      var message = '';
      var current = new Date();
      var timestamp = current.getTime();
      var displayTime = timestamp - VARS.timestamp > 180000;

      if(data) {
        var classAttribute = data.is_private ? ' private' : data.to.id === w.__user.sid ? ' highlight' : '';
        var toWhom =  data.to.id === '__EVERYONE'
            ? ''
            : `<a class="user" data-id="${data.to.id}" data-name="${data.to.nickname}">@${data.to.nickname}</a>`;
        if(w.__user.sid === data.from.id) {
          message = `
            <li class="me${classAttribute}">
              ${toWhom}
              <span class="message">${input}</span>
            </li>
          `;
        }
        else {
          message = `
            <li class="other${classAttribute}">
              <a class="user" data-id="${data.from.id}" data-name="${data.from.nickname}">${data.from.nickname}</a>
              ${toWhom}
              <span class="message">${input}</span>
            </li>
          `;
        }
      }
      else {
        message = `
          <li class="notification">${input}</i></li>
        `;
      }
      if(displayTime) {
        jHistory.append(`<li class="time">${methods.time()}</li>`);
        VARS.timestamp = timestamp;
      }
      var jMessageLog = $(message);
      if(data && data.metadata && data.metadata.type === TYPES.FILE) {
        var actionButtons = ``;
        if(data.to.id === w.__user.sid) {
          actionButtons = `
            <a class="accept">[接收]</a>
            <a class="reject">[拒绝]</a>
          `;
        }
        jMessageLog.append(`
        <div class="file" id="file-${data.metadata.file.id}"
          data-file-id="${data.metadata.file.id}"
          data-file-name="${data.metadata.file.name}"
          data-file-size="${data.metadata.file.size}"
          data-from-id="${data.from.id}"
          data-from-nickname="${data.from.nickname}"
          data-to-id="${data.to.id}"
          data-to-nickname="${data.to.nickname}"
          data-is-private="${data.is_private}"
          >
          ${actionButtons}
          <span class="progress"></span>
        </div>`);
      }
      jHistory.append(jMessageLog);

      jHistoryScroll.scrollTop(jHistoryScroll[0].scrollHeight);
    },
    mount() {
      w.__socket.on('connect', function() {
        console.log('### CONNECTED ###');
        methods.login(true);
      });
      w.__socket.on('welcome', function(data) {
        console.log('### WELCOME ###');

        if(w.__socket.id === data.user.id) {
          // Logged in
          w.__user.id = data.user.sid;
          w.__user.nickname = data.user.nickname;
          w.__user.room = data.user.room;
          w.__user.sid = data.user.sid;

          storage.save(KEYS.ID, data.user.sid);

          $('.login-views').hide();
          $('.chat-views').addClass('display');
        }

        methods.list(data.users);

        if(data.is_reconnect) {
          return console.warn('### RECONNECT ###');
        }
        methods.chat(`欢迎【<a class="user" data-id="${data.user.id}" data-name="${data.user.nickname}">${data.user.nickname}</a>】来到〖${data.user.room}〗，祝您聊得开心 ^_^！`);

      });
      w.__socket.on('users', function(users) {
        console.log('### USER LIST ###');
        methods.list(users);
      });
      w.__socket.on('chat', function(data) {
        methods.chat(data.message, { from: data.from, to: data.to, is_private: data.is_private, metadata: data.metadata });
      });

      w.__socket.on('transfer-chat', function(info) {
        console.log('### TRANSFER CHAT ###');
        // console.log(
        //   info.file.id, info.file.size, info.file.name,
        //   info.from.id, info.from.nickname,
        //   info.to.id, info.to.nickname,
        //   info.is_private);
        VARS.files.receive[info.file.id] = {
          size: 0,
          buffer: [],
          file: info.file
        };
        var metadata = { type: TYPES.FILE, file: info.file };
        methods.message(w.__user.room, info.from, info.to, info.is_private, `发送文件 ${info.file.name} (${Math.round(info.file.size/1024)}KB)`, metadata);
      });
      // Receiver to Sender
      w.__socket.on('transfer-start', function(info) {
        console.log('### TRANSFER START ###');
        var bufferSize = 8096;
        var chunk = VARS.files.transfer[info.file.id].data.slice(0, bufferSize);
        VARS.files.transfer[info.file.id].data = VARS.files.transfer[info.file.id].data.slice(bufferSize, VARS.files.transfer[info.file.id].size);
        // console.log(
        //   info.file.id, info.file.size, info.file.name,
        //   info.from.id, info.from.nickname,
        //   info.to.id, info.to.nickname,
        //   info.is_private
        // );
        var progress = 100 - Math.trunc(VARS.files.transfer[info.file.id].data.length / info.file.size * 100);
        // console.log(`[Sender] [${info.file.id}] -> ${progress}`);
        $(`.chat-history .list > li > #file-${info.file.id} .progress`).text(`${progress}%`);

        if(chunk.length > 0) {
          w.__socket.emit('transfer-data', info, chunk);
        }
      });
      w.__socket.on('transfer-data', function(info, trunk) {
        console.log('### RECEIVE DATA ###');
        // console.log(
        //   info.file.id, info.file.size, info.file.name,
        //   info.from.id, info.from.nickname,
        //   info.to.id, info.to.nickname,
        //   info.is_private
        // );

        VARS.files.receive[info.file.id].buffer.push(trunk);
        VARS.files.receive[info.file.id].size += trunk.byteLength;

        var progress = Math.trunc(VARS.files.receive[info.file.id].size / info.file.size * 100);
        // console.log(`[Receiver] [${info.file.id}] -> ${progress}`);
        $(`.chat-history .list > li > #file-${info.file.id} .progress`).text(`${progress}%`);

        if(VARS.files.receive[info.file.id].size === info.file.size) {
          console.log(`### RECEIVED FILE: ${info.file.size} ###`);
          download(new Blob(VARS.files.receive[info.file.id].buffer), info.file.name);
          delete VARS.files.receive[info.file.id];
        }
        else {
          w.__socket.emit('transfer-accept', info);
        }
      });

      w.__socket.on('transfer-cancel', function(info) {
        $(`.chat-history .list > li > #file-${info.file.id} .progress`).addClass('cancel').text(`用户已取消`);
      });

      w.__socket.on('rejected', data => {
        console.log('### REJECTED ###');
        // console.log(data);
        jMessage.addClass('error').text(`${data.nickname} ${jMessage.data('nickname-message')}`);
      });
      w.__socket.on('leave', data => {
        if(data.user.id === w.__user.id) {
          $('.login-views').show();
          $('.chat-views').removeClass('display');
        }
        methods.chat(`【${data.user.nickname}】走了。。。`);
        methods.list(data.users);
      });
      w.__socket.on('disconnected', data => {
        console.warn('### DISCONNECTED ###');
        console.warn(data);
      });

    },
    login(isReconnect) {
      console.log(`### LOGIN: ${isReconnect} ###`);
      var nickname = jNickname.val();
      var room = jRoom.val();
      if(nickname.length === 0) {
        jNickname.focus();
        if(isReconnect) {
          return;
        }
        return jMessage.addClass('error').text(jMessage.data('tips-message'));
      }
      else if(room.length === 0){
        jRoom.focus();
        return jMessage.addClass('error').text(jMessage.data('room-message'));
      }
      jMessage.removeClass('error').text(jMessage.data('initial-message'));
      return w.__socket.emit('login', { nickname, id: w.__user.id, room, is_reconnect: isReconnect });
    },
    quit() {
      w.__socket.emit('leave', { nickname: w.__user.nickname, room: w.__user.room, id: w.__socket.id });
    },
    share(from, to, isPrivate, id, data, file) {
      /** @type {{ size: number, name: string, data: Buffer }} */
      VARS.files.transfer[id] = {
        size: data.length,
        name: file.name,
        data
      };
      // Sender to Receiver
      w.__socket.emit('transfer-start', { from, to, is_private: isPrivate, file: { id, size: VARS.files.transfer[id].size, name: VARS.files.transfer[id].name } });

    },
    read(file, isPrivate, to) {
      var id = methods.getId();
      var from = { id: w.__user.sid, nickname: w.__user.nickname };

      if(file) {
        var reader = new FileReader();
        reader.onload = function(_evt){
          var data = new Uint8Array(reader.result);
          methods.share(from, to, isPrivate, id, data, file);
        }
        reader.readAsArrayBuffer(file);
      }
    },
    message(room, from, to, isPrivate, message, metadata = { type: TYPES.CHAT }) {
      w.__socket.emit('chat', { room, from, to, is_private: isPrivate, message, metadata });
    },
    notify(message) {
      console.log(message);
      if (!("Notification" in window)) {
        // Check if the browser supports notifications
        console.warn('This browser does not support desktop notification');
      } else if (Notification.permission === "granted") {
        const notification = new Notification(message);
      } else if (Notification.permission !== "denied") {
        // We need to ask the user for permission
        Notification.requestPermission().then((permission) => {
          // If the user accepts, let's create a notification
          if (permission === "granted") {
            const notification = new Notification(message);
          }
        });
      }
    }
  };
  var pages = {
    home: {
      _view: function() {
        console.log('### PLUGIN: VIEW ###');
      },
      init: function() {
        pages['home']._view();
      }
    },
    chat: {
      init: function() {
        var jInput = $('.tool-view .input input');
        var jMethod = $('.tool-view .method input');
        var jFilePicker = $('.tool-view .transfer .file');
        var jFileButton = $('.tool-view .transfer .filepicker');
        var selectUser = function(id, name) {
          jToWhom.data('id', id);
          jToWhom.val(name);
          jInput.focus();
          // File
          var blacklist = Object.keys(CONSTS).concat(w.__user.id);
          jFilePicker.attr('disabled', blacklist.includes(id));
          jFileButton.attr('disabled', blacklist.includes(id));
        };
        var sendMessage = function(message) {
          if(message.length === 0) { return; }
          var to = { id: jToWhom.data('id'), nickname: jToWhom.val() };
          var isPrivate = jMethod.prop('checked');
          var from = { id: w.__user.sid, nickname: w.__user.nickname };
          var room = w.__user.room;
          methods.message(room, from, to, isPrivate, message);
        }, onSelectingUser = function(id, name) {          
          selectUser(id, name);
        };
        jMethod.on('change', function(evt) {
          w.__utility.stopEvent(evt);
          jInput.focus();
        });
        $('.tool-view').on('submit', function(evt) {
          w.__utility.stopEvent(evt);
          var input = jInput.val();
          sendMessage(input);
          jInput.val('');
          jInput.focus();
        });
        $('.tool-view .send').on('click', function(evt) {
          $(this).trigger('submit');
        });
        //
        $('.form-view').on('submit', function(evt) {
          w.__utility.stopEvent(evt);
          methods.login(false);
        });
        $('.chat-users').on('click', '.list > li > a', function(evt) {
          w.__utility.stopEvent(evt);
          var id = $(this).data('id');
          var selectedName = $(this).data('name');
          onSelectingUser(id, selectedName);
          // Styles
          var jParent = $(this).parent().parent();
          jParent.find('li').removeClass('active');
          $(this).parent().addClass('active');
        });
        $('.chat-users').on('dragover', '.list > li > a', function(evt) {
          w.__utility.stopEvent(evt);
          var id = $(this).data('id');
          var blacklist = Object.keys(CONSTS).concat(w.__user.id);
          if(blacklist.includes(id)) { return; }

          $(this).addClass('dragging');
        });
        $('.chat-users').on('dragleave', '.list > li > a', function(evt) {
          w.__utility.stopEvent(evt);
          var id = $(this).data('id');
          $(this).removeClass('dragging');
        });

        $('.chat-users').on('drop', '.list > li > a', function(evt) {
          $(this).removeClass('dragging');
          $(this).trigger('click');
          w.__utility.stopEvent(evt);
          var id = $(this).data('id');
          var blacklist = Object.keys(CONSTS).concat(w.__user.id);
          if(blacklist.includes(id)) { return; }

          var files = evt.originalEvent.dataTransfer.files;
          var isPrivate = jMethod.prop('checked');
          var to = { id: jToWhom.data('id'), nickname: jToWhom.val() };
          $.each(files, function(index, file) {
            methods.read(file, isPrivate, to);
          });
        });
        $('.chat-history').on('click', '.list > li > a.user', function(evt) {
          w.__utility.stopEvent(evt);
          var id = $(this).data('id');
          var selectedName = $(this).data('name');
          onSelectingUser(id, selectedName);
        });
        $('.chat-history').on('click', '.list > li > .file > a.accept', function(evt) {
          w.__utility.stopEvent(evt);
          var jTransfer = $(this).parent();
          var info = {
            from: { id: jTransfer.data('from-id'), nickname: jTransfer.data('from-nickname') },
            to: { id: jTransfer.data('to-id'), nickname: jTransfer.data('to-nickname') },
            is_private: jTransfer.data('is-private'),
            file: { id: jTransfer.data('file-id'), size: jTransfer.data('file-size'), name: jTransfer.data('file-name') }
          };
          w.__socket.emit('transfer-accept', info);
          $(this).parent().find('a').removeClass('accept').removeClass('reject').addClass('disabled');
        });
        $('.chat-history').on('click', '.list > li > .file > a.reject', function(evt) {
          w.__utility.stopEvent(evt);
          var jTransfer = $(this).parent();
          var info = {
            from: { id: jTransfer.data('from-id'), nickname: jTransfer.data('from-nickname') },
            to: { id: jTransfer.data('to-id'), nickname: jTransfer.data('to-nickname') },
            is_private: jTransfer.data('is-private'),
            file: { id: jTransfer.data('file-id'), size: jTransfer.data('file-size'), name: jTransfer.data('file-name') }
          };
          w.__socket.emit('transfer-reject', info);
          $(this).parent().find('a').removeClass('accept').removeClass('reject').addClass('disabled');
        });

        $('.tool-view .quit input').on('click', function(evt) {
          w.__utility.stopEvent(evt);
          methods.quit();
        });
        jFileButton.on('click', function(evt) {
          w.__utility.stopEvent(evt);
          jFilePicker.trigger('click');
        });

        jFilePicker.on('change', function(evt) {
          var file = evt.target.files[0];
          var isPrivate = jMethod.prop('checked');
          var to = { id: jToWhom.data('id'), nickname: jToWhom.val() };
          methods.read(file, isPrivate, to);
        });

        // var checkBrowser = function(__callback) {
        //   var userAgent = w.navigator.userAgent.toLocaleLowerCase();
        //   if(userAgent.includes('edg')) {
        //     return __callback('Edge');
        //   }
        //   else if (userAgent.includes('chrome')) {
        //     return __callback('Chrome');
        //   }
        //   else if (userAgent.includes('firefox')) {
        //     return __callback('Firefox');
        //   }
        //   else {
        //     return __callback('');
        //   }
        // };

        // // Only for testing
        // checkBrowser(function(name) {
        //   jNickname.val(name);
        // });

        methods.mount();
      }
    }
  };
  console.log('### HOME PLUGIN ###');
  w.__pages = Object.assign(w.__pages, pages);
})(jQuery, window);
