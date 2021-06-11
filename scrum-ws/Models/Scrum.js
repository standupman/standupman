const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScrumSchema = new Schema({
    name: {
        type: String,
        minlength: [4, 'Scrum name too short'],
        required: [true, 'Scrum name not present']
    },
    description: String,
    completionTime: {
        type: Date,
        required: [true, 'CompletionTime must be present']
    },
    questions: {
        type: Object,
        validate: {
            validator: function (input) {
                let questions = JSON.parse(input);
                let keys = Object.keys(questions);
                if (keys.length < 1) {
                    return false;
                }

                keys.forEach(key => {
                  if(Object.keys(questions[key]).length < 2) {
                      return false;
                  }
                  if(questions[key].title === undefined) {
                      return false;
                  }
                  if(questions[key].response_type === undefined) {
                      return false;
                  }
                });

            
                return true;
            
            },
            message: 'A minimum of one question must be present with the form { question_1: {title: "What did you do today", response_type: "String"}, question_2: {title: "How many hours did you work today", response_type: "Number"}}',
        },
        required: [true, 'Questions object not present']
    },
    user_id: String
});

const Scrum = mongoose.model('Scrum', ScrumSchema);
module.exports = Scrum;