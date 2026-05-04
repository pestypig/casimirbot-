export type SharedWorkstationParticipant = {
  participant_id: string;
  display_name: string;
  native_language?: string | null;
  speaker_id?: string | null;
  consent: {
    audio_capture: boolean;
    transcription: boolean;
    translation: boolean;
    voice_output: boolean;
  };
};

export type SharedWorkstationSession = {
  schema: "helix.shared_workstation_session.v1";
  session_id: string;
  room_id?: string | null;
  participants: SharedWorkstationParticipant[];
  created_at: string;
  updated_at: string;
};
