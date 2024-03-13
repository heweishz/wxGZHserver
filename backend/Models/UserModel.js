import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  user: String,
  pwd: String,
});

const UserModel = mongoose.model('userModel', userSchema);

export default UserModel;
