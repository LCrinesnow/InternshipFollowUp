/**
 * Created by rinesnow on 16/3/31.
 */
//未登录
   var OAuth = require('wechat-oauth');
   var client = new OAuth('wx75d11b4f981b1ded', '7a915c525f39451f3af19407012459ad');
function getOpenid(req,res){
    var query = require('url').parse(req.url,true).query;
    client.getAccessToken(code, function (err, result) {
      var accessToken = result.data.access_token;
      var openid = result.data.openid;
      console.log(accessToken);
      console.log(openid);
            console.log(err);

      return openid;
    });
}

function ifAuthorized(req,res,next){

    var query = require('url').parse(req.url,true).query;
          console.log(query);

    var code = query.code;
          console.log(code);

    client.getAccessToken(code, function (err, result) {
      var accessToken = result.data.access_token;
      var openid = result.data.openid;
      console.log(accessToken);
      console.log(openid);
      client.getUser(openid, function (err, result) {
          var userInfo = result;
          console.log(result);
       });
    
       User.findOne({openid:openid},function(err,user){
           if(err){
               console.log(err);
           }
            if(user){//有这个user 那么直接跳转
                return res.redirect('/');
            }
            // //对密码进行md5加密
            // var md5 = crypto.createHash('md5'),
            //     md5newopenid = md5.update(openid).digest('hex');
            //新建user对象用于保存数据
            var newUser = new User({
                openid:openid//openid 作为key存入，以后再用用户信息就用openid调。
            });

            newUser.save(function(err,doc){
                if(err){
                    console.log("保存用户信息失败！"+err);
                }
                console.log('保存用户信息成功!');//怎么实现弹出框!!!!??????
                return res.redirect('/');
            });
        });

    });   

    // if(!req.session.user){
    //     console.log('抱歉,您还没有登录!');
    //     return res.redirect('/login');//返回登录页面
    // }
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
exports.getOpenid= getOpenid;