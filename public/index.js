var oscillators = {};
var context = {};
var midi, data;

function setUpEverything() {
   context = new AudioContext();
   if (context instanceof AudioContext) {
    document.getElementById("start-button").innerHTML = "Audio Engine Started";
    document.getElementById("start-button").disabled = true;
   }
  var oscillators = {};
  
  if (navigator.requestMIDIAccess) {
    navigator
      .requestMIDIAccess({
        sysex: false,
      })
      .then(onMIDISuccess, onMIDIFailure);
  } else {
    console.warn("No MIDI support in your browser");
  }
}
function onMIDISuccess(midiData) {
  console.log(midiData);
  midi = midiData;
  var allInputs = midi.inputs.values();
  for (
    var input = allInputs.next();
    input && !input.done;
    input = allInputs.next()
  ) {
    input.value.onmidimessage = onMIDImessage;
    console.log(input.value.name);
  }
}
function onMIDIFailure() {
  console.warn("Not finding a MIDI controller");
}

function onMIDImessage(messageData) {
  if (messageData.data != 254) {
    var newItem = document.createElement("li");
    newItem.appendChild(document.createTextNode(messageData.data));
    newItem.className = "user-midi";
    document.getElementById("midi-data").prepend(newItem);
    var d = messageData.data; // Example: [144, 60, 100]
    var note = {
      on: d[0],
      pitch: d[1],
      velocity: d[2],
    };
    play(note);
  }
}

function play(note) {
  switch (note.on) {
    case 144:
      if(note.velocity == 0)
      noteOff(frequency(note.pitch), note.velocity);
      else
      noteOn(frequency(note.pitch), note.velocity);
      break;
    case 128:
      noteOff(frequency(note.pitch), note.velocity);
      break;
  }
  function frequency(note) {
    return Math.pow(2, (note - 69) / 12) * 440;
  }
  function noteOn(frequency, velocity) {
    var osc = oscillators[frequency] = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(context.destination);
    osc.start(context.currentTime);
  }
  function noteOff(frequency, velocity) {
    oscillators[frequency].stop(context.currentTime);
    oscillators[frequency].disconnect();
  }
}







(function(window, document, undefined) {
  var notes, midi, currentInput;

  function onMidiMessage(msg) {
    var action = isNoteOffMessage(msg) ? 'remove' :
                   (isNoteOnMessage(msg) ? 'add' : null),
        noteDiv;
    if(action && (noteDiv = getNoteDiv(msg))) {
      noteDiv.classList[action]('piano-key-pressed');
      
      // -- Remove these lines if you're building the app from Medium ------------
      // -- Otherwise you'll get multiple appended elemetns ----------------------
      // if (msg.data[0] == 144) {
      //   $('.instructions').remove()
      //   var input = '<li class="user-midi">Note: ' + msg.data[1] + '     Velocity:   ' + msg.data[2];
      //   $('#midi-data').prepend(input)
      // }
      //------------------------------------------------------------------------//
    }
  }

  const MIDI_A0_NUM = 45;

  function getNoteDiv(msg) {
    var noteNum = getMessageNote(msg) - MIDI_A0_NUM;

    if(notes && 0 <= noteNum && noteNum < notes.length) {
      return notes[noteNum];
    }
  }

  const CMD_NOTE_ON = 9;
  const CMD_NOTE_OFF = 8;

  function isNoteOnMessage(msg) {
    return getMessageCommand(msg) == CMD_NOTE_ON;
  }

  function isNoteOffMessage(msg) {
    var cmd = getMessageCommand(msg);
    return cmd == CMD_NOTE_OFF ||
      (cmd == CMD_NOTE_ON && getMessageVelocity(msg) == 0);
  }

  function getMessageCommand(msg) { return msg.data[0] >> 4; }
  function getMessageNote(msg) { return msg.data[1]; }
  function getMessageVelocity(msg) { return msg.data[2]; }

  function selectInput(input) {
    if(input != currentInput) {
      if(currentInput) {
        currentInput.removeEventListener('midimessage', onMidiMessage);
        currentInput.close();
      }

      input.addEventListener('midimessage', onMidiMessage);
      currentInput = input;
    }
  }

  function populateInputList() {
    var inputs = Array.from(midi.inputs.values());

    if(inputs.length == 1) {
      selectInput(inputs[0]);
    } else {
      // TODO: handle multiple MIDI inputs
    }
  }

  function onMIDIAccessSuccess(access) {
    midi = access;
    access.addEventListener('statechange', populateInputList, false);
    populateInputList();
  }

  function onMIDIAccessFail() {
    console.error('Request for MIDI access was denied!');
  }

  if('requestMIDIAccess' in window.navigator) {
    window.navigator
      .requestMIDIAccess()
      .then(onMIDIAccessSuccess, onMIDIAccessFail);
  } else {
    console.error('Your device doesn\' support WebMIDI or its polyfill');
  }

  document.addEventListener('DOMContentLoaded', function() {
    notes = document.getElementsByClassName('piano-key');
  }, false);

  //extrnal midi will trigger this
  function updateKeyboard() {
      var action = isNoteOffMessage(msg) ? 'remove' :
                   (isNoteOnMessage(msg) ? 'add' : null),
          noteDiv;
      if(action && (noteDiv = getNoteDiv(msg))) {
        noteDiv.classList[action]('piano-key-pressed-external');
      }
  }
})(window, window.document);