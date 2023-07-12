import React, { useEffect, useRef, useState } from 'react'
import {
  Participant,
  ParticipantEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track
} from 'livekit-client'

const App = () => {
  const localParticipantVideoRef = useRef(null)
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const queryParams = new URLSearchParams(window.location.search)
  // 🚨 Don’t forget to add your own JWT!
  const token = queryParams.get("token")

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })

    room
      .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)

    const connectToRoom = async () => {
      await room.connect('wss://mux-replacement-o289rcji.livekit.cloud', token)
      console.log('connected to room', room.name)

      const localParticipant = room.localParticipant
      await localParticipant.enableCameraAndMicrophone()
    }

    connectToRoom()

    return () => {
      room.disconnect()
    }
  }, [token])

  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log("remote participant has been connected", participant)
    setRemoteParticipants(prevParticipants => [...prevParticipants, participant])
  }

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log("remote participant has been disconnected", participant)
    setRemoteParticipants(prevParticipants => prevParticipants.filter(p => p.sid !== participant.sid))
  }

  const handleTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log("track subscribed, remote participants", participant)
    console.log("track subscribed, track", track)
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const videoElement = document.getElementById(`remoteParticipantVideo-${participant.sid}`)
      if (videoElement) {
        track.attach(videoElement)
      }
    }
  }

  const handleTrackUnsubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => {
    console.log("track unsub, remote participants", participant)
    track.detach()
    const videoRef = document.getElementById(`remoteParticipantVideo-${participant.sid}`)
    if (videoRef) {
      videoRef.innerHTML = '' // Clear the video element
    }
  }

  const handleLocalTrackPublished = (publication: LocalTrackPublication,
    participant: LocalParticipant) => {
    // Perform actions or update the UI when a local track is published
    console.log('Local track published:', participant)

    const track = publication.track
    if (track.kind === Track.Kind.Video) {
      const videoElement = document.getElementById('localParticipantVideoId')
      if (videoElement) {
        track.attach(videoElement)
      }
    }
  }

  const handleLocalTrackUnpublished = (track: LocalTrackPublication, participant: LocalParticipant) => {
    track.detach()
    localParticipantVideoRef.current.innerHTML = '' // Clear the video element
  }

  const handleActiveSpeakerChange = (speakers: Participant[]) => {
    // show UI indicators when a participant is speaking
  }

  const handleDisconnect = () => {
    console.log('disconnected from room')
  }

  return (
    <div className="App">
      <video ref={localParticipantVideoRef} id="localParticipantVideoId"></video>

      {remoteParticipants.map((participant) => (
        <video key={participant.sid} id={`remoteParticipantVideo-${participant.sid}`}></video>
      ))}
    </div>
  )
}

export default App
