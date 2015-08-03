

global_num_GrooveUtilsCreated = 0;
if(document.currentScript)
	global_grooveUtilsScriptSrc = document.currentScript.src;
else
	global_grooveUtilsScriptSrc = "";

// GrooveUtils class.   The only one in this file. 
function GrooveUtils() { "use strict";

	global_num_GrooveUtilsCreated++;   // should increment on every new
	
	var root = this;

	// midi state variables
	root.isMIDIPaused = false;
	root.shouldMIDIRepeat = true;
	root.swingIsEnabled = false;
	root.grooveUtilsUniqueIndex = global_num_GrooveUtilsCreated;
		
	var class_empty_note_array = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
	
	root.visible_context_menu = false;   // a single context menu can be visible at a time.
	
	root.current_midi_start_time = 0;
	root.last_midi_update_time = 0;
	root.total_midi_play_time_msecs = 0;
	
	// constants
	var CONSTANT_Midi_play_time_zero= "0:00";
	var constant_MAX_MEASURES=  10;
	var constant_DEFAULT_TEMPO= 80;
	var constant_ABC_STICK_R=  '"R"x';
	var constant_ABC_STICK_L=  '"L"x';
	var constant_ABC_STICK_OFF=  '""x';
	var constant_ABC_HH_Ride=  "^f";       
	var constant_ABC_HH_Crash=  "^A'";       
	var constant_ABC_HH_Open=   "!open!^g";  
	var constant_ABC_HH_Close=  "!plus!^g";  
	var constant_ABC_HH_Accent= "!accent!^g";  
	var constant_ABC_HH_Normal= "^g"; 
	var constant_ABC_SN_Ghost=  "!(.!!).!c";  
	var constant_ABC_SN_Accent= "!accent!c";   
	var constant_ABC_SN_Normal= "c";   
	var constant_ABC_SN_XStick= "^c";
	var constant_ABC_SN_Flam=   "{/c}c"; 
	var constant_ABC_KI_SandK=  "[F^d,]";  // kick & splash
	var constant_ABC_KI_Splash= "^d,";     // splash only
	var constant_ABC_KI_Normal= "F";   
	var constant_ABC_OFF= false;
	
	root.grooveData = function() {
		this.notesPerMeasure    = 8;
		this.numberOfMeasures   = 2;
		this.showMeasures       = 1;
		this.numBeats		    = 4;   // Top part of Time Signture 3/4, 4/4, 5/4, 6/8, etc...
		this.noteValue		    = 4;   // Bottom part of Time Sig   4 = quarter notes, 8 = 8th notes, 16ths, etc..
		this.sticking_array     = class_empty_note_array.slice(0);  // copy by value
		this.hh_array           = class_empty_note_array.slice(0);  // copy by value
		this.snare_array        = class_empty_note_array.slice(0);  // copy by value
		this.kick_array         = class_empty_note_array.slice(0);  // copy by value
		this.showStickings      = false;
		this.title              = "";
		this.author             = "";
		this.comments           = "";
		this.showLegend         = false;
		this.swingPercent       = 0;
		this.tempo              = constant_DEFAULT_TEMPO;
		this.kickStemsUp        = true;
		this.metronomeFrequency = 0;   // 0, 4, 8, 16
	};
			
	root.getQueryVariableFromString = function(variable, def_value, my_string) {
		   var query = my_string.substring(1);
		   var vars = query.split("&");
		   for (var i=0;i<vars.length;i++) {
				   var pair = vars[i].split("=");
				   if(pair[0].toLowerCase() == variable.toLowerCase()){return pair[1];}
		   }
		   return(def_value);
	};
	
	// Get the "?query" values from the page URL
	root.getQueryVariableFromURL = function(variable, def_value) {
		   return(root.getQueryVariableFromString(variable, def_value, window.location.search));
	}	;
	
	// every document click passes through here.
	// close a popup if one is up and we click off of it.
	root.documentOnClickHanderCloseContextMenu = function(event) {
		if(root.visible_context_menu ) {
			root.hideContextMenu( root.visible_context_menu );
		}
	};
	
	root.showContextMenu = function(contextMenu) {
		
		// if there is another context menu open, close it
		if(root.visible_context_menu ) {
			root.hideContextMenu( root.visible_context_menu );
		}
		
		contextMenu.style.display = "block";
		root.visible_context_menu = contextMenu;
		
		// use a timeout to setup the onClick handler.
		// otherwise the click that opened the menu will close it
		// right away.  :(  
		setTimeout(function(){
			document.onclick = root.documentOnClickHanderCloseContextMenu;
			},100);
	};
	
	root.hideContextMenu = function(contextMenu) {
		document.onclick = false;
		
		if(contextMenu) {
			contextMenu.style.display = "none";
		}
		root.visible_context_menu = false;
	};
	
	// figure it out from the division  Division is number of notes per measure 4, 6, 8, 12, 16, 24, 32, etc...
	root.isTripletDivision = function(division, timeSigTop, timeSigBottom) {
		if(timeSigTop == 4 && timeSigBottom == 4 && division % 6 == 0)
			return true;
			
		return false;
	};
	
	root.GetDefaultStickingsGroove = function(division, numMeasures) {
		var retString = "";
		if(root.isTripletDivision(division, 4, 4)) {
			for(var i=0; i<numMeasures; i++)
				retString += "|------------------------";
			retString += "|";
		} else { 
			for(var j=0; j<numMeasures; j++)
				retString += "|--------------------------------";
			retString += "|";
		}
		return retString;
	};
	
	root.GetDefaultHHGroove = function(division, numMeasures) {
		var retString = "";
		if(root.isTripletDivision(division, 4, 4)) {
			for(var i=0; i<numMeasures; i++)
				retString += "|xxxxxxxxxxxxxxxxxxxxxxxx";
			retString += "|";
		} else { 
			for(var j=0; j<numMeasures; j++)
				retString += "|x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-";
			retString += "|";
		}
		return retString;
	};
	
	root.GetDefaultSnareGroove = function(division, numMeasures) {
		var retString = "";
		if(root.isTripletDivision(division, 4, 4)) {
			for(var i=0; i<numMeasures; i++)
				retString += "|---O-----O--";
			retString += "|";
		} else { 
			for(var j=0; j<numMeasures; j++)
				retString += "|--------O---------------O-------";
			retString += "|";
		}
		return retString;
	};
	
	root.GetDefaultKickGroove = function(division, numMeasures) {
		var retString = "";
		if(root.isTripletDivision(division, 4, 4)) {
			for(var i=0; i<numMeasures; i++)
				retString += "|o-----o-----";
			retString += "|";
		} else { 
			for(var j=0; j<numMeasures; j++)
				retString += "|o---------------o---------------";
			retString += "|";
		}
		return retString;
	};
	
	
	// takes a character from tablature form and converts it to our ABC Notation form.
	// uses drum tab format adapted from wikipedia: http://en.wikipedia.org/wiki/Drum_tablature
	//
	//  Sticking support:
	//		R: right
	//  	L: left
	//
	//  HiHat support:   
	//     	x: normal
	//     	X: accent
	//     	o: open
	//		+: close
	//     	c: crash
	//      r: ride
	//     	-: off
	//
	//   Snare support:
	//     	o: normal
	//     	O: accent
	//     	g: ghost
	//      x: cross stick
	//     	-: off
	//  
	//   Kick support:
	//     	o: normal
	//     	x: hi hat splash with foot
	//     	X: kick & hi hat splash with foot simultaneously
	//
	//  Note that "|" and " " will be skipped so that standard drum tabs can be applied
	//  Example:
	//     H=|x---x---x---x---|x---x---x---x---|x---x---x---x---|
	// or  H=x-x-x-x-x-x-x-x-x-x-x-x-
	//     S=|----o-------o---|----o-------o---|----o-------o---|
	// or  S=--o---o---o---o---o---o-
	//     B=|o-------o-------|o-------o-o-----|o-----o-o-------|
	// or  B=o---o---o----oo-o--oo---|
	//
	function tablatureToABCNotationPerNote(drumType, tablatureChar) {
	
		switch(tablatureChar) {
			case "c":
				if(drumType == "H") 
					return constant_ABC_HH_Crash;
				break;
			case "f":
				if(drumType == "S") 
					return constant_ABC_SN_Flam;
				break;
			case "g":
				if(drumType == "S") 
					return constant_ABC_SN_Ghost;
				break;
			case "l":
			case "L":
				if(drumType == "Stickings") 
					return constant_ABC_STICK_L;
			break;
			case "O":
				if(drumType == "S") 
					return constant_ABC_SN_Accent;
				break;
			case "o":
				switch(drumType) {
					case "H":
						return constant_ABC_HH_Open;
						break;
					case "S":
						return constant_ABC_SN_Normal;
						break;
					case "K":
						return constant_ABC_KI_Normal;
						break;
					default:
						break;					}
				break;
			case "r":
			case "R":
				switch(drumType) {
					case "H":
						return constant_ABC_HH_Ride;
						break;
					case "Stickings":
						return constant_ABC_STICK_R;
						break;
					default:
						break;					}
				break;
			case "x":
				switch(drumType) {
					case "S":
						return constant_ABC_SN_XStick;
						break;
					case "K":
						return constant_ABC_KI_Splash;
						break;
					case "H":
						return constant_ABC_HH_Normal;
						break;
					default:
						break;
					}
				break;
			case "X":
				switch(drumType) {
					case "K":
						return constant_ABC_KI_SandK;
						break;
					case "H":
						return constant_ABC_HH_Accent;
						break;
					default:
						break;				}
				break;
			case "+":
				if(drumType == "H") {
					return constant_ABC_HH_Close;
				} 
				break;
			case "-":
				return false;
				break;
			default:
				break;
		}	
		
		alert("Bad tablature note found in tablatureToABCNotationPerNote.  Tab: " + tablatureChar + " for drum type: " + drumType);
		return false;
	}
	
	// same as above, but reversed
	function ABCNotationToTablaturePerNote(drumType, abcChar) {
		var tabChar = "-";
		
		switch(abcChar) {
			case constant_ABC_STICK_R:
				tabChar = "R";
				break;
			case constant_ABC_STICK_L:
				tabChar = "R";
				break;
			case constant_ABC_STICK_OFF:
				tabChar = "-";
				break;
			case constant_ABC_HH_Ride:  
				tabChar = "r";
				break;
			case constant_ABC_HH_Crash:
				tabChar = "c";
				break;
			case constant_ABC_HH_Open:
				tabChar = "o";
				break;
			case constant_ABC_HH_Close:
				tabChar = "+";
				break;
			case constant_ABC_SN_Accent:
				tabChar = "O";
				break;
			case constant_ABC_HH_Normal:
			case constant_ABC_SN_XStick:
				tabChar = "x";
				break;
			case constant_ABC_SN_Ghost: 
				tabChar = "g";
				break;
			case constant_ABC_SN_Normal:
			case constant_ABC_KI_Normal:
				tabChar = "o";
				break;
			case constant_ABC_SN_Flam:
				tabChar = "f";
				break;
			case constant_ABC_HH_Accent:
			case constant_ABC_KI_SandK:
				tabChar = "X";
				break;
			case constant_ABC_KI_Splash:
				tabChar = "x";
				break;
			case constant_ABC_OFF:
				tabChar = "-";
				break;
			default:
				alert("bad case in ABCNotationToTablaturePerNote");
				break;
		}	
		
		return tabChar;
	}

	// takes two drum tab lines and merges them.    "-" are blanks so they will get overwritten in a merge.
	// if there are two non "-" positions to merge, the dominateLine takes priority.
	//
	//  Example    |----o-------o---|   (dominate)
	//           + |x-------x---x---|   (subordinate)
	//             |x---o---x---o---|   (result)
	// 
	// this is useful to take an accent tab and an "others" tab and creating one tab out of it.
	root.mergeDrumTabLines = function(dominateLine, subordinateLine) {
		var maxLength = (dominateLine.length > subordinateLine.length ? dominateLine.length : subordinateLine.length);
		var newLine = "";
		
		for(var i=0; i < maxLength; i++) {
			var newChar = "-";
			if(dominateLine.charAt(i) != "")
				newChar = dominateLine.charAt(i);
				
			if(newChar == "-" && subordinateLine.charAt(i) != "")
				newChar = subordinateLine.charAt(i);
			
			newLine += newChar;
		}
		
		return newLine;
	};
	
	// takes a string of notes encoded in a serialized string and convert it to an array that represents the notes
	// uses drum tab format adapted from wikipedia: http://en.wikipedia.org/wiki/Drum_tablature
	//
	//  Note that "|" and " " will be skipped so that standard drum tabs can be applied
	//  Example:
	//     H=|x---x---x---x---|x---x---x---x---|x---x---x---x---|
	// or  H=x-x-x-x-x-x-x-x-x-x-x-x-
	//     S=|----o-------o---|----o-------o---|----o-------o---|
	// or  S=--o---o---o---o---o---o-
	//     B=|o-------o-------|o-------o-o-----|o-----o-o-------|
	// or  B=o---o---o----oo-o--oo---|
	// 
	// Returns array that contains notesPerMeasure * numberOfMeasures entries.   
	root.noteArraysFromURLData = function(drumType, noteString, notesPerMeasure, numberOfMeasures)  {
		var setFunction;
		var retArray = [];
		
		// decode the %7C url encoding types
		noteString = decodeURIComponent(noteString);
		
		var retArraySize = notesPerMeasure * numberOfMeasures;
		
		// ignore "|" by removing them
		//var notes = noteString.replace(/\|/g, '');
		// ignore "|" & ")" & "(" & "[" & "]" & "!" & ":" by removing them
		var notes = noteString.replace(/\:|\!|\)|\(|\[|\]|\|/g, '');
		
		var noteStringScaler = 1;
		var displayScaler = 1;
		if(notes.length > retArraySize && notes.length/retArraySize >= 2) {
			// if we encounter a 16th note groove for an 8th note board, let's scale it	down	
			noteStringScaler = Math.ceil(notes.length/retArraySize);
		} else if(notes.length < retArraySize && retArraySize/notes.length >= 2) {
			// if we encounter a 8th note groove for an 16th note board, let's scale it up
			displayScaler = Math.ceil(retArraySize/notes.length);
		} 
			
		// initialize an array that can carry all the measures in one array
		for(var i=0; i < retArraySize; i++) {
			retArray[i] = false;
		}
			
		var retArrayIndex = 0;
		for(var j=0; j < notes.length && retArrayIndex < retArraySize; j += noteStringScaler, retArrayIndex += displayScaler) {
			retArray[retArrayIndex] = tablatureToABCNotationPerNote(drumType, notes[j]);
		}
		
		return retArray;
	};
	
	// take an array of notes in ABC format and convert it into a drum tab String
	// drumType - H, S, K, or Stickings
	// noteArray - pass in an ABC array of notes
	// getAccents - true to get accent notes.  (false to ignore accents)
	// getOthers - true to get non-accent notes.  (false to ignore non-accents)
	// maxLength - set smaller than noteArray length to get fewer notes
	// separatorDistance - set to greater than zero integer to add "|" between measures
	root.tabLineFromAbcNoteArray = function(drumType, noteArray, getAccents, getOthers, maxLength, separatorDistance) {
		var returnTabLine = "";
		
		if(maxLength > noteArray.length)
			maxLength = noteArray.length;
		
		for(var i=0; i < maxLength; i++) {
			var newTabChar = ABCNotationToTablaturePerNote(drumType, noteArray[i]);
			
			if(separatorDistance > 0) 
				returnTabLine += "|";
				
			if(drumType == "H" && newTabChar == "X") {
				if(getAccents)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			} else if((drumType == "K" || drumType == "S") && (newTabChar == "o" || newTabChar == "O")) {
				if(getAccents)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			} else if(drumType == "K" && newTabChar == "X") {
				if(getAccents && getOthers)
					returnTabLine += "X";  // kick & splash
				else if(getAccents)
					returnTabLine += "o";  // just kick
				else	
					returTabLine += "x";   // just splash
			} else {
				// all the "others"
				if(getOthers)
					returnTabLine += newTabChar;
				else
					returnTabLine += "-";
			}
			
			if((separatorDistance+1 > 0) && (i % separatorDistance) == 0) 
				returnTabLine += "|";
		}	

		return returnTabLine;
	};
	
	root.getGrooveDataFromUrlString = function(encodedURLData) {
		var Stickings_string;
		var HH_string;
		var Snare_string;
		var Kick_string;
		var stickings_set_from_URL = false;
		var myGrooveData = new root.grooveData();
		
		myGrooveData.notesPerMeasure = parseInt(root.getQueryVariableFromString("Div", 8, encodedURLData), 10);
				
		myGrooveData.numberOfMeasures = parseInt(root.getQueryVariableFromString("measures", 2, encodedURLData), 10);
		if(myGrooveData.numberOfMeasures < 1 || isNaN(myGrooveData.numberOfMeasures))
			myGrooveData.numberOfMeasures = 1;
		else if(myGrooveData.numberOfMeasures > constant_MAX_MEASURES)
			myGrooveData.numberOfMeasures = constant_MAX_MEASURES;
			
			
		Stickings_string = root.getQueryVariableFromString("Stickings", false, encodedURLData);
		if(!Stickings_string) {
			Stickings_string = root.GetDefaultStickingsGroove(myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
			myGrooveData.showStickings = false;
		} else {
			myGrooveData.showStickings = true;
		}
		
		HH_string = root.getQueryVariableFromString("H", false, encodedURLData);
		if(!HH_string) {
			root.getQueryVariableFromString("HH", false, encodedURLData);
			if(!HH_string) {
				HH_string = root.GetDefaultHHGroove(myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
			}
		}
		
		Snare_string = root.getQueryVariableFromString("S", false, encodedURLData);
		if(!Snare_string) {
			Snare_string = root.GetDefaultSnareGroove(myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		}
		
		Kick_string = root.getQueryVariableFromString("K", false, encodedURLData);
		if(!Kick_string) {
			root.getQueryVariableFromString("B", false, encodedURLData);
			if(!Kick_string) {
				Kick_string = root.GetDefaultKickGroove(myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
			}
		}
			
		
		myGrooveData.sticking_array = root.noteArraysFromURLData("Stickings", Stickings_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.hh_array       = root.noteArraysFromURLData("H", HH_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.snare_array    = root.noteArraysFromURLData("S", Snare_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
		myGrooveData.kick_array     = root.noteArraysFromURLData("K", Kick_string, myGrooveData.notesPerMeasure, myGrooveData.numberOfMeasures);
			
		myGrooveData.showMeasures = parseInt(root.getQueryVariableFromString("showMeasures", 1, encodedURLData), 10);
		if(myGrooveData.showMeasures < 1 || isNaN(myGrooveData.showMeasures))
			myGrooveData.showMeasures = 1;
		else if(myGrooveData.showMeasures > myGrooveData.numberOfMeasures)
			myGrooveData.showMeasures = myGrooveData.numberOfMeasures;
		
			
		myGrooveData.title = root.getQueryVariableFromString("title", "", encodedURLData);
		myGrooveData.title = decodeURIComponent(myGrooveData.title);
		myGrooveData.title = myGrooveData.title.replace(/\+/g, " ");
						
		myGrooveData.author = root.getQueryVariableFromString("author", "", encodedURLData);
		myGrooveData.author = decodeURIComponent(myGrooveData.author);
		myGrooveData.author = myGrooveData.author.replace(/\+/g, " ");
		
		myGrooveData.comments = root.getQueryVariableFromString("comments", "", encodedURLData);
		myGrooveData.comments = decodeURIComponent(myGrooveData.comments);
		myGrooveData.comments = myGrooveData.comments.replace(/\+/g, " ");
		
		myGrooveData.tempo = parseInt(root.getQueryVariableFromString("tempo", constant_DEFAULT_TEMPO, encodedURLData), 10);
		if(isNaN(myGrooveData.tempo) || myGrooveData.tempo < 20 || myGrooveData.tempo > 400)
			myGrooveData.tempo = constant_DEFAULT_TEMPO;
				
		myGrooveData.swingPercent = parseInt(root.getQueryVariableFromString("swing", 0, encodedURLData), 10);
		if(isNaN(myGrooveData.swingPercent) || myGrooveData.swingPercent < 0 || myGrooveData.swingPercent > 100)
			myGrooveData.swingPercent = 0;
		
		return myGrooveData;
	};
	
	function setupHotKeys() {
		
		var isCtrl = false;
		document.onkeyup=function(e) {
				if(e.which == 17) 
					isCtrl=false;
		};
			
		document.onkeydown=function(e){
			if(e.which == 17) 
				isCtrl=true;
			/*
			if(e.which == 83 && isCtrl == true) {
				 alert('CTRL-S pressed');
				 return false;
			}
			*/
			// only accept the event if it not going to an INPUT field
			// otherwise we can't use spacebar in text fields :(
			if(e.which == 32 && e.target.type != "text" && e.target.tagName != "TEXTAREA") {
				// spacebar
				root.startOrStopMIDI_playback();
				return false;
			}
			if(e.which == 179) {
				// Play button
				root.startOrPauseMIDI_playback();
			}
			if(e.which == 178) {
				// Stop button
				root.stopMIDI_playback();
			}
			
			return true;
		};
	}
	
	
	// the top stuff in the ABC that doesn't depend on the notes
	root.get_top_ABC_BoilerPlate = function(isPermutation, tuneTitle, tuneAuthor, tuneComments, showLegend, isTriplets, kick_stems_up, timeSigTop, timeSigBottom) {
		// boiler plate
		var fullABC = "%abc\n\X:6\n";
		
		fullABC += "M:" + timeSigTop + "/" + timeSigBottom + "\n";
		
		// always add a Title even if it's blank
		fullABC += "T: " + tuneTitle + "\n";
		
		if(tuneAuthor != "") {
			fullABC += "C: " + tuneAuthor + "\n";
			fullABC += "%%musicspace 20px\n";  // add some more space
		}
		
		
		if(isTriplets)
			fullABC += "L:1/16\n";
		else 
			fullABC += "L:1/" + (timeSigBottom * 8) + "\n";   // 4/4 = 32,  6/8 = 64
		
		if(isPermutation)
			fullABC += "%%stretchlast 0\n" +
						"%%stretchstaff 0\n";
		else
			fullABC += "%%stretchlast 1\n";
		
		fullABC +=  '%%flatbeams 1\n' +
					'%%ornament up\n' +
					'%%pagewidth 710px\n' +
					'%%leftmargin 1cm\n' +
					'%%rightmargin 1cm\n' +
					'%%topspace 10px\n' +
					'%%titlefont calibri 20\n' + 
					'%%partsfont calibri 16\n' +
					'%%gchordfont calibri 16\n' +
					'%%annotationfont calibri 16\n' +
					'%%infofont calibri 16\n' + 
					'%%textfont calibri 16\n' + 
					'%%deco (. 0 a 5 1 1 "@-8,-3("\n' +
					'%%deco ). 0 a 5 1 1 "@4,-3)"\n' +
					'%%beginsvg\n' +
					' <defs>\n' +
					' <use id="VoidWithX" xlink:href="#acc2"/>\n' +
					' </defs>s\n' +
					'%%endsvg\n' +
					'%%map drum ^g heads=VoidWithX print=g  % Hi-Hat\n' +
					'%%map drum ^A\' heads=VoidWithX print=A\'  % Crash\n' +
					'%%map drum ^f heads=VoidWithX print=f  % Ride\n' +
					'%%map drum ^c heads=VoidWithX print=c  % Cross Stick\n' +
					'%%map drum ^d, heads=VoidWithX print=d,  % Foot Splash\n';
					
		//if(kick_stems_up)
			//fullABC += "%%staves (Stickings Hands)\n";
		//else
			fullABC += "%%staves (Stickings Hands Feet)\n";
									
		// print comments below the legend if there is one, otherwise in the header section
		if(tuneComments != "") {
			fullABC += "P: " + tuneComments + "\n";
			fullABC += "%%musicspace 20px\n";  // add some more space
		}
					
		// the K ends the header;
		fullABC +=	"K:C clef=perc\n";
		
		if(showLegend) {
			fullABC += 	'V:Stickings\n' +
						'x8 x8 x8 x8 x8 x8 x8 x8 ||\n' +
						'V:Hands stem=up \n' +
						'%%voicemap drum\n' +
						'"^Hi-Hat"^g4 "^Open"!open!^g4 "^Close"!plus!^g4 "^Accent"!accent!^g4 ' +
						'"^Crash"^A\'4 "^Ride"^f4 x2 "^Snare"c4 "^Accent"!accent!c4 "^Cross"^c4 "^Ghost"!(.!!).!c4 "^Flam"{/c}c4  x18 ||\n' +
						'V:Feet stem=down \n' +
						'%%voicemap drum\n' +
						'x48 "^Kick"F4 "^Hi-Hat w/ foot"^d,4 "^Kick & Hi-Hat"[F^d,]4 x4 ||\n' +
						'T:\n';
		}
		
		// tempo setting
		//fullABC += "Q: 1/4=" + getTempo() + "\n";	
		
		return fullABC;
	};
	
	// looks for modifiers like !accent! or !plus! and moves them outside of the group abc array.
	// Most modifiers (but not all) will not render correctly if they are inside the abc group.
	// returns a string that should be added to the abc_notation if found.
	function moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, modifier_to_look_for) {
		
		var found_modifier = false;
		var rindex = abcNoteStrings.notes1.lastIndexOf(modifier_to_look_for);
		if(rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes1 = abcNoteStrings.notes1.replace(modifier_to_look_for, "");
		}
		rindex = abcNoteStrings.notes2.lastIndexOf(modifier_to_look_for);
		if(rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes2 = abcNoteStrings.notes2.replace(modifier_to_look_for, "");
		}
		rindex = abcNoteStrings.notes3.lastIndexOf(modifier_to_look_for);
		if(rindex > -1) {
			found_modifier = true;
			abcNoteStrings.notes3 = abcNoteStrings.notes3.replace(modifier_to_look_for, "");
		}
		if(found_modifier)
			return modifier_to_look_for;
			
		return "";  // didn't find it so return nothing
	}
	
	// note1_array:   an array containing "false" or a note character in ABC to designate that is is on
	// note2_array:   an array containing "false" or a note character in ABC to designate that is is on
	// end_of_group:  when to stop looking ahead in the array.
	function getABCforNote(note1_array, note2_array, note3_array, end_of_group, scaler) {
	
			var ABC_String = "";
			var abcNoteStrings = {notes1 : "",
							      notes2 : "",
							      notes3 : ""};
			var num_notes_on = 0;
			var nextCount;
			
			if(note1_array[0] != false) {
				// look ahead and see when the next note is
				nextCount = 1;
				for(var indexA= 1; indexA < end_of_group; indexA++) {
					if(note1_array[indexA] != false || note2_array[indexA] != false || note3_array[indexA] != false)
						break;
					else
						nextCount++;
				}
					
				abcNoteStrings.notes1 += note1_array[0] + (scaler * nextCount);
				num_notes_on++;
			}
			
			if(note2_array[0] != false) {
				// look ahead and see when the next note is
				nextCount = 1;
				for(var indexB = 1; indexB < end_of_group; indexB++) {
					if(note1_array[indexB] != false || note2_array[indexB] != false || note3_array[indexB] != false)
						break;
					else
						nextCount++;
				}
					
				abcNoteStrings.notes2 += note2_array[0] + (scaler * nextCount);
				num_notes_on++;
			}
			
			if(note3_array[0] != false) {
				// look ahead and see when the next note is
				nextCount = 1;
				for(var indexC = 1; indexC < end_of_group; indexC++) {
					if(note1_array[indexC] != false || note2_array[indexC] != false || note3_array[indexC] != false)
						break;
					else
						nextCount++;
				}
					
				abcNoteStrings.notes3 += note3_array[0] + (scaler * nextCount);
				num_notes_on++;
			}
			
			if(num_notes_on > 1) {
				// if multiple are on, we need to combine them with []
				// horrible hack.  Turns out ABC will render the accents wrong unless the are outside the brackets []
				// look for any accents that are delimited by "!"  (eg !accent!  or !plus!)
				// move the accents to the front
				ABC_String += moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!accent!");
				ABC_String += moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!plus!");
				ABC_String += moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "!open!");
				
				// Look for '[' and ']'.   They are added on to the the kick and splash and could be added to other notes
				// in the future.   They imply that the notes are on the same beat.   Since we are already putting multiple
				// notes on the same beat (see code below this line that adds '[' & ']'), we need to remove them or the 
				// resulting ABC will be invalid
				moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "[");
				moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "]");
						
				// this is the flam notation, it can't be in a sub grouping
				ABC_String += moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, "{/c}");
				
				ABC_String += "[" + abcNoteStrings.notes1 + abcNoteStrings.notes2 + abcNoteStrings.notes3 + "]";  // [^gc]
			} else {
				ABC_String += abcNoteStrings.notes1 + abcNoteStrings.notes2 + abcNoteStrings.notes3;  // note this could be a noOp if all strings are blank
			}
			
			return ABC_String;
	}
	
	// calculate the rest ABC string
	function getABCforRest(note1_array, note2_array, note3_array, end_of_group, scaler, use_hidden_rest) {
		var ABC_String = "";
		
		// count the # of rest
		if(note1_array[0] == false && note2_array[0] == false && note3_array[0] == false) {
			var restCount = 1;
			for(var indexB = 1; indexB < end_of_group; indexB++) {
				if(note1_array[indexB] != false || note2_array[indexB] != false || note3_array[indexB] != false)
					break;
				else
					restCount++;
			}
		
			// now output a rest for the duration of the rest count
			if(use_hidden_rest)
				ABC_String += "x" + (scaler * restCount);
			else
				ABC_String += "z" + (scaler * restCount);
		}
		
		return ABC_String;
	}
	
	// the note grouping size is how groups of notes within a measure group
	// for 8ths and 16th we group with 4
	// for triplets we group with 3
	// This function is for laying out the HTML
	// see ABC_gen_note_grouping_size for the sheet music layout grouping size
	root.noteGroupingSize = function(notes_per_measure, timeSigTop, timeSigBottom) {	
		var note_grouping = 4;
		
		if(timeSigTop == 4 && timeSigBottom == 4) {
			
			switch(notes_per_measure) {
			// triplets
			case 6:
				note_grouping = 3;
				break;
			case 12:
				note_grouping = 3;
				break;
			case 24:
				note_grouping = 6;
				break;
				
			// quads
			case 4:	
			case 8:	
			case 16:
			case 32:
				note_grouping = notes_per_measure/4;
				break;
				
			default:
				alert("bad switch in GrooveUtils.noteGroupingSize()");
				note_grouping = Math.ceil(notes_per_measure/4);
				break;
			}
		} else if((timeSigTop % 3) == 0) {
			// 3/4, 6/8, 12/8, etc
			note_grouping = notes_per_measure/4;
		
		} else {
			// figure it out from the time signature
			// TODO: figure out what to do about timeSigBottom
			note_grouping = notes_per_measure/timeSigTop;
		}
		return note_grouping;
	};
	
	
	// when we generate ABC we use a default larger note array and transpose it
	// For 8th note triplets that means we need to use a larger grouping to make it
	// scale correctly
	// The base array is now 32 notes long to support 32nd notes
	// since we would normally group by 4 we need to group by 8 since we are scaling it
	function ABC_gen_note_grouping_size(usingTriplets, timeSigTop, timeSigBottom) {	
		var note_grouping;
		
		if(timeSigTop == 4 && timeSigBottom == 4) {
		
			if(usingTriplets)
				note_grouping = 6;
			else
				note_grouping = 8;
		
		} else if(timeSigTop == 3 && timeSigBottom == 8) {
			// 3/8
			note_grouping = 12;
		
		} else if((timeSigTop % 3) == 0 && timeSigBottom == 8) {
			// 6/8, 9/8
			note_grouping = 24;
		
		} else if(timeSigBottom == 8) {

			note_grouping = 16;
			
		} else {

			note_grouping = 8;
		}
			
		return note_grouping;
	}
	
	// since note values are 16ths or 12ths this corrects for that by multiplying note values
	// timeSigTop is the top number in a time signature (4/4, 5/4, 6/8, 7/4, etc)
	root.getNoteScaler = function(notes_per_measure, timeSigTop, timeSigBottom) {
		var scaler;

		if(!timeSigTop || timeSigTop < 1 || timeSigTop > 36) {
			alert("Error in getNoteScaler, out of range: " + timeSigTop);
			scaler = 1;
		} else if(timeSigTop == 4) {
			if(root.isTripletDivision(notes_per_measure, timeSigTop, timeSigBottom))
				scaler = Math.ceil(24/notes_per_measure);
			else
				scaler = Math.ceil(32/notes_per_measure);
		} else {
			// a full measure will be defined as 8 * timeSigTop.   (4 = 32, 5 = 40, 6 = 48, etc.)
			// that implies 32nd notes in quarter note beats
			// TODO: should we support triplets here?
			scaler = Math.ceil((8 * timeSigTop)/notes_per_measure);
		}
		
		return scaler;
	};
	
	// take any size array and make it larger by padding it with rests in the spaces between
	// For triplets, expands to 24 notes per measure
	// For non Triplets, expands to 32 notes per measure
	function scaleNoteArrayToFullSize(note_array, num_measures, notes_per_measure, timeSigTop, timeSigBottom) {
		var scaler = root.getNoteScaler(notes_per_measure, timeSigTop, timeSigBottom);  // fill proportionally
		var retArray = [];
		var isTriplets = root.isTripletDivision(notes_per_measure, timeSigTop, timeSigBottom);
		var i;											
		
		if(scaler == 1)
			return note_array;   // no need to expand
		
		// preset to false (rest) all entries in the expanded array
		if(isTriplets) {
			for(i=0; i < num_measures * 24; i++) 
				retArray[i] = false;
		}
		for(i=0; i < num_measures * notes_per_measure * scaler ; i++) 
			retArray[i] = false;
		
		// sparsely fill in the return array with data from passed in array
		for(i=0; i < num_measures * notes_per_measure; i++) {
			var ret_array_index = (i)*scaler;
			
			retArray[ret_array_index] = note_array[i];
		}
		
		return retArray;
	}
	
	// takes 4 arrays 24 elements long that represent the stickings, snare, HH & kick.
	// each element contains either the note value in ABC "F","^g" or false to represent off
	// translates them to an ABC string in 2 voices
	// post_voice_abc is a string added to the end of each voice line that can end the line
	function snare_HH_kick_ABC_for_triplets(sticking_array, HH_array, snare_array, kick_array, post_voice_abc, num_notes, notes_per_measure, kick_stems_up, timeSigTop, timeSigBottom) {
	
		var scaler = 1;  // we are always in 24 notes here
		var ABC_String = "";
		var stickings_voice_string = "V:Stickings\n";
		var hh_snare_voice_string  = "V:Hands stem=up\n%%voicemap drum\n";
		var kick_voice_string      = "V:Feet stem=down\n%%voicemap drum\n";
			
		for(var i=0; i < num_notes; i++) {
			
			// triplets are special.  We want to output a note or a rest for every space of time
			var end_of_group = 24/notes_per_measure;  // assuming we are always dealing with 24 notes
			var grouping_size_for_rests = 24/notes_per_measure;   // we scale up the notes to fit a 24 length array
			
			
			if(i % ABC_gen_note_grouping_size(true, timeSigTop, timeSigBottom) == 0) {
				// creates the 3 or the 6 over the note grouping
				// looks like (3:3:3 or (6:6:6
				hh_snare_voice_string += "(" + root.noteGroupingSize(notes_per_measure, timeSigTop, timeSigBottom) +
										":" + root.noteGroupingSize(notes_per_measure, timeSigTop, timeSigBottom) +
										":" + root.noteGroupingSize(notes_per_measure, timeSigTop, timeSigBottom);
			} 
			 
			if( i % grouping_size_for_rests == 0 ) {
				// we will only output a rest for each place there could be a note
				stickings_voice_string += getABCforRest(sticking_array.slice(i), class_empty_note_array, class_empty_note_array, grouping_size_for_rests, scaler, true);
				
				if(kick_stems_up) {
					hh_snare_voice_string += getABCforRest(snare_array.slice(i), HH_array.slice(i), kick_array.slice(i), grouping_size_for_rests, scaler, false);
					kick_voice_string = "";
				} else {
					hh_snare_voice_string += getABCforRest(snare_array.slice(i), HH_array.slice(i), class_empty_note_array, grouping_size_for_rests, scaler, false);
					kick_voice_string += getABCforRest(kick_array.slice(i), class_empty_note_array, class_empty_note_array, grouping_size_for_rests, scaler, true);
				}
			} 
			
			stickings_voice_string += getABCforNote(sticking_array.slice(i), class_empty_note_array, class_empty_note_array, end_of_group, scaler);
			
			if(kick_stems_up) {
				hh_snare_voice_string += getABCforNote(snare_array.slice(i), HH_array.slice(i), kick_array.slice(i), end_of_group, scaler);
				kick_voice_string = "";
			} else {
				hh_snare_voice_string += getABCforNote(snare_array.slice(i), HH_array.slice(i), class_empty_note_array, end_of_group, scaler);
				kick_voice_string += getABCforNote(kick_array.slice(i), class_empty_note_array, class_empty_note_array, end_of_group, scaler);
			}
			
			if((i % ABC_gen_note_grouping_size(true, timeSigTop, timeSigBottom)) == ABC_gen_note_grouping_size(true, timeSigTop, timeSigBottom)-1) {
			
				stickings_voice_string += " ";
				hh_snare_voice_string += " ";   // Add a space to break the bar line every group notes
				kick_voice_string += " ";
			}
			
			// add a bar line every 24 notes
			if(((i+1) % 24) == 0) {
				stickings_voice_string += "|";
				hh_snare_voice_string += "|";
				kick_voice_string += "|";
			}
		}
		
		if(kick_stems_up) 	
			ABC_String += stickings_voice_string + post_voice_abc + hh_snare_voice_string + post_voice_abc;
		else
			ABC_String += stickings_voice_string + post_voice_abc + hh_snare_voice_string + post_voice_abc + kick_voice_string + post_voice_abc;
		
		
		return ABC_String;
	}
	
	// takes 4 arrays 32 elements long that represent the sticking, snare, HH & kick.
	// each element contains either the note value in ABC "F","^g" or false to represent off
	// translates them to an ABC string in 3 voices
	// post_voice_abc is a string added to the end of each voice line that can end the line
	//
	function snare_HH_kick_ABC_for_quads(sticking_array, HH_array, snare_array, kick_array, post_voice_abc, num_notes, notes_per_measure, kick_stems_up, timeSigTop, timeSigBottom) {
	
		var scaler = 1;  // we are always in 32ths notes here
		var ABC_String = "";
		var stickings_voice_string = "V:Stickings\n";    // for stickings.  they are all rests with text comments added
		var hh_snare_voice_string = "V:Hands stem=up\n%%voicemap drum\n";     // for hh and snare
		var kick_voice_string = "V:Feet stem=down\n%%voicemap drum\n";   // for kick drum
		
		for(var i=0; i < num_notes; i++) {
					
			var grouping_size_for_rests = ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom);
			
			var end_of_group;
			if(i%ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom) == 0)
				end_of_group = ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom);
			else
				end_of_group = (ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom)-((i)%ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom)));
					 
			 
			if(i % ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom) == 0) {
				// we will only output a rest at the beginning of a beat phrase, or if triplets for every space
				stickings_voice_string += getABCforRest(sticking_array.slice(i), class_empty_note_array, class_empty_note_array, grouping_size_for_rests, scaler, true);
				
				if(kick_stems_up) {
					hh_snare_voice_string += getABCforRest(snare_array.slice(i), HH_array.slice(i), kick_array.slice(i), grouping_size_for_rests, scaler, false);
					kick_voice_string = "";
				} else {
					hh_snare_voice_string += getABCforRest(snare_array.slice(i), HH_array.slice(i), class_empty_note_array, grouping_size_for_rests, scaler, false);
					kick_voice_string += getABCforRest(kick_array.slice(i), class_empty_note_array, class_empty_note_array, grouping_size_for_rests, scaler, false);
				}
			} 
			
			stickings_voice_string += getABCforNote(sticking_array.slice(i), class_empty_note_array, class_empty_note_array, end_of_group, scaler);
			
			if(kick_stems_up) {
				hh_snare_voice_string += getABCforNote(snare_array.slice(i), HH_array.slice(i), kick_array.slice(i), end_of_group, scaler);
				kick_voice_string = "";
			} else {
				hh_snare_voice_string += getABCforNote(snare_array.slice(i), HH_array.slice(i), class_empty_note_array, end_of_group, scaler);
				kick_voice_string += getABCforNote(kick_array.slice(i), class_empty_note_array, class_empty_note_array, end_of_group, scaler);
			}
				
			if((i % ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom)) == ABC_gen_note_grouping_size(false, timeSigTop, timeSigBottom)-1) {
			
				stickings_voice_string += " ";
				hh_snare_voice_string += " ";   // Add a space to break the bar line every group notes
				kick_voice_string += " ";
			}
			
			// add a bar line every meausre.   32 notes in 4/4 time.   (8 * timeSigTop)
			if(((i+1) % (8*timeSigTop)) == 0) {
				stickings_voice_string += "|";
				hh_snare_voice_string += "|";
				kick_voice_string += "|";
			}
		}
		
		if(kick_stems_up) 	
			ABC_String += stickings_voice_string + post_voice_abc + hh_snare_voice_string + post_voice_abc;
		else
			ABC_String += stickings_voice_string + post_voice_abc + hh_snare_voice_string + post_voice_abc + kick_voice_string + post_voice_abc;
		
		return ABC_String;
	}
	
	// create ABC from note arrays
	// The Arrays passed in must be 32 or 24 notes long 
	// notes_per_measure denotes the number of notes that _should_ be in the measure even though the arrays are always large
	root.create_ABC_from_snare_HH_kick_arrays = function(sticking_array, HH_array, snare_array, kick_array, post_voice_abc, num_notes, notes_per_measure, kick_stems_up, timeSigTop, timeSigBottom) {
		
		if(timeSigTop == 4 && timeSigBottom == 4 && (notes_per_measure % 3) == 0) { // triplets 
			return snare_HH_kick_ABC_for_triplets(sticking_array, HH_array, snare_array, kick_array, post_voice_abc, num_notes, notes_per_measure, kick_stems_up, timeSigTop, timeSigBottom);
		} else {
			return snare_HH_kick_ABC_for_quads(sticking_array, HH_array, snare_array, kick_array, post_voice_abc, num_notes, notes_per_measure, kick_stems_up, timeSigTop, timeSigBottom);
		}
	};
	
	// create ABC notation from a GrooveData class
	// returns a string of ABC Notation data
	
	root.createABCFromGrooveData = function(myGrooveData) {
	
		var FullNoteStickingArray = scaleNoteArrayToFullSize(myGrooveData.sticking_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
		var FullNoteHHArray       = scaleNoteArrayToFullSize(myGrooveData.hh_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
		var FullNoteSnareArray    = scaleNoteArrayToFullSize(myGrooveData.snare_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
		var FullNoteKickArray     = scaleNoteArrayToFullSize(myGrooveData.kick_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
	
		var fullABC = root.get_top_ABC_BoilerPlate(false, 
													myGrooveData.title, 
													myGrooveData.author, 
													myGrooveData.comments, 
													myGrooveData.showLegend, 
													root.isTripletDivision(myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue),
													myGrooveData.kickStemsUp,
													myGrooveData.numBeats,
													myGrooveData.noteValue);
		
		fullABC += root.create_ABC_from_snare_HH_kick_arrays(FullNoteStickingArray, 
																	  FullNoteHHArray, 
																	  FullNoteSnareArray, 
																	  FullNoteKickArray, 
																	  "|\n", 
																	  FullNoteHHArray.length, 
																	  myGrooveData.notesPerMeasure,
																	  myGrooveData.kickStemsUp,
																	  myGrooveData.numBeats,
																	  myGrooveData.noteValue);
			
		return fullABC;
	};
	
	// callback class for abc generator library
	function SVGLibCallback() {
		// -- required methods
		this.abc_svg_output = "";
		this.abc_error_output = "";
		
		// include a file (%%abc-include)
		this.read_file = function(fn) {
			return "";
		};
		// insert the errors
		this.errmsg = function(msg, l, c) {
			this.abc_error_output += msg + "<br/>\n";
		};
		
		// for possible playback or linkage
		this.get_abcmodel = function(tsfirst, voice_tb, music_types) {
			
			//console.log(tsfirst);
			//var next = tsfirst.next;
			//
			//while(next) {
			//	console.log(next);
			//	next = next.next;	
			//}	
		};
		
		// image output
		this.img_out = function(str) {
			this.abc_svg_output += str;	// + '\n'
		};
		
		// -- optional attributes
		this.page_format = true;		// define the non-page-breakable blocks
	}
	var abcToSVGCallback = new SVGLibCallback();   // singleton
	
	
	// converts incoming ABC notation source into an svg image.
	// returns an object with two items.   "svg" and "error_html"
	root.renderABCtoSVG = function(abc_source) {
		
		var abc = new Abc(abcToSVGCallback);
		abcToSVGCallback.abc_svg_output = '';   // clear
		abcToSVGCallback.abc_error_output = '';   // clear
		
		abc.tosvg("SOURCE", abc_source);
		return {
			svg: abcToSVGCallback.abc_svg_output,
			error_html: abcToSVGCallback.abc_error_output
		};	
	};
		
	
	// ******************************************************************************************************************
	// ******************************************************************************************************************
	//
	// MIDI functions
	//
	// ******************************************************************************************************************
	// ******************************************************************************************************************
	var baseLocation = "";  // global
	root.getGrooveUtilsBaseLocation = function() {
		
		if(baseLocation.length > 0)
			return baseLocation;
		
		if (global_grooveUtilsScriptSrc != "") {
			var lastSlash = global_grooveUtilsScriptSrc.lastIndexOf("/");
			// lets find the slash before it since we need to go up a directory
			lastSlash = global_grooveUtilsScriptSrc.lastIndexOf("/", lastSlash-1);
			baseLocation = global_grooveUtilsScriptSrc.slice(0,lastSlash+1);
		} 

		if(baseLocation.length < 1) {
			baseLocation = "https://b125c4f8bf7d89726feec9ab8202d31e0c8d14d8.googledrive.com/host/0B2wxVWzVoWGYfnB5b3VTekxyYUowVjZ5YVE3UllLaVk5dVd4TzF4Q2ZaUXVsazhNSTdRM1E/";
		}
		
		return baseLocation;
	};
	
	root.getMidiSoundFontLocation = function() {			
		return root.getGrooveUtilsBaseLocation() + "soundfont/";
	};
	root.getMidiImageLocation = function() {
		return root.getGrooveUtilsBaseLocation() + "images/";
	};
	
	root.midiEventCallbackClass = function(classRoot) {
		this.classRoot = classRoot;
		this.noteHasChangedSinceLastDataLoad = false;
		
		this.playEvent = function(root){
			var icon = document.getElementById("midiPlayImage" + root.grooveUtilsUniqueIndex);
			if(icon) 
				icon.className = "midiPlayImage Playing";
			
		}; 
		// default loadMIDIDataEvent.  You probably want to override this
		// it will only make changes to the tempo and swing
		this.loadMidiDataEvent = function(root) {
			if(root.myGrooveData) {
				root.myGrooveData.tempo = root.getTempo();
				root.myGrooveData.swingPercent = root.getSwing();
				root.myGrooveData.metronomeFrequency = root.getMetronomeFrequency();
				var midiURL = root.create_MIDIURLFromGrooveData(root.myGrooveData);
				root.loadMIDIFromURL(midiURL);		
				root.midiEventCallbacks.noteHasChangedSinceLastDataLoad = false;
			} else {
				alert("can't load midi song.   myGrooveData is empty");
			}
		}; 
		this.doesMidiDataNeedRefresh = function(root) { 
			return root.midiEventCallbacks.noteHasChangedSinceLastDataLoad;
		};
		this.pauseEvent = function(root){
			var icon = document.getElementById("midiPlayImage" + root.grooveUtilsUniqueIndex);
			if(icon) 
				icon.className = "midiPlayImage Paused";
		};  
		
		this.resumeEvent = function(root){};
		this.stopEvent = function(root){
			var icon = document.getElementById("midiPlayImage" + root.grooveUtilsUniqueIndex);
			if(icon) 
				icon.className = "midiPlayImage Stopped";
			document.getElementById("MIDIProgress" + root.grooveUtilsUniqueIndex).value = 0;
		};
		this.repeatChangeEvent = function(root, newValue){
			if(newValue)
				document.getElementById("midiRepeatImage" + root.grooveUtilsUniqueIndex).src=root.getMidiImageLocation() + "repeat.png";
			else
				document.getElementById("midiRepeatImage" + root.grooveUtilsUniqueIndex).src=root.getMidiImageLocation() + "grey_repeat.png";
		};
		this.percentProgress = function(root, percent){
			document.getElementById("MIDIProgress" + root.grooveUtilsUniqueIndex).value = percent;
		};
		this.notePlaying = function(root, note_type, note_position){};
		
		this.midiInitialized = function(root) {
				var icon = document.getElementById("midiPlayImage" + root.grooveUtilsUniqueIndex);
				if(icon) 
					icon.className = "midiPlayImage Stopped";
				document.getElementById("midiPlayImage" + root.grooveUtilsUniqueIndex).onclick = function (event){ root.startOrStopMIDI_playback();};  // enable play button
				setupHotKeys();  // spacebar to play
		};
	};
	root.midiEventCallbacks = new root.midiEventCallbackClass(root);
	
	// set a URL for midi playback.
	// usefull for static content, so you don't have to override the loadMidiDataEvent callback
	root.setGrooveData = function(grooveData) {
		root.myGrooveData = grooveData;
	};
	
	// This is called so that the MIDI player will reload the groove
	// at repeat time.   If not set then the midi player just repeats what is already loaded.
	root.midiNoteHasChanged = function() {
		root.midiEventCallbacks.noteHasChangedSinceLastDataLoad = true;
	};
	root.midiResetNoteHasChanged = function() {
		root.midiEventCallbacks.noteHasChangedSinceLastDataLoad = false;
	};
	
	/* 
	 * midi_output_type:  "general_MIDI" or "Custom"
	 * num_notes: number of notes in the arrays  (currently expecting 32 notes per measure)
	 * metronome_frequency: 0, 4, 8, 16   None, quarter notes, 8th notes, 16ths
	 * num_notes_for_swing: how many notes are we using.   Since we need to know where the upstrokes are we need to know
	 * 			what the proper division is.   It can change when we are doing permutations, otherwise it is what is the 
	 *			class_notes_per_measure
	 *
	 * The arrays passed in contain the ABC notation for a given note value or false for a rest.
	 */
	root.MIDI_from_HH_Snare_Kick_Arrays = function(midiTrack, HH_Array, Snare_Array, Kick_Array, midi_output_type, metronome_frequency, num_notes, num_notes_for_swing, swing_percentage, timeSigTop, timeSigBottom) { 
			var prev_metronome_note = false;
			var prev_hh_note = false;
			var prev_snare_note = false;
			var prev_kick_note = false;
			var prev_kick_splash_note = false;
			var midi_channel = 0;   
				
			if(swing_percentage < 0 || swing_percentage > 0.99)
			{
				alert("Swing percentage out of range in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
				swing_percentage = 0;
			}
			
			midi_channel = 9; // Percussion
			
			// Some sort of bug in the midi player makes it skip the first note without a blank
			// TODO: Find and fix midi bug
			if(midiTrack.events.length < 4)
				midiTrack.addNoteOff(midi_channel, 60, 1);  // add a blank note for spacing
					
			var isTriplets = root.isTripletDivision(num_notes_for_swing, timeSigTop, timeSigBottom);
			var delay_for_next_note = 0;
			
			for(var i=0; i < num_notes; i++)  {
	
				var duration = 0;
				var velocity_normal = 85; // how hard the note hits
				var velocity_accent = 120;
				var velocity_ghost = 50;
				
				if(isTriplets) {
					// triplets are only supported in 4/4 time so the duration is constant
					duration = 21.333;   // "ticks"   16 for 32nd notes.  21.33 for 24th triplets
				} else {
					duration = 16;   // todo: use time sig to determine duration of a 32nd note
				}
				
				if(swing_percentage != 0) {
					// swing effects the note placement of the e and the a.  (1e&a)
					// swing increases the distance between the 1 and the e ad shortens the distance between the e and the &
					// likewise the distance between the & and the a is increased and the a and the 1 is shortened
					//  So it sounds like this:   1-e&-a2-e&-a3-e&-a4-e&-a
					var scaler = num_notes / num_notes_for_swing;
					var val = i%(4*scaler);
					
					if(val < scaler) {
						// this is the 1, increase the distance between this note and the e
						duration += (duration * swing_percentage);
					} else if(val < scaler*2) {
						// this is the e, shorten the distance between this note and the &
						duration -= (duration * swing_percentage);
					} else if(val < scaler*3) {
						// this is the &, increase the distance between this note and the a
						duration += (duration * swing_percentage);
					} else if(val < scaler*4) {
						// this is the a, shorten the distance between this note and the 2
						duration -= (duration * swing_percentage);
					}
				}
				
				// Metronome sounds.
				var metronome_note = false;
				var metronome_velocity = velocity_accent;
				if(metronome_frequency > 0) {
					var quarterNoteFrequency = (isTriplets ? 6 : 8);
					var eighthNoteFrequency = (isTriplets ? 2 : 4);
					var sixteenthNoteFrequency = (isTriplets ? 1 : 2);
				
					// Special sound on the one
					if(i == 0 || (i % (quarterNoteFrequency * timeSigTop)) == 0) {
						metronome_note = 76;   // 1 count
						
					} else if((i % quarterNoteFrequency) == 0) {
						metronome_note = 77;   // standard metronome click
					}
						
					if(!metronome_note && metronome_frequency == 8) {  // 8th notes requested
						if((i % eighthNoteFrequency) == 0) {
							// click every 8th note
							metronome_note = 77;   // standard metronome click
						}
							
					} else if(!metronome_note && metronome_frequency == 16) {  // 16th notes requested
						if((i % sixteenthNoteFrequency) == 0) {
							// click every 16th note
							metronome_note = 77;   // standard metronome click
							metronome_velocity = 25;   // not as loud as the normal click
						}
					}	
					
					if(metronome_note != false) {
						//if(prev_metronome_note != false)
						//	midiTrack.addNoteOff(midi_channel, prev_metronome_note, 0);
						midiTrack.addNoteOn(midi_channel, metronome_note, delay_for_next_note, metronome_velocity);
						delay_for_next_note = 0;   // zero the delay
						//prev_metronome_note = metronome_note;
					}
				}
				
				var hh_velocity = velocity_normal;
				var hh_note = false;
				switch(HH_Array[i]) {
					case constant_ABC_HH_Normal:  // normal
					case constant_ABC_HH_Close:  // normal
							hh_note = 42;
						break;
					case constant_ABC_HH_Accent:  // accent
						if(midi_output_type == "general_MIDI") {
							hh_note = 42;
							hh_velocity = velocity_accent;
						} else {
							hh_note = 108;
						}
						break;
					case constant_ABC_HH_Open:  // open
							hh_note = 46;
						break;
					case constant_ABC_HH_Ride:  // ride
							hh_note = 51;
						break;
					case constant_ABC_HH_Crash:  // crash
							hh_note = 49;
						break;
					case false:
						break;
					default:
						alert("Bad case in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
						break;
				}
				
				if(hh_note != false) {
					if(0 && prev_hh_note != false) {
						midiTrack.addNoteOff(midi_channel, prev_hh_note, delay_for_next_note);
						delay_for_next_note = 0;   // zero the delay
					}
					midiTrack.addNoteOn(midi_channel, hh_note, delay_for_next_note, hh_velocity);
					delay_for_next_note = 0;   // zero the delay
					prev_hh_note = hh_note;
				}
				
				var snare_velocity = velocity_normal;
				var snare_note = false;
				switch(Snare_Array[i]) {
					case constant_ABC_SN_Normal:  // normal
							snare_note = 38;
						break;
					case constant_ABC_SN_Flam: // flam
						if(midi_output_type == "general_MIDI") {
							snare_note = 38;
							snare_velocity = velocity_accent;
						} else {
							snare_note = 107;
							snare_velocity = velocity_normal;
						}
						break;
					case constant_ABC_SN_Accent:  // accent
						if(midi_output_type == "general_MIDI") {
							snare_note = 38;
							snare_velocity = velocity_accent;
						} else {
							snare_note = 22;   // custom note
						}
						break;	
					case constant_ABC_SN_Ghost:  // ghost
						if(midi_output_type == "general_MIDI") {
							snare_note = 38;
							snare_velocity = velocity_ghost;
						} else {
							snare_note = 21;
							snare_velocity = velocity_ghost;
						}
						break;	
					case constant_ABC_SN_XStick:  // xstick
							snare_note = 37;
						break;
					case false:
						break;
					default:
						alert("Bad case in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
						break;
				}
				
				if(snare_note != false) {
					//if(prev_snare_note != false)
					//	midiTrack.addNoteOff(midi_channel, prev_snare_note, 0);
					midiTrack.addNoteOn(midi_channel, snare_note, delay_for_next_note, snare_velocity);
					delay_for_next_note = 0;   // zero the delay
					//prev_snare_note = snare_note;
				}
			
				var kick_velocity = velocity_normal;
				var kick_note = false;
				var kick_splash_note = false;
				switch(Kick_Array[i]) {
				case constant_ABC_KI_Splash:  // normal
						kick_splash_note = 44;
					break;	
				case constant_ABC_KI_SandK:  // normal
						kick_splash_note = 44;
						kick_note = 35;
					break;	
				case constant_ABC_KI_Normal:  // normal
						kick_note = 35;
					break;	
				case false:
					break;
				default:
					alert("Bad case in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
					break;
				}
				if(kick_note != false) {
					//if(prev_kick_note != false)
					//	midiTrack.addNoteOff(midi_channel, prev_kick_note, 0);
					midiTrack.addNoteOn(midi_channel, kick_note, delay_for_next_note, kick_velocity);
					delay_for_next_note = 0;   // zero the delay
					//prev_kick_note = kick_note;
				}
				if(kick_splash_note != false) {
					//if(prev_kick_splash_note != false)
					//	midiTrack.addNoteOff(midi_channel, prev_kick_splash_note, 0);
					midiTrack.addNoteOn(midi_channel, kick_splash_note, delay_for_next_note, kick_velocity);
					delay_for_next_note = 0;   // zero the delay
					//prev_kick_splash_note = kick_splash_note;
				}
				
				delay_for_next_note += duration;
			}
			
			if(delay_for_next_note)
				midiTrack.addNoteOff(0, 60, delay_for_next_note-1);  // add a blank note for spacing
			
	}; // end of function
	
	// returns a URL that is a MIDI track
	root.create_MIDIURLFromGrooveData = function(myGrooveData, MIDI_type) {
		
		var midiFile = new Midi.File();
		var midiTrack = new Midi.Track();
		midiFile.addTrack(midiTrack);

		midiTrack.setTempo(myGrooveData.tempo);
		midiTrack.setInstrument(0, 0x13);
		
		var swing_percentage = myGrooveData.swingPercent/100;
		
		// the midi converter expects all the arrays to be 32 or 24 notes long.  
		// Expand them
		var FullNoteHHArray       = scaleNoteArrayToFullSize(myGrooveData.hh_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
		var FullNoteSnareArray    = scaleNoteArrayToFullSize(myGrooveData.snare_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
		var FullNoteKickArray     = scaleNoteArrayToFullSize(myGrooveData.kick_array, myGrooveData.showMeasures, myGrooveData.notesPerMeasure, myGrooveData.numBeats, myGrooveData.noteValue);
	
		var total_notes = FullNoteHHArray.length;
		root.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, 
											FullNoteHHArray, 
											FullNoteSnareArray, 
											FullNoteKickArray, 
											MIDI_type, 
											myGrooveData.metronomeFrequency,
											total_notes, 
											myGrooveData.notesPerMeasure, 
											swing_percentage, 
											myGrooveData.numBeats, 
											myGrooveData.noteValue);
			
				
		var midi_url = "data:audio/midi;base64," + btoa(midiFile.toBytes());
		
		return midi_url;
	};
	
	root.loadMIDIFromURL = function(midiURL) {
		
		MIDI.Player.timeWarp = 1; // speed the song is played back
		MIDI.Player.BPM = root.getTempo();
		MIDI.Player.loadFile(midiURL, MIDILoaderCallback());
	};
	
	root.MIDI_save_as = function(midiURL) {
		
		// save as 
		document.location = midiURL;
	};
	
	root.pauseMIDI_playback = function() {
		if(root.isMIDIPaused == false) {
			root.isMIDIPaused = true;
			root.midiEventCallbacks.pauseEvent(root.midiEventCallbacks.classRoot);
			MIDI.Player.pause();
			root.midiEventCallbacks.notePlaying(root.midiEventCallbacks.classRoot, "clear", -1);
		}
	};
	
	// play button or keypress
	root.startMIDI_playback = function() {
		if(MIDI.Player.playing) {
			return;
		} else if(root.isMIDIPaused && false == root.midiEventCallbacks.doesMidiDataNeedRefresh(root.midiEventCallbacks.classRoot) ) {
			root.current_midi_start_time = new Date();
			root.last_midi_update_time = 0;
			MIDI.Player.resume();
		} else {
			root.current_midi_start_time = new Date();
			root.last_midi_update_time = 0;
			root.midiEventCallbacks.loadMidiDataEvent(root.midiEventCallbacks.classRoot);
			MIDI.Player.stop();
			MIDI.Player.loop(root.shouldMIDIRepeat);   // set the loop parameter
			MIDI.Player.start();
		}
		root.midiEventCallbacks.playEvent(root.midiEventCallbacks.classRoot);
		root.isMIDIPaused = false;
	};
	
	// stop button or keypress
	root.stopMIDI_playback = function() {
		if(MIDI.Player.playing || root.isMIDIPaused ) {
			root.isMIDIPaused = false;
			MIDI.Player.stop();
			root.midiEventCallbacks.stopEvent(root.midiEventCallbacks.classRoot);
			root.midiEventCallbacks.notePlaying(root.midiEventCallbacks.classRoot, "clear", -1);
		} 
	};
	
	// modal play/stop button
	root.startOrStopMIDI_playback = function() {
		
		if(MIDI.Player.playing) {
			root.stopMIDI_playback();
		} else {
			root.startMIDI_playback();
		}			
	};
	
	// modal play/pause button
	root.startOrPauseMIDI_playback = function() {
		
		if(MIDI.Player.playing) {
			root.pauseMIDI_playback();
		} else {
			root.startMIDI_playback();
		}			
	};
	
	root.repeatMIDI_playback = function() {
		if(root.shouldMIDIRepeat == false) {
			root.shouldMIDIRepeat = true;
			MIDI.Player.loop(true);
		} else {
			root.shouldMIDIRepeat = false;
			MIDI.Player.loop(false);
		}
		root.midiEventCallbacks.repeatChangeEvent(root.midiEventCallbacks.classRoot, root.shouldMIDIRepeat);
			
	};
	
	root.oneTimeInitializeMidi = function() {
		
		if(root.midiInitialized) {
			root.midiEventCallbacks.midiInitialized(root.midiEventCallbacks.classRoot);
			return;
		}
		
		root.midiInitialized = true;
		MIDI.loadPlugin({
			soundfontUrl: root.getMidiSoundFontLocation(),
			instruments: ["gunshot" ],
			callback: function() {
				MIDI.programChange(9, 127);   // use "Gunshot" instrument because I don't know how to create new ones
				root.midiEventCallbacks.midiInitialized(root.midiEventCallbacks.classRoot);
			}
		});
	};
	
	// update the midi play timer on the player. 
	// Keeps track of how long we have been playing.
	root.updateMidiPlayTime = function() {
	
		var time_now = new Date();
		var play_time_diff = new Date(time_now.getTime() - root.current_midi_start_time.getTime());
		var time_string = play_time_diff.getUTCMinutes() + ":" + (play_time_diff.getSeconds() < 10 ? "0" : "") + play_time_diff.getSeconds();
		
		var MidiPlayTime = document.getElementById("MIDIPlayTime" + root.grooveUtilsUniqueIndex);
        if(MidiPlayTime)
            MidiPlayTime.innerHTML = time_string;
			
		/* 	
		var TotalPlayTime = document.getElementById("totalPlayTime");
		if(TotalPlayTime) {
			if(root.last_midi_update_time == 0)
				root.last_midi_update_time = root.current_midi_start_time;
			var delta_time_diff = new Date(time_now - root.last_midi_update_time);
			root.total_midi_play_time_msecs += delta_time_diff.getTime();
			var totalTime = new Date(root.total_midi_play_time_msecs);
			time_string = "";
			if(totalTime.getUTCHours() > 0)
				time_string = totalTime.getUTCHours() + ":" + (totalTime.getUTCMinutes() < 10 ? "0" : "");
			time_string += totalTime.getUTCMinutes() + ":" + (totalTime.getSeconds() < 10 ? "0" : "") + totalTime.getSeconds();
			TotalPlayTime.innerHTML = "Total Time: " + time_string;
		}
		*/
		
		root.last_midi_update_time = time_now;
	};
	
	var debug_note_count = 0;
	//var class_midi_note_num = 0;  // global, but only used in this function
	// This is the function that the 3rd party midi library calls to give us events.
	// This is different from the callbacks that we use for the midi code in this library to
	// do events.   (Double chaining)
	function ourMIDICallback(data) {
		var percentComplete = (data.now/data.end);
		root.midiEventCallbacks.percentProgress(root.midiEventCallbacks.classRoot, percentComplete*100);
		
		if(root.lastMidiTimeUpdate && root.lastMidiTimeUpdate < (data.now+800)) {
			root.updateMidiPlayTime();
			root.lastMidiTimeUpdate = data.now;
		}
		
		if(data.now < 16) {
			// this is considered the start.   It doesn't come in at zero for some reason
			// The second note should always be at least 16 ms behind the first
			//class_midi_note_num = 0;
			root.lastMidiTimeUpdate = -1;
		}
		if(data.now == data.end) {
			
			if(root.shouldMIDIRepeat) {
		
				if(root.midiEventCallbacks.doesMidiDataNeedRefresh(root.midiEventCallbacks.classRoot)) {
					MIDI.Player.stop();
					root.midiEventCallbacks.loadMidiDataEvent(root.midiEventCallbacks.classRoot);
					MIDI.Player.start();
				} else {
					// let midi.loop handle the repeat for us
					//MIDI.Player.stop();
					//MIDI.Player.start();
				}
			} else {
				// not repeating, so stopping
				MIDI.Player.stop();
				root.midiEventCallbacks.percentProgress(root.midiEventCallbacks.classRoot, 100);
				root.midiEventCallbacks.stopEvent(root.midiEventCallbacks.classRoot);
			}
		}
		
		// note on
		var note_type = false;
		if(data.message == 144) {
			if(data.note == 108 || data.note == 42 || data.note == 46 || data.note == 49 || data.note == 51)  {
				note_type = "hi-hat";
			} else if(data.note == 21 || data.note == 22 || data.note == 37 || data.note == 38 || data.note == 107) {
				note_type = "snare";
			} else if(data.note == 35 || data.note == 44) {
				note_type = "kick";
			}
			if(note_type)
				root.midiEventCallbacks.notePlaying(root.midiEventCallbacks.classRoot, note_type, percentComplete);
		}
		
		// this used to work when we used note 60 as a spacer between chords
		//if(data.note == 60)
		//	class_midi_note_num++;
	
		if(0 && data.message == 144) {
			debug_note_count++;
			// my debugging code for midi
			var newHTML = "";
			if(data.note != 60)
				newHTML += "<b>";
				
			newHTML += note_type + " total notes: " + debug_note_count + " - count#: " + class_midi_note_num + 
											" now: " + data.now + 
											" note: " + data.note + 
											" message: " + data.message + 
											" channel: " + data.channel + 
											" velocity: " + data.velocity +
											"<br>";
											
			if(data.note != 60)
				newHTML += "</b>";
			
			document.getElementById("midiTextOutput").innerHTML += newHTML;
		}
		
	}
	
	function MIDILoaderCallback() {
		MIDI.Player.addListener(ourMIDICallback);
	}
	
    root.getTempo = function() {
        var tempo = parseInt(document.getElementById("tempoInput" + root.grooveUtilsUniqueIndex).value, 10);
        if(tempo < 19 && tempo > 281)
            tempo = constant_default_tempo;
        
        return tempo;
    };

	// we need code to make the range slider colors update properly
	function updateRangeSlider(sliderID) {
		
		var slider = document.getElementById(sliderID);
        var programaticCSSRules = document.getElementById(sliderID + "CSSRules");
		if(!programaticCSSRules) {
			// create a new one.
			programaticCSSRules = document.createElement('style');
			programaticCSSRules.id = sliderID + "CSSRules";
			document.body.appendChild(programaticCSSRules);
		}
		
	    // change the before and after colors of the slider using a gradiant
	    var percent = Math.ceil(((slider.value - slider.min) / (slider.max - slider.min)) * 100);
        
		var new_style_str = '#' + sliderID + '::-moz-range-track' + '{ background: -moz-linear-gradient(left, #49b4f8 ' + percent + '%, #005789 ' + percent + '%)}\n';
		new_style_str += '#' + sliderID + '::-webkit-slider-runnable-track' + '{ background: -webkit-linear-gradient(left, #49b4f8 0%, #49b4f8 ' + percent + '%, #005789 ' + percent + '%)}\n';
		programaticCSSRules.textContent = new_style_str;

	}
	
	// update the tempo string display
	function tempoUpdate(tempo) {
		document.getElementById('tempoOutput' + root.grooveUtilsUniqueIndex).innerHTML = "" + tempo;
		
		updateRangeSlider('tempoInput' + root.grooveUtilsUniqueIndex);
		root.midiNoteHasChanged();
	}
	
	root.setTempo = function(newTempo) {
		if(newTempo < 19 && newTempo > 281)
            return;
        
		document.getElementById("tempoInput" + root.grooveUtilsUniqueIndex).value = newTempo;
        tempoUpdate(newTempo);
	};

	// update the tempo string display
	root.tempoUpdateEvent = function(event) {
		tempoUpdate(event.target.value);
	};
	
	root.doesDivisionSupportSwing = function(division) {
	
		if(root.isTripletDivision(division, 4, 4) || division == 4)
			return false;
	};
	
	root.setSwingSlider = function(newSetting) {
		document.getElementById("swingInput" + root.grooveUtilsUniqueIndex).value = newSetting;
		updateRangeSlider('swingInput' + root.grooveUtilsUniqueIndex);
	};
	
	root.swingEnabled = function(trueElseFalse) {
		
		root.swingIsEnabled = trueElseFalse;
		
		if(root.swingIsEnabled == false) {
			root.setSwingSlider(0);
		}
	
		root.swingUpdate(0);  // update N/A label
		
	};
	
	root.getSwing = function() {
        var swing = parseInt(document.getElementById("swingInput" + root.grooveUtilsUniqueIndex).value, 10);
        if(swing < 0 || swing > 60)
            swing = 0;
        
        if(root.swingIsEnabled == false)
            swing = 0;
        
        // our real swing value only goes to 60%. 
        return (swing);
    };

	// used to update the on screen swing display
	// also the onClick handler for the swing slider
	root.swingUpdate = function(swingAmount) {
		if(!swingAmount) {
			// grab the actual amount from the slider
			swingAmount = parseInt(document.getElementById("swingInput" + root.grooveUtilsUniqueIndex).value, 10);
		}
		
		if(root.swingIsEnabled == false) {
			document.getElementById('swingOutput'+ root.grooveUtilsUniqueIndex).innerHTML = "N/A";	
		} else {
			document.getElementById('swingOutput'+ root.grooveUtilsUniqueIndex).innerHTML = "" + swingAmount + "%";
			root.swingPercent = swingAmount;
			root.midiNoteHasChanged();
		}
		
	};
	
	root.swingUpdateEvent = function(event) {
		
		if(root.swingIsEnabled == false) {
			root.setSwingSlider(0);
		} else {
			root.swingUpdate(event.target.value);
			updateRangeSlider('swingInput' + root.grooveUtilsUniqueIndex);
		}
	};
	
	
	root.expandOrRetractMIDI_playback = function(force, expandElseContract) {
		var tempoAndProgressElement = document.getElementById('tempoAndProgress'+ root.grooveUtilsUniqueIndex);
		var playerControlElement = document.getElementById('playerControl'+ root.grooveUtilsUniqueIndex);
		var midiExpandImageElement = document.getElementById('midiExpandImage'+ root.grooveUtilsUniqueIndex);
		var midiPlayTime = document.getElementById('MIDIPlayTime'+ root.grooveUtilsUniqueIndex);
		var midiProgressRow = document.getElementById('MIDIProgressRow' + root.grooveUtilsUniqueIndex);
		var midiProgressElement = document.getElementById('MIDIProgress'+ root.grooveUtilsUniqueIndex);
		var midiMetronomeSelector = document.getElementById('metronomeSelector'+ root.grooveUtilsUniqueIndex);
		
		if( tempoAndProgressElement.style.display == "none" || (force && expandElseContract) ) {
			playerControlElement.style.width = '100%';
			midiExpandImageElement.src = root.getMidiImageLocation() + "shrinkLeft.png";
			midiPlayTime.style.display = 'inline-block';
			midiProgressElement.style.width = midiProgressRow.offsetWidth - 147 + "px";
			midiMetronomeSelector.style.display = 'inline-block';
			tempoAndProgressElement.style.display = 'inline-block';
		} else {
			tempoAndProgressElement.style.display = 'none';
			playerControlElement.style.width = '85px';
			midiExpandImageElement.src = root.getMidiImageLocation() + "expandRight.png";
			midiPlayTime.style.display = 'none';
			midiProgressElement.style.width = '45px';
			midiMetronomeSelector.style.display = 'none';
		
		}
	};
	
	// handle a click on the metronome (click) text that is part of the midi player
	root.metronomeSelectorClick = function(event) {	
		
		var contextMenu = document.getElementById("metronomeContextMenu" + root.grooveUtilsUniqueIndex); 
			
		if(contextMenu) {
			if(!event) event = window.event;
			if (event.pageX || event.pageY)
			{
				contextMenu.style.top = event.pageY-30 + "px";
				contextMenu.style.left = event.pageX-75 + "px";
			}
			root.showContextMenu(contextMenu);
		}
	};
	
	
	var CONSTANT_Metronome_text_OFF = "No Click";
	var CONSTANT_Metronome_text_4   = "1/4 note";
	var CONSTANT_Metronome_text_8   = "1/8 note";
	var CONSTANT_Metronome_text_16  = "1/16 note";
	root.metronomePopupClick = function(newValue) {
		var metronomeDisplay = document.getElementById("metronomeSelector" + root.grooveUtilsUniqueIndex); 
		
		if(metronomeDisplay) {
			switch(newValue) {
				
				case 4:
					metronomeDisplay.innerHTML = CONSTANT_Metronome_text_4;
					break;
				case 8:
					metronomeDisplay.innerHTML = CONSTANT_Metronome_text_8;
					break;
				case 16:
					metronomeDisplay.innerHTML = CONSTANT_Metronome_text_16;
					break;
				case 0:
				default:
					metronomeDisplay.innerHTML = CONSTANT_Metronome_text_OFF;
					break;
			}
			
			root.midiNoteHasChanged();
		}
	};
	
	root.getMetronomeFrequency = function(newValue) {
		var metronomeDisplay = document.getElementById("metronomeSelector" + root.grooveUtilsUniqueIndex); 
		var returnValue = 0;
		
		if(metronomeDisplay) {
			if(metronomeDisplay.innerHTML == CONSTANT_Metronome_text_4)
				returnValue = 4;
			else if(metronomeDisplay.innerHTML == CONSTANT_Metronome_text_8)
				returnValue = 8;
			else if(metronomeDisplay.innerHTML == CONSTANT_Metronome_text_16)
				returnValue = 16;
				
			// default case is 0
		}
		
		return returnValue;
	};
	
	root.HTMLForMidiPlayer = function(expandable) {
		var newHTML = '' +
			'<span id="playerControl' + root.grooveUtilsUniqueIndex + '" class="playerControl">' +
			'	<div class="playerControlsRow">' +
			'		<span class="midiPlayImage" id="midiPlayImage' + root.grooveUtilsUniqueIndex + '"></span>' +
			'       <span class="MIDIPlayTime" id="MIDIPlayTime' + root.grooveUtilsUniqueIndex + '">' + CONSTANT_Midi_play_time_zero + '</span>' +
			'		<span class="tempoAndProgress" id="tempoAndProgress' + root.grooveUtilsUniqueIndex + '">' +
			'			<div class="tempoRow">' +
			'				<span class="tempoLabel"">BPM</span>' +
			'				<div for="tempo" class="tempoOutput" id="tempoOutput' + root.grooveUtilsUniqueIndex + '">80</div>' +
			'				<input type=range min=40 max=240 value=90 class="tempoInput" id="tempoInput' + root.grooveUtilsUniqueIndex + '" list="tempoSettings" step=5>' +
			'			</div>' +
			'			<div class="swingRow">' +
			'				<span class="swingLabel">SWING</span>' +
			'				<div for="swingAmount" class="swingOutput" id="swingOutput' + root.grooveUtilsUniqueIndex + '">0% swing</div>' +
			'				<input type=range min=0 max=50 value=0 class="swingInput" id="swingInput' + root.grooveUtilsUniqueIndex + '" list="swingSettings" step=5 >' +
			'			</div>' +
			'		</span>';
			
			//'		<img alt="Repeat" title="Repeat" class="midiRepeatImage" id="midiRepeatImage' + root.grooveUtilsUniqueIndex + '" src="' + root.getMidiImageLocation() + 'repeat.png">'
		
		if(expandable)
			newHTML += 	'       <img alt="expand/contract" class="midiExpandImage" id="midiExpandImage' + root.grooveUtilsUniqueIndex + '" src="' + root.getMidiImageLocation() + 'shrinkLeft.png" width="32" height="32">';
		
		
		newHTML += '' + 	
			'	</div>' +
			'	<div class="MIDIProgressRow" id="MIDIProgressRow' + root.grooveUtilsUniqueIndex + '">' +
			'		<progress class="MIDIProgress" id="MIDIProgress' + root.grooveUtilsUniqueIndex + '" value="0" max="100"></progress>' +
			'		<span class="metronomeSelector" id="metronomeSelector' + root.grooveUtilsUniqueIndex + '">' + CONSTANT_Metronome_text_OFF + '</span>' +
			'	</div>' +
			'</span>';
			
		// context menu for the metronome (Click)
		newHTML += '' +
			'<div class="metronomeContextMenu">' +
			'	<ul id="metronomeContextMenu' + root.grooveUtilsUniqueIndex + '" class="list">' +
			'		<li id="metronomeSelectOff' + root.grooveUtilsUniqueIndex + '">Metronome <b>Off</b></li>' +
			'		<li id="metronomeSelect4' + root.grooveUtilsUniqueIndex + '" ><b>Quarter</b> note click</li>' +
			'		<li id="metronomeSelect8' + root.grooveUtilsUniqueIndex + '" ><b>8th</b> note click</li>' +
			'		<li id="metronomeSelect16' + root.grooveUtilsUniqueIndex + '"><b>16th</b> note click</li>' +
			'	</ul>' +
			'</div>';
			
		return newHTML;
	};
	
	// pass in a tag ID.  (not a class)
	// HTML will be put within the tag replacing whatever else was there
	root.AddMidiPlayerToPage = function(HTML_Id_to_attach_to, division, expandable) {
		var html_element = document.getElementById(HTML_Id_to_attach_to); 
		if(html_element)
			html_element.innerHTML = root.HTMLForMidiPlayer(expandable);
			
		// now attach the onclicks
		html_element = document.getElementById("tempoInput" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("input", root.tempoUpdateEvent, false);
		}
		
		html_element = document.getElementById("swingInput" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("input", root.swingUpdateEvent, false);
		}
		
		html_element = document.getElementById("midiRepeatImage" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", root.repeatMIDI_playback, false);
		}

		html_element = document.getElementById("midiExpandImage" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", root.expandOrRetractMIDI_playback, false);
		}
		
		html_element = document.getElementById("metronomeSelector" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", root.metronomeSelectorClick, false);
		}
		
		html_element = document.getElementById("metronomeSelectOff" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", function(){root.metronomePopupClick(0);}, false);
		}
		
		html_element = document.getElementById("metronomeSelect4" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", function(){root.metronomePopupClick(4);}, false);
		}
		
		html_element = document.getElementById("metronomeSelect8" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", function(){root.metronomePopupClick(8);}, false);
		}
		
		html_element = document.getElementById("metronomeSelect16" + root.grooveUtilsUniqueIndex); 
		if(html_element) {
			html_element.addEventListener("click", function(){root.metronomePopupClick(16);}, false);
		}
				
		// enable or disable swing
		root.swingEnabled( root.doesDivisionSupportSwing(division) );
	};

} // end of class
	