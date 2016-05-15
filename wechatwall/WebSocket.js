/**
  上一个例子的微信墙没有获得用户头像、名字等信息
  这些信息要通过另一类微信API，也就是由服务器主动调用微信获得
  这一类API的安全机制不同于之前，不再通过简单的TOKEN校验
  而需要通过appID、appSecret获得access_token，然后再用
  access_token获取相应的数据

  可以先看以下代码：
  lib/config.js - appID和appSecret配置
  lib/token.js  - 获得有效token
  lib/user.js   - 获得用户信息
  lib/reply.js  - 回复微信的模板
  lib/ws.js     - 简单的websocket
*/

var PORT = require('./lib/config').wxPort;
var getUserInfo = require('./lib/user').getUserInfo;
var replyText = require('./lib/reply').replyText; 

var wss = require('./lib/ws.js').wss;

// var PORT = 9529;
var http = require('http');
var qs = require('qs');
var crypto =require('crypto');
var url=require('url');
var xml2js =require('xml2js');
var tmpl = require('tmpl');
var TOKEN = 'rinesnow';

var express = require('express');
app = express();
app.use(express.static(__dirname));
app.listen(require('./lib/config').indexPort);
// function checkSignature(params,token){
//   //1.将token、timestamp、nonce三个参数进行字典序排序
//   //2.将三个参数字符串拼接成一个字符串进行sha1加密
//   //3.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信  return true/false

//   var key = [token, params.timestamp,params.nonce].sort().join('');//拼接
//   var sha1 = crypto.createHash('sha1');
//   sha1.update(key);
//   return sha1.digest('hex')==params.signature;

// }

// var server = http.createServer(function (request,response){
//   //解析URL中的Query部分，用qs模块（npm install qs）将Query解析成json
//   var query = url.parse(request.url).query;
//   var params = qs.parse(query);

//   console.log(params);
//   console.log("token-->",TOKEN);

//   if(!checkSignature(params,TOKEN)){
//     // response.end(params.echostr);不能乱response.end！否则后面response 用不了了！
//     response.end('signature fail');
//     return;
//   }else{
//     console.log("chenggong");
//   }
//     console.log(request.method+'/////');

//   //若请求时GET，返回echostr用于通过服务器有效检验
//   if(request.method=='GET'){
//     response.end(params.echostr);
//   }else{
//   //否则是微信给开发者服务器的POST请求
//     var postdata = '';

//     request.addListener('data',function (postchunk){
//       postdata += postchunk;
//     });
//     // console.log(postdata+'dfsdf');

//     request.addListener('end',function (){
//       console.log(postdata);
//       var parseString=xml2js.parseString;
//       parseString(postdata,function (err, result){
//         if(!err){
//           if(result.xml.MsgType[0] === 'text'){
//             getUserInfo(result.xml.FromUserName[0])
//             .then(function(userInfo){
//               //获得用户信息，合并到消息中
//               result.user = userInfo;
// //               //将消息通过websocket广播
// //               console.log('wode shuchu'+result.xml.MsgType[0]);
// //               wss.broadcast(result);
// //               wss.liu(result);

// //               var res = replyText(result, '消息推送成功！');

// //               response.end(res);
// //             })
          
//               console.log(result);
//               console.log(result.xml.MsgType[0]);
//               wss.broadcast(result);

//               var back = replyText(result,'昨夜若非诸将力战敌军，我命休矣！');
//                 // console.log(back);
//               response.end(back);
//             });
//           }
//         }
//       });
//     });
//   }
// });
function checkSignature(params, token){
  //1. 将token、timestamp、nonce三个参数进行字典序排序
  //2. 将三个参数字符串拼接成一个字符串进行sha1加密
  //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信

  var key = [token, params.timestamp, params.nonce].sort().join('');
  var sha1 = require('crypto').createHash('sha1');
  sha1.update(key);
  
  return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (request, response) {

  //解析URL中的query部分，用qs模块(npm install qs)将query解析成json
  var query = require('url').parse(request.url).query;
  var params = qs.parse(query);

  if(!checkSignature(params, TOKEN)){
    //如果签名不对，结束请求并返回
    response.end('signature fail');
    return;
  }

  if(request.method == "GET"){
    //如果请求是GET，返回echostr用于通过服务器有效校验
    response.end(params.echostr);
  }else{
    //否则是微信给开发者服务器的POST请求
    var postdata = "";

    request.addListener("data",function(postchunk){
        postdata += postchunk;
    });

    //获取到了POST数据
    request.addListener("end",function(){
      var parseString = xml2js.parseString;

      parseString(postdata, function (err, result) {
         // console.log('err'+result);

        if(!err){
         // console.log('if'+result);
          if(result.xml.MsgType[0] === 'text'){
            getUserInfo(result.xml.FromUserName[0])
            .then(function(userInfo){
              //获得用户信息，合并到消息中
              result.user = userInfo;
              //将消息通过websocket广播
                   console.log(result);

              console.log('wode shuchu'+result.xml.MsgType[0]);
              wss.broadcast(result);
              // wss.liu(result);

              var res = replyText(result, '消息推送成功！');

              response.end(res);
            })
          }
        }
      });
    });
  }
});

server.listen(PORT);

console.log("Weixin server runing at port: " + PORT + ".");