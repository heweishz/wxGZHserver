import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  accessToken: {
    type: String,
    require: true,
  },
  ticketData: {
    type: String,
    require: true,
  },
  timeStamp: {
    type: String,
    require: true,
  },
});

const TicketModel = mongoose.model('TicketModel', ticketSchema);

export default TicketModel;
