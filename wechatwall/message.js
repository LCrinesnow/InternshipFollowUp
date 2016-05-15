var PORT = 9529;
var http = require('http');
var qs = require('qs');
var crypto =require('crypto');
var url=require('url');
var xml2js =require('xml2js');
var tmpl = require('tmpl');

var TOKEN = 'rinesnow';

function checkSignature(params,token){
	//1.将token、timestamp、nonce三个参数进行字典序排序
	//2.将三个参数字符串拼接成一个字符串进行sha1加密
	//3.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信  return true/false

	var key = [token, params.timestamp,params.nonce].sort().join('');//拼接
	var sha1 = crypto.createHash('sha1');
	sha1.update(key);
	return sha1.digest('hex')==params.signature;

}

var server = http.createServer(function (request,response){
	//解析URL中的Query部分，用qs模块（npm install qs）将Query解析成json
	var query = url.parse(request.url).query;
	var params = qs.parse(query);

	console.log(params);
	console.log("token-->",TOKEN);

	if(!checkSignature(params,TOKEN)){
		// response.end(params.echostr);不能乱response.end！否则后面response 用不了了！
		response.end('signature fail');
		return;
	}else{
		console.log("chenggong");
	}
		console.log(request.method+'/////');

	//若请求时GET，返回echostr用于通过服务器有效检验
	if(request.method=='GET'){
		response.end(params.echostr);
	}else{
	//否则是微信给开发者服务器的POST请求
		var postdata = '';

		request.addListener('data',function (postchunk){
			postdata += postchunk;
		});
		// console.log(postdata+'dfsdf');

		request.addListener('end',function (){
			console.log(postdata);
			var parseString=xml2js.parseString;
			parseString(postdata,function (err, result){
				if(!err){
					console.log(result);
					// console.log(result.xml.MsgType[0]);
					
					var back = reply(result,'昨夜若非诸将力战敌军，我命休矣！');
				    console.log(back);
					response.end(back);
				}
			});
		});
	}
});
function reply(result,replyText){
	//用模版填充信息。
	//tmpl(temp,{变量1:val,变量2:val});
	var template = '<xml>'+
						'<ToUserName><![CDATA[{toUser}]]></ToUserName>'+
						'<FromUserName><![CDATA[{fromUser}]]></FromUserName>'+
						'<CreateTime><{time}></CreateTime>'+
						'<MsgType><![CDATA[{type}]]></MsgType>'+
						'<Content><![CDATA[{content}]]></Content>'+
					'</xml>';

	if(result.xml.MsgType[0]==='text'){
		console.log("shi text");
		console.log(result.xml.FromUserName[0]);
		console.log(result.xml.ToUserName[0]);

		return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'text',
            time: Date.now(),
            content: replyText
        });
	}else if (result.xml.MsgType[0] === 'image') {
       		console.log("shi image");

        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'image',
            time: Date.now(),
            content: replyText
        });
    } else if (result.xml.MsgType[0] === 'voice') {
        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'voice',
            time: Date.now(),
            content: replyText
        });
    } else if (result.xml.MsgType[0] === 'video') {
        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'video',
            time: Date.now(),
            content: replyText
        });
    } else if (result.xml.MsgType[0] === 'shortvideo') {
        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'shortvideo',
            time: Date.now(),
            content: replyText
        });
    } else if (result.xml.MsgType[0] === 'location') {
        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'location',
            time: Date.now(),
            content: replyText
        });
    } else if (result.xml.MsgType[0] === 'link') {
        return tmpl(template, {
            toUser: result.xml.FromUserName[0],
            fromUser: result.xml.ToUserName[0],
            type: 'link',
            time: Date.now(),
            content: replyText
        });
    } else {
        return '';
    }

}
server.listen(PORT);
console.log("Server running at port:"+PORT+".");