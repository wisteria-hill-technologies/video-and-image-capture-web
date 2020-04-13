import React, { useState, useEffect, useRef } from "react";

const useUserMedia = requestedMedia => {
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(requestedMedia);
        setMediaStream(stream);
      } catch(err) {
        console.log(err);
      }
    }

    if (!mediaStream) {
      enableStream();
    } else {
      return function cleanup() {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    }
  }, [mediaStream, requestedMedia]);

  return mediaStream;
};

const CAPTURE_OPTIONS = {
  audio: true,
  video: { facingMode: "environment" }
};

const App = () => {
  const recordingVideoRef = useRef();
  const playBackVideoRef = useRef();
  const canvasRef = useRef();
  const mediaStream = useUserMedia(CAPTURE_OPTIONS);

  const [ isRecording, setIsRecording ] = useState(false);
  const [ mediaRecorder, setMediaRecorder ] = useState(null);
  const [ photoSrc, setPhotoSrc ] = useState(null);
  const [ chunks, setChunks ] = useState([]); // array to which recording data is saved
  if (mediaStream && recordingVideoRef.current && !recordingVideoRef.current.srcObject) {
    recordingVideoRef.current.srcObject = mediaStream;
  }

  if (mediaRecorder !== null) {
    console.log('mediaRecorder>>', mediaRecorder);
    mediaRecorder.ondataavailable = (e) => {
      console.log('ondataavailable!');
      setChunks((prevChunks) => [ ...prevChunks, e.data]);
    };
    mediaRecorder.onstop = (e) => {
      let blob = new Blob(chunks, { 'type': 'video/mp4' });
      setChunks([]);
      let videoURL = window.URL.createObjectURL(blob);
      playBackVideoRef.current.src = videoURL;
    };
  }

  const handleCanPlay = async () => {
    await recordingVideoRef.current.play();
    setMediaRecorder(new MediaRecorder(mediaStream));  //tells mediaRecorder to listen to the media stream.
  };

  const toggleRecording = () => {
    if(isRecording) {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
    } else {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
    }
    setIsRecording(prevState => !prevState);
  };

  const capturePhoto = () => {
    console.log('canvasRef>>>', canvasRef)
    console.log('recordingVideoRef>>>', recordingVideoRef.current.videoHeight)
    const context = canvasRef.current.getContext('2d');
    context.drawImage(
      recordingVideoRef.current,
      0,
      0,
      recordingVideoRef.current.videoWidth,
      recordingVideoRef.current.videoHeight,
      0,
      0,
      recordingVideoRef.current.videoWidth,
      recordingVideoRef.current.videoHeight,
    );
    canvasRef.current.toBlob(blob => {
      setPhotoSrc(window.URL.createObjectURL(blob));
    });



  };

  return (
    <div>
      <h1>Media Capture and Streams API Example</h1>
      <div style={{ margin: '1rem' }}>
        <video
          ref={recordingVideoRef}
          onCanPlay={handleCanPlay}
          playsInline
          muted  //stop echoing
        />
      </div>
      <div style={{ margin: '1rem' }}>
        <button
          style={{ padding: '1rem', background: isRecording ? 'red' : 'green', fontSize: '1rem', color: 'white', borderRadius: '0.5rem' }}
          onClick={toggleRecording}
        >
          { isRecording ? 'Stop Recording' : 'Start Recording' }
        </button>
        <button
          style={{ padding: '1rem', fontSize: '1rem', color: 'black', borderRadius: '0.5rem' }}
          onClick={capturePhoto}
        >
          Capture Photo
        </button>
      </div>
      <div style={{ margin: '1rem' }}>
        <video
          controls
          ref={playBackVideoRef}
          playsInline
        />
      </div>
      <div style={{ margin: '1rem' }}>
        <canvas ref={canvasRef} width={640} height={480}/>
        {/*<img src={photoSrc} alt="" />*/}
      </div>
    </div>
  );
};

export default App;

