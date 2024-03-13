import mongoose from 'mongoose';

const certSchema = new mongoose.Schema({
  cert: {
    type: String,
    require: true,
  },
  timeStamp: {
    type: String,
    require: true,
  },
});

const CertModel = mongoose.model('CertModel', certSchema);

export default CertModel;
