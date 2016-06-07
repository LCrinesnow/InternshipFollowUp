/**
 * Created by rinesnow on 16/3/29.
 */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session= require('express-session');
var moment = require('moment');
var authentication = require('./authentication.js');

var app = express();




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



//添加  页面提示功能
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
    //if (success) {
    //    //html通过js被操作,在html中用{%-message%}调用
    //    res.locals.success = '<div class="alert alert-success">' + success + '</div>';
    //}

    next();//?
});


   var OAuth = require('wechat-oauth');
   var client = new OAuth('wx75d11b4f981b1ded', '7a915c525f39451f3af19407012459ad');
 // var openid='hehehe';
app.get('/',function ifAuthorized(req,res){

    // var url = client.getAuthorizeURL('www.coderwitkey.com', 'STATE', 'snsapi_userinfo');
    var query = require('url').parse(req.url,true).query;
          console.log(query);

    var code = query.code;
          console.log(code);
 
    client.getUserByCode(code,function (err, result) {
      // var openid = result.openid;//必须要手动点击URL，原地刷新没用的。
       console.log('这是result:'+result.openid);
       User.findOne({openid:result.openid},function(err,user){
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
                // return res.redirect('/');
            }
            // //对密码进行md5加密
            // var md5 = crypto.createHash('md5'),
            //     md5newopenid = md5.update(openid).digest('hex');
            //新建user对象用于保存数据
            else{
                var newUser = new User({
                
                    openid:result.openid,//openid 作为key存入，以后再用用户信息就用openid调。
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
    // req.code=code; 
    // next();
});

//响应首页get请求
// app.get('/',authentication.ifAuthorized);//检测是否登录了
// app.get('/',function(req,res){
    
//       console.log('首页!');
//     res.render('login',{
//         // user: req.session.user,//也要加?
//         title:'内推推推'
//     });
//     // Note.find({author:openid}).exec(function(err,allNotes){
//     //     if(err){
//     //         console.log(err);
//     //         return res.redirect('/');
//     //     }
//     //     res.render('index',{
//     //        title:'首页',
//     //         openid: openid,
//     //         notes:allNotes
//     //     });
//     // })
// });




// //登出
// app.get('/quit',function(req,res){
//     //退出功能只需将session中的user删除即可。
//     // req.session.user = null;
//     console.log('退出!');
//     return res.redirect('/login');
// });



//发布

//响应发布get请求
// app.get('/post',authentication.ifAuthorized);//检测是否登录了
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
            interns:allInterns
            });
        }
            
    })
});

//博客细节

// app.get('/detail/',authentication.ifAuthorized);//检测是否登录了
app.get('/detail/:_id',function(req,res){//:id?
   

   console.log('查看笔记!');
    Intern.findOne({_id:req.params._id}).exec(function(err,interns){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(intern) {
            res.render('detail', {
                title: '笔记详情',
                intern: intern,
                moment:moment
            });
            console.log(intern);
        }
    });
});

// app.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx75d11b4f981b1ded&secret=7a915c525f39451f3af19407012459ad&code=CODE&grant_type=authorization_code',function(req,res){

// });//获取appid


app.listen(3000, function(req,res){
    console.log('app is running at port 3000');
});