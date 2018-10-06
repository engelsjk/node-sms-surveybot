const http = require( 'http' );
const express = require( 'express' );
const session = require( 'express-session' );
const bodyParser = require('body-parser');

const spreadsheet = require( './spreadsheet.js' );
const config = require('./config.json');
const custom_messages = require( './custom_messages.json' );

const MessagingResponse = require( 'twilio' ).twiml.MessagingResponse;

////////////////////////////////////
/// INPUTS

const port = 3000; 
const session_expiration_ms = 1800000;

////////////////////////////////////
/// APP

const app = express();

// Configure app middlware - session 
app.use( session( { 
  secret: config['SESSION_SECRET'],
  cookie: { maxAge: session_expiration_ms } ,
  resave: true,
  saveUninitialized: true
} ) );

// Configure app middlware - bodyparser
app.use( bodyParser.urlencoded( { extended: false } ) );

// Define app /sms endpoint 
app.post( '/sms', ( req, res ) => {

  console.log('...message received...');

  ///

  var update_spreadsheet = false;
  let smsCount = req.session.counter || 0;
  let response = new MessagingResponse();

  let questions = [
    custom_messages['questions']['question-1'],
    custom_messages['questions']['question-2']
  ];

  ///////////////////////////////////////////////////
  /// Structure message responses based on SMS count!
  /// * Edit to customize conversation flow, matched up w/ text in custom_messages.json

  if( smsCount == 0 ) {
    
    // Introduction w/ 1st Question
    message1 = custom_messages['text']['text-intro'];
    question = questions[0];
    message1 = message1.replace( '%s', question );    

    response.message( message1 );

  } else if ( smsCount == 1 ) {

    // Followup w/ 2nd Question
    message1 = custom_messages['text']['text-followup'];
    question = questions[1];
    message1 = message1.replace( '%s', question );
    
    response.message( message1 );

  } else if ( smsCount == 2 ) {

    // Goodbye
    message1 = custom_messages['text']['text-goodbye'];

    response.message( message1 );

  } else if ( smsCount == 3 ) {

    // Ignore
    message1 = custom_messages['text']['text-ignore'];

    response.message( message1 );

  }
  
  req.session.counter = smsCount + 1;

  ///////////////////////////////////////////////////
  /// SEND RESPONSE TO TWILIO

  if ( smsCount <= 3 ){
    res.writeHead( 200, { 'Content-Type': 'text/xml' } );
    res.end( response.toString() );
    console.log('...response sent...');
  }

  ///////////////////////////////////////////////////
  /// UPDATE GOOGLE SPREADSHEET

  question = '';

  if( smsCount == 1 ){
    update_spreadsheet = true;
    question = questions[0];
  } else if ( smsCount == 2 ){
    update_spreadsheet = true;
    question = questions[1];
  } else {
    update_spreadsheet = false;
  }

  if ( update_spreadsheet ){
 
    message_data = {
      'session_id': req.sessionID,
      'phone_number': req.body.From,
      'question': question,
      'answer': req.body.Body
    }
    
    spreadsheet.updateSpreadsheet( message_data );

  }

});

///////////////////////////////////////////////////
/// APP SERVER

http.createServer( app ).listen( port, () => {
  console.log( ('SurveyBot has started listening on port %s!').replace( '%s', port ) );
});

