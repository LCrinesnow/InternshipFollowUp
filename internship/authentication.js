/**
 * Created by rinesnow on 16/3/31.
 */
//未登录


function ifAuthorized(req,res,next){
   var OAuth = require('wechat-oauth');
   var client = new OAuth('wx75d11b4f981b1ded', '7a915c525f39451f3af19407012459ad');

    var query = require('url').parse(req.url,true).query;
          console.log(query);

    var code = query.code;
          console.log(code);

    client.getAccessToken(code, function (err, result) {
      var accessToken = result.data.access_token;
      var openid = result.data.openid;
      console.log(accessToken);
      console.log(openid);

    });
    client.getUser(openid, function (err, result) {
      var userInfo = result;
      console.log(result);
    });

        if(!req.session.user){
            console.log('抱歉,您还没有登录!');
            return res.redirect('/login');//返回登录页面
        }
        next();
    }


function noReLogin(req,res,next){

    if(req.session.user){
        console.log('您已登录,不能再登录或注册!');
        return res.redirect('/');//返回首页
    }
    next();
}
exports.ifAuthorized = ifAuthorized;
exports.noReLogin= noReLogin;