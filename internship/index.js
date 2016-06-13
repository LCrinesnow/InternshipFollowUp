/**
 * Created by rinesnow on 16/3/29.
 */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session= require('express-session');
var moment = require('moment');

var app = express();
var API = require('wechat-enterprise').API;
var api = new API('wx1d3765eb45497a18','ZMrYxJD9UWZyM5oG2lsDMIuBUpirLBLDXX__2LvSF-WGYuGzAtIcBe-f1_SF1Giw','wx1d3765eb45497a18');

var WXBizMsgCrypt = require('wechat-crypto');

var config = {
    token: 'tQncssLue',
    encodingAESKey: 'HSDicCAXtj2xMd0whdICDdqwSrkXq3gLNEzXT3ToHS5',
    corpId: 'wx1d3765eb45497a18'
};

// app.get('/', function(req, res){
//     var msg_signature = req.query.msg_signature;
//     var timestamp = req.query.timestamp;
//     var nonce = req.query.nonce;
//     var echostr = req.query.echostr;
//     var cryptor = new WXBizMsgCrypt(config.token, config.encodingAESKey, config.corpId)
//     var s = cryptor.decrypt(echostr);
//     res.send(s.message);
// });


//连接数据库
var mongoose = require('mongoose');
var models = require('./models/models');

var User = models.User;
var Intern = models.Intern;

mongoose.connect('mongodb://localhost:27017/interns');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败!'));

//定义EJS模版引擎和末班文件位置
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//建立session模型
app.use(session({
    secret:'liuchong',
    name:'intern',
    //一周内免登录
    cookie:{maxAge:1000 * 60 * 60*24*7},//设置session的保存时间为 60min*24小时*7一周
    resave: false,
    saveUnintiallized:true
}));



//添加  页面提示功能   目前没用
app.use(function(req, res, next) {
    res.locals.user = req.session.user;//???
    var err = req.session.error;//赋值给err变量,
    //var success = req.session.success;//赋值给err变量,

    delete req.session.error;//然后清空session内的数据
    res.locals.message = '';//初始化
    //res.locals.success = '';//初始化

    if (err) {
        //html通过js被操作,在html中用{%-message%}调用
        res.locals.message = '<div class="alert alert-warning">' + err + '</div>';
    }
    next();//
});
//添加  页面提示功能   目前没用 

// var OAuth = require('wechat-oauth');
// var client = new OAuth('wx1d3765eb45497a18', 'ZMrYxJD9UWZyM5oG2lsDMIuBUpirLBLDXX__2LvSF-WGYuGzAtIcBe-f1_SF1Giw');
app.get('/',function ifAuthorized(req,res){
    //query仅在点击链接时重新生成，在授权界面刷新的话会使用旧Query和旧的code，无法生成openid程序会蹦

    var query = require('url').parse(req.url,true).query;
          console.log("wai"+query);
    var code = query.code;

    if(req.session.code==code){//为了避免程序崩，因为刷新授权会崩
         User.findOne({openid:req.session.openid},function(err,user){
           if(err){
               console.log('这是err'+err);
           }
            if(user){//有这个user 那么直接跳转
                console.log(user.nickname)
                console.log(user.openid)
                req.session.user = user;
                res.render('login',{
                    user: req.session.user,//也要加?
                    title:'内推推推'
                });
            }
        });
    }else{
        var code = query.code;
        req.session.code=code;
        console.log("else"+code);
        api.getUserIdByCode(code,function (err, result) {
      // var openid = result.openid;//必须要手动点击URL，原地刷新没用的。
                        console.log('这是resultdataid:'+result.UserId);

            req.session.openid=result.UserId;

            User.findOne({openid:req.session.openid},function(err,user){
               if(err){
                   console.log('这是err'+err);
               }
                if(user){//有这个user 那么直接跳转
                    // console.log(user.nickname)
                    // console.log(user.openid)
                    req.session.user = user;
                    res.render('login',{
                        user: req.session.user,//也要加?
                        title:'内推推推'
                    });
                }
             
                //新建user对象用于保存数据
                else{
                    var newUser = new User({
                    
                        openid:result.UserId,//openid 作为key存入，以后再用用户信息就用openid调。
                        nickname:result.nickname,
                        headimg:result.headimgurl
                    });

                    newUser.save(function(err,doc){
                        if(err){
                            console.log("保存用户信息失败！"+err);
                        }
                        console.log('保存用户信息成功!');//怎么实现弹出框!!!!??????
                        res.render('login',{
                            // user: req.session.user,//也要加?
                            title:'内推推推'
                        });
                        // return res.redirect('/');
                    });
                }
            });
        });  
  }
   
 
    
    
});


//发布

//响应发布get请求
app.get('/post',function(req,res){
   console.log('发布!');
    res.render('post',{
        user: req.session.user,//也要加?
        title:'发布'
    });
});
//响应发布post请求
app.post('/post',function(req,res){
            
            var newIntern = new Intern({
                openid:req.session.user.openid,//用户的id
                company:req.body.company,
                email:req.body.email,
                category:req.body.category,
                content:req.body.content,
            });

            newIntern.save(function(err,doc){
                if(err){
                    console.log(err);
                    return res.redirect('/post');
                }
                else{
                    console.log('保存实习信息成功!');//怎么实现弹出框!!!!??????
                    res.render('login',{
                            // user: req.session.user,//也要加?
                            title:'内推推推'
                    });
                }
               
            });
});
//


app.get('/list',function(req,res){
     Intern.find(function(err,allInterns){
        if(err){
            console.log(err);
            res.render('login',{
                    // user: req.session.user,//也要加?
              title:'内推推推'
            });
        }
        else{
            res.render('list',{
            title:'内推列表',
            interns:allInterns,
            moment:moment
            });
        }
            
    })
});


app.get('/detail/:_id',function(req,res){//:id?
   console.log('查看实习!');
    Intern.findOne({_id:req.params._id}).exec(function(err,intern){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(intern) {
            res.render('detail', {
                title: '内推详情',
                intern: intern,
                moment:moment
            });
            console.log(intern);
        }
    });
});



app.listen(3000, function(req,res){
    console.log('app is running at port 3000');
});