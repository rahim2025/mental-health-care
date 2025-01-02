const socket = io(); // Connect to the Socket.IO server

// Get DOM elements
const createUserBtn = document.getElementById('create-user');
const usernameInput = document.getElementById('username');
const allUserHtml = document.getElementById('allUsers');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// WebRTC configuration
let peerConnection;

// Handle the "Create User" button click
if (createUserBtn && usernameInput) {
  createUserBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
      socket.emit('join-user', username);
      const usernameInput = document.querySelector('.username-input');
      if (usernameInput) {
        usernameInput.style.display = 'none';
      }
    } else {
      alert('Please enter a username!');
    }
  });
}

// Handle users list update
socket.on('joined', (allUsers) => {
  if (!allUserHtml) return;
  
  allUserHtml.innerHTML = ''; // Clear the existing list
  for (const userId in allUsers) {
    const user = allUsers[userId];
    const li = document.createElement('li');
    li.textContent = `${user.username} ${user.username === usernameInput?.value ? '(You)' : ''}`;

    if (user.username !== usernameInput?.value) {
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-primary', 'call-btn');
      button.textContent = 'Call';
      button.addEventListener('click', () => {
        startCall(userId);
      });
      li.appendChild(button);
    }

    allUserHtml.appendChild(li);
  }
});

// Handle starting a call
function startCall(userId) {
  console.log('Starting call with user:', userId);

  // Set up the peer connection
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // Get local media
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
      if (localVideo) localVideo.srcObject = stream;
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    })
    .catch((err) => {
      console.error('Error accessing media devices:', err);
    });

  // When the remote stream is added
  peerConnection.ontrack = (event) => {
    console.log("Remote stream received:", event);
    if (event.streams[0] && remoteVideo) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, to: userId });
    }
  };

  // Create an offer and send it
  peerConnection.createOffer()
    .then((offer) => peerConnection.setLocalDescription(offer))
    .then(() => {
      socket.emit('offer', { offer: peerConnection.localDescription, to: userId });
    })
    .catch((err) => console.error('Error creating offer:', err));
}

// Handle receiving offer
socket.on('offer', async (data) => {
  try {
    const { offer, from } = data;

    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Set up local media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideo) localVideo.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("Remote stream received:", event);
      if (event.streams[0] && remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: from });
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('answer', { answer: peerConnection.localDescription, to: from });
  } catch (err) {
    console.error('Error handling offer:', err);
  }
});

// Handle receiving answer
socket.on('answer', async (data) => {
  try {
    const { answer } = data;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (err) {
    console.error('Error setting answer:', err);
  }
});

// Handle ICE candidates
socket.on('ice-candidate', async (data) => {
  try {
    const { candidate } = data;
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error('Error adding ICE candidate:', err);
  }
});

// Handle incoming calls
socket.on('incomingCall', (callerId) => {
  console.log('Incoming call from:', callerId);

  const callActions = document.getElementById('call-actions');
  if (callActions) {
    callActions.innerHTML = `
      <button id="receive-call" class="btn btn-success">Receive Call</button>
    `;

    const receiveCallButton = document.getElementById('receive-call');
    if (receiveCallButton) {
      receiveCallButton.addEventListener('click', () => {
        receiveCall(callerId);
      });
    }
  }
});

// Add receiveCall function (which was missing)
function receiveCall(callerId) {
  console.log('Receiving call from:', callerId);
  // Add your call receiving logic here
}
