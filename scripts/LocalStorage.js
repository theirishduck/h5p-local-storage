var H5PLocalStorage = function (){
	var slotName = 'h5p';
	var disableOverride = false;

	function init(cb) {
		callback = cb || function(){}; // noop

		if( localStorage.getItem(slotName) === null) {
			var initObj = {
				dateCreated: Date()
			}
			localStorage.setItem(slotName, JSON.stringify(initObj));
			callback("set new item");
		} else {
			callback("existing item exists");
		}

		H5P.externalDispatcher.on('xAPI', function(event) {
			
			var eventType = event.data.statement.verb.display['en-US'];
			// check its a question being answered
			if (eventType == 'answered') { // question answered
				
				var eventData = event.data.statement;
				var contentID = eventData.object.definition.extensions['http://h5p.org/x-api/h5p-local-content-id'];
				var subContentId = eventData.object.definition.extensions['http://h5p.org/x-api/h5p-subContentId']; // question ID

				// create / check user exists
				if (eventData.actor.account) { // not signed in
					var userID = "test";
				} else { // signed in
					var userID = "test2"
				}


				// contentsaves
				var outputObject = {}

				//send it with userID
				outputObject[contentID] = {};
				outputObject[contentID].individual = {};
				outputObject[contentID].individual[subContentId] = {};

				outputObject[contentID].individual[subContentId].score = eventData.result.score;

				setSavePoint(userID, outputObject, function (){
					console.log(" question answer savepoint added");
				})



			} else if (eventType == 'completed') { // on completed save the progress

				var eventData = event.data.statement;
				var contentID = eventData.object.definition.extensions['http://h5p.org/x-api/h5p-local-content-id'];
				
				// create / check user exists
				if (eventData.actor.account) { // not signed in
					var userID = "test";
				} else { // signed in
					var userID = "test2"
				}

				var outputObject = {}

				//send it with userID
				outputObject[contentID] = {};
				outputObject[contentID]['total'] = {};

				outputObject[contentID]['total'].score = eventData.result.score;

				setSavePoint(userID, outputObject, function (){
					console.log("cp complete savepoint added");
				})

			} else { // unrelated xApi event 
				// console.log("unrelated event: ", eventType);
			}

			// create the user 
			// store a content ID 
			// check that the interaction is cp first
			// for each question store a question length
			// for each correct answer store an "answered correctly"

			// Here I need an object to save 

		});
	};

	function setSavePoint (userID, objectToSave, cb) {
		callback = cb || function(){}; // noop

		// check if slot exists
		// init();

		// // get current save
		var currentSave = JSON.parse(localStorage.getItem(slotName) );

		// set empty user object if the contentID doesnt already exist
		currentSave[userID] = currentSave[userID] || {};
		currentSave[userID].contentSaves = currentSave[userID].contentSaves || {};

		// // // merge the new content
		currentSave[userID].contentSaves = MergeRecursive(currentSave[userID].contentSaves, objectToSave);

		// // // update last updated date
		currentSave[userID].lastUpdated = Date();

		// // // if(!disableOverride) {
			localStorage.setItem(slotName, JSON.stringify(currentSave));
		// // // }

		console.log(currentSave)

		// callback(currentSave);
	};

	function getSavePoint (contentId) {
		var currentSave = JSON.parse(localStorage.getItem(slotName) );
		console.log("Debug CS: ", currentSave);
		return currentSave.contentSaves[contentId];
	};

	function disable () {
		disableOverride = true;
	};

	return {
		init: init,
		save: setSavePoint,
		get: getSavePoint,
		disable: disable
	}

	// Private functions
	/*
	* Recursively merge properties of two objects 
	*/
	function MergeRecursive(obj1, obj2) {

	  for (var p in obj2) {
	    try {
	      // Property in destination object set; update its value.
	      if ( obj2[p].constructor==Object ) {
	        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

	      } else {
	        obj1[p] = obj2[p];

	      }

	    } catch(e) {
	      // Property in destination object not set; create it and set its value.
	      obj1[p] = obj2[p];

	    }
	  }

	  return obj1;
	}
}

