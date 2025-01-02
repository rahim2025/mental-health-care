const socket = io();

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const usernameInput = document.getElementById('username');
const userList = document.getElementById('allUsers');
const callPrompt = document.getElementById('call-prompt');
const acceptCallBtn = document.getElementById('accept-call');
const declineCallBtn = document.getElementById('decline-call');

// Call state
let callState = {
  isInCall: false,
  caller: null,
  callee: null
};

// WebRTC configuration
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

let localStream = null;
let remoteUserId = null;

// Stream handling functions
async function startLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Add tracks to peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  } catch (error) {
    console.error('Error accessing media devices:', error);
    alert('Failed to access your camera or microphone.');
  }
}

// Call handling functions
async function startCall(userId) {
  if (callState.isInCall) {
    alert('You are already in a call!');
    return;
  }

  remoteUserId = userId;
  callState.isInCall = true;
  callState.caller = socket.id;
  callState.callee = userId;

  // Create and send offer
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', {
      offer: peerConnection.localDescription,
      to: userId,
      from: socket.id
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    resetCall();
  }
}

function acceptCall() {
  callPrompt.style.display = 'none';
  callState.isInCall = true;

  // Update UI for active call (example)
  document.querySelectorAll('.call-btn').forEach(btn => btn.style.display = 'none');
  document.querySelectorAll('.end-call-btn').forEach(btn => btn.style.display = 'block'); 
}

function declineCall() {
  callPrompt.style.display = 'none';
  socket.emit('call-declined', { to: callState.caller });
  resetCall();
}

function endCall() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach(track => track.stop());
  }

  peerConnection.close();
  resetCall();

  socket.emit('call-ended', { to: remoteUserId });

  // Reset videos
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  // Restart local stream and create new peer connection
  setupPeerConnection();
  startLocalStream();

  // Reset UI (example)
  document.querySelectorAll('.call-btn').forEach(btn => btn.style.display = 'block');
  document.querySelectorAll('.end-call-btn').forEach(btn => btn.style.display = 'none'); 
}

function resetCall() {
  callState.isInCall = false;
  callState.caller = null;
  callState.callee = null;
  remoteUserId = null;
}

function setupPeerConnection() {
  // ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        candidate: event.candidate,
        to: remoteUserId
      });
    }
  };

  // Remote stream handling
  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };
}

// Socket event handlers

socket.on('offer', async ({ offer, from }) => {
  if (callState.isInCall) {
    socket.emit('busy', { to: from });
    return;
  }

  remoteUserId = from;
  callState.caller = from;

  // Show incoming call prompt
  callPrompt.style.display = 'block';

  // Set up accept/decline handlers
  acceptCallBtn.onclick = async () => {
    acceptCall();
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', {
        answer: peerConnection.localDescription,
        to: from
      });
    } catch (error) {
      console.error('Error creating answer:', error);
      resetCall();
    }
  };

  declineCallBtn.onclick = declineCall;
});

socket.on('answer', async ({ answer }) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error setting remote description:', error);
  }
});

socket.on('ice-candidate', async ({ candidate }) => {
  try {
    if (candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
});

socket.on('call-declined', () => {
  alert('Call was declined');
  resetCall();
});

socket.on('call-ended', () => {
  alert('Call ended by remote user');
  endCall();
});

socket.on('busy', () => {
  alert('User is busy in another call');
  resetCall();
});

// --- Updated Section ---
socket.on('joined', (allUsers) => {
  userList.innerHTML = ''; // Clear the existing list

  Object.keys(allUsers).forEach((userId) => {
    const li = document.createElement('li');
    li.textContent = `${allUsers[userId].username} ${userId === socket.id ? '(You)' : ''}`;

    // Add Call and End Call buttons (adjust classes if needed)
    if (userId !== socket.id) {
      const callButton = document.createElement('button');
      callButton.textContent = 'Call';
      callButton.classList.add('call-btn', 'btn', 'btn-primary', 'mx-2'); // Add call-btn class
      callButton.addEventListener('click', () => startCall(userId));

      const endCallButton = document.createElement('button');
      endCallButton.textContent = 'End Call';
      endCallButton.classList.add('end-call-btn', 'btn', 'btn-danger'); // Add end-call-btn class
      endCallButton.style.display = 'none'; // Initially hide End Call button
      endCallButton.addEventListener('click', endCall);

      li.appendChild(callButton);
      li.appendChild(endCallButton);
    }

    userList.appendChild(li);
  });
});
// --- End of Updated Section ---

function joinServer() {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Please enter a username!');
    return;
  }

  setupPeerConnection();
  startLocalStream();
  socket.emit('join-user', username); 
  socket.emit('join call', { username }); // Emit join call for phone support
}

document.getElementById('joinButton').addEventListener('click', joinServer);

