'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var qs = require('querystring');
var bcrypt = require('bcrypt');
const saltRounds = 10;
//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
var order = fabric_client.newOrderer('grpc://localhost:7050')
//
var member_user = null;
var store_path = path.join(__dirname, '/../../hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

init();

function init() {
	channel.addPeer(peer);
    channel.addOrderer(order);
}



//for file read and output
var startime= []
var i=0;
startQuery();
var fs = require('fs')
function startQuery(){
	var fs = require('fs'),
	readline = require('readline'),
	instream = fs.createReadStream('./signuptest.txt'),
	outstream = new (require('stream'))(),
	rl = readline.createInterface(instream, outstream);

	 rl.on('line', function (line) {
			 console.log(line);
			 var username= 'test'+line;
			 var linestr = line.toString();
			var data={
				"user_name":username,
				 "account_no":line,
				 "email":'test@test.com',
				 "password":'11111',
			 }
			 module.exports.signupcheck(data);
	 });

	 rl.on('close', function (line) {
		 //  console.log(line);
			 console.log('done reading file.');
	 });

}


// file read and write






















module.exports.signupcheck = function(request,res){
	var user_name = request["user_name"];
	var account_no = request["account_no"];
	var email = request["email"];
	var password = request["password"];
	    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
	    Fabric_Client.newDefaultKeyValueStore({ path: store_path
	    }).then((state_store) => {
	        // assign the store to the fabric client
	        fabric_client.setStateStore(state_store);
	        var crypto_suite = Fabric_Client.newCryptoSuite();
	        // use the same location for the state store (where the users' certificate are kept)
	        // and the crypto store (where the users' keys are kept)
	        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	        crypto_suite.setCryptoKeyStore(crypto_store);
	        fabric_client.setCryptoSuite(crypto_suite);

	        // get the enrolled user from persistence, this user will sign all requests
	        return fabric_client.getUserContext('user1', true);
	    }).then((user_from_store) => {
	        if (user_from_store && user_from_store.isEnrolled()) {
	            console.log('Successfully loaded user1 from persistence');
	            member_user = user_from_store;
	        } else {
	            throw new Error('Failed to get user1.... run registerUser.js');
	        }

	        // queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
	        // queryAllCars chaincode function - requires no arguments , ex: args: [''],

	        const request = {
	            //targets : --- letting this default to the peers assigned to the channel
	            chaincodeId: 'blockchainChatbot',
	            //fcn: 'queryAllCars',
	            //args: ['']
	            fcn: 'login',
	            //'a0123c'
	            args: [account_no]
	        };
	        console.log(request);
	        // send the query proposal to the peer
	        return channel.queryByChaincode(request);
	    }).then((query_responses) => {
	        console.log("Query has completed, checking results");
	        // query_responses could have more than one  results if there multiple peers were used as targets
	        if (query_responses && query_responses.length == 1) {
	          if(query_responses[0] != 0){
							console.log("user exist in the chain");
						//	res.redirect('/');
						}
	          else  if (query_responses[0] instanceof Error) {
	                console.error("error from query = ", query_responses[0]);
	            }
	         else {
	                module.exports.signup(request, res);
	            }
	        } else {
	            console.log("No payloads were returned from query");
	        }
	    }).catch((err) => {
	        console.error('Failed to query successfully :: ' + err);
	    });
}
module.exports.signup = function(request,res){
    var user_name = request["user_name"];
    var account_no = request["account_no"];
    var email = request["email"];
    var password = request["password"];
		var money = '10000000';
    //console.log("Reading: user_name : " +user_name+ " account_no "+account_no+" email "+email+" password "+password);
    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        // get the enrolled user from persistence, this user will sign all requests
        return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;

        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }
        tx_id = fabric_client.newTransactionID();
        console.log("Assigning transaction_id: ", tx_id._transaction_id);

				var hash = bcrypt.hashSync(password, saltRounds);
				console.log('password'+password+'hash'+hash);
        const request = {
            //targets : --- letting this default to the peers assigned to the channel
            chaincodeId: 'blockchainChatbot',
            //fcn: 'queryAllCars',
            //args: ['']
            fcn: 'signup',
            //'a0123c'
            args: [user_name, account_no, email, hash,money],
            chainId: 'mychannel',
            txId: tx_id
        };
				console.log(request);
        // send the query proposal to the peer
      return channel.sendTransactionProposal(request);
    }).then((results) => {
        var proposalResponses = results[0];
        var proposal = results[1];
        let isProposalGood = false;
        if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
                isProposalGood = true;
                console.log('Transaction proposal was good');


            } else {
                console.error('Transaction proposal was bad');
            }
        if (isProposalGood) {
            console.log(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
                proposalResponses[0].response.status, proposalResponses[0].response.message));

            // build up the request for the orderer to have the transaction committed
            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            // set the transaction listener and set a timeout of 30 sec
            // if the transaction did not get committed within the timeout period,
            // report a TIMEOUT status
            var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
            var promises = [];

            var sendPromise = channel.sendTransaction(request);
            promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

            // get an eventhub once the fabric client has a user assigned. The user
            // is required bacause the event registration must be signed
            let event_hub = fabric_client.newEventHub();
            event_hub.setPeerAddr('grpc://localhost:7053');

            // using resolve the promise so that result status may be processed
            // under the then clause rather than having the catch clause process
            // the status
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
                }, 3000);
                event_hub.connect();
                event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    // this is the callback for transaction event status
                    // first some clean up of event listener
                    clearTimeout(handle);
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();

                    // now let the application know what happened
                    var return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                        console.error('The transaction was invalid, code = ' + code);
                        resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
                    } else {
                        console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
                        resolve(return_status);
                    }
                }, (err) => {
                    //this is the callback if something goes wrong with the event registration or processing
                    reject(new Error('There was a problem with the eventhub ::'+err));
                });
            });
            promises.push(txPromise);

            return Promise.all(promises);
        } else {
            console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
        }
    }).then((results) => {
        console.log('Send transaction promise and event listener promise have completed');
        // check the results in the order the promises were added to the promise all list
        if (results && results[0] && results[0].status === 'SUCCESS') {
            console.log('Successfully sent transaction to the orderer.');
        } else {
            console.error('Failed to order the transaction. Error code: ' + response.status);
        }


        if(results && results[1] && results[1].event_status === 'VALID') {
            console.log('Successfully committed the change to the ledger by the peer');
						console.log("Inserted into the collection");
						//request.session.accno=request.body.account_no;
            //if user succesfully signed up then user is redirected to his page.
            //res.render("userindex")

        } else {
            console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
        }
    }).catch((err) => {
        console.error('Failed to invoke successfully :: ' + err);
    });
}