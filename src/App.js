import { useCallback, useEffect, useRef, useState } from "react";
import {
  Space,
  SpaceEvent,
  getUserMedia,
  getDisplayMedia,
} from "@mux/spaces-web";

import Participant from "./Participant";
import "./App.css";

function App() {
  const queryParams = new URLSearchParams(window.location.search);
  // 🚨 Don’t forget to add your own JWT!
  const JWT = queryParams.get("jwt");

  const spaceRef = useRef(null);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const joined = !!localParticipant;

  const addParticipant = useCallback(
    (participant) => {
      setParticipants((currentParticipants) => [
        ...currentParticipants,
        participant,
      ]);
    },
    [setParticipants]
  );

  const removeParticipant = useCallback(
    (participantLeaving) => {
      setParticipants((currentParticipants) =>
        currentParticipants.filter(
          (currentParticipant) =>
            currentParticipant.connectionId !== participantLeaving.connectionId
        )
      );
    },
    [setParticipants]
  );

  useEffect(() => {
    const space = new Space(JWT);

    space.on(SpaceEvent.ParticipantJoined, addParticipant);
    space.on(SpaceEvent.ParticipantLeft, removeParticipant);

    spaceRef.current = space;

    return () => {
      space.off(SpaceEvent.ParticipantJoined, addParticipant);
      space.off(SpaceEvent.ParticipantLeft, removeParticipant);
    };
  }, [JWT, addParticipant, removeParticipant]);

  const join = useCallback(async () => {
    // Join the Space
    let localParticipant = await spaceRef.current.join();

    let localDisplayTracks = await getDisplayMedia({
      audio: false,
      video: true,
    });

    let localTracks = await getUserMedia({
      audio: true,
      video: true,
    });

    await localParticipant.publishTracks([
      ...localDisplayTracks,
      ...localTracks,
    ]);

    // // Set the local participant so it will be rendered
    setLocalParticipant(localParticipant);
  }, []);

  return (
    <div className="App">
      <button onClick={join} disabled={joined}>
        Join Space
      </button>

      {localParticipant && (
        <Participant
          key={localParticipant.connectionId}
          participant={localParticipant}
        />
      )}

      {participants.map((participant) => {
        return (
          <Participant
            key={participant.connectionId}
            participant={participant}
          />
        );
      })}
    </div>
  );
}

export default App;
