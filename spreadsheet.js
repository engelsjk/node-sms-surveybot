const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const creds = require('./google_spreadsheet_credentials.json');
const config = require('./config.json');

///////////////////////////////////////////////////
/// CONFIGURE ROW STRUCTURE (row keys must match Google Spreadsheet header names!)

function createRow( message_data ) {
	var date = new Date();
	var timestamp = date.toISOString();

	var session_id = message_data.session_id;
	var phone_number = message_data.phone_number;
	var question = message_data.question;
	var answer = message_data.answer;

	var row = {
		'timestamp': timestamp,
		'session-id': session_id,
		'phone-number': phone_number,
		'question': question,
		'answer': answer
	};

	return row;
}

///////////////////////////////////////////////////
/// GOOGLE SPREADSHEET INFO AND UPDATE

exports.updateSpreadsheet = function( message_data ) {

	var doc = new GoogleSpreadsheet(config['GOOGLE_SHEET_ID']);
	var sheet;

	async.series([
		function setAuth(step) {
			doc.useServiceAccountAuth(creds, step);
		},
		function getInfoAndWorksheets(step) {
		doc.getInfo(function(err, info) {
			sheet = info.worksheets[0];
			step();
		});
		},
		function addSheetRow(step){
			let new_row = createRow( message_data );
			console.log(new_row);
			sheet.addRow(new_row, function(err, row) {
				if(err) {
					console.log('Error: '+err);
				}
			});
			console.log('...spreadsheet updated...');
			step();
		}
	], function(err){
		if( err ) {
		console.log('Error: '+err);
		}
	});
}
