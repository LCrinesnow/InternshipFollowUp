/**
 * Created by rinesnow on 16/3/29.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    UserId: String,
    nickname: String,
    headimg: String,
    createTime: {
        type:Date,
        default:Date.now
    }
});

var internSchema = new Schema({
    UserId:String,//用户的id
    company:String,
    email:String,
    category:String,
    content:String,
    createTime:{
        type:Date,
        default:Date.now
    }
});
exports.Intern = mongoose.model('Intern',internSchema);
exports.User = mongoose.model('User',userSchema);