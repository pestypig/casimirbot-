import * as React from "react";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import type { KnowledgeFileRecord, KnowledgeProjectRecord } from "@/lib/agi/knowledge-store";
import MiniPlayer from "@/components/noise-gens/MiniPlayer";

type Props = {
  projectSlug?: string;
};

type AlbumMeta = KnowledgeProjectRecord["meta"] & {
  tracks?: Array<{
    id?: string;
    name?: string;
    stems?: { instrumental?: string; vocal?: string };
    tempo?: { bpm: number; timeSig: string; quantized?: boolean };
  }>;
};

const toUrlMap = (files: KnowledgeFileRecord[]): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (const file of files) {
    entries[file.id] = URL.createObjectURL(file.data);
  }
  return entries;
};

const revokeUrls = (map: Record<string, string>) => {
  Object.values(map).forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  });
};

export function ProjectAlbumPanel({ projectSlug }: Props) {
  const {
    refreshProjects,
    refreshFiles,
    noiseAlbums,
    projectFiles
  } = useKnowledgeProjectsStore((state) => ({
    noiseAlbums: state.projects.filter((project) => project.type === "noise-album"),
    projectFiles: state.projectFiles,
    refreshProjects: state.refresh,
    refreshFiles: state.refreshFiles
  }));
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  React.useEffect(() => {
    if (noiseAlbums.length === 0) {
      setSelectedId(undefined);
      return;
    }
    if (projectSlug) {
      const match = noiseAlbums.find((album) => album.hashSlug === projectSlug);
      if (match) {
        setSelectedId(match.id);
        return;
      }
    }
    setSelectedId((current) => current ?? noiseAlbums[0]?.id);
  }, [noiseAlbums, projectSlug]);

  React.useEffect(() => {
    if (!selectedId) return;
    void refreshFiles(selectedId);
  }, [selectedId, refreshFiles]);

  const files = React.useMemo<KnowledgeFileRecord[]>(() => {
    if (!selectedId) {
      return [];
    }
    return projectFiles[selectedId] ?? [];
  }, [projectFiles, selectedId]);
  const [urlMap, setUrlMap] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    revokeUrls(urlMap);
    const next = toUrlMap(files);
    setUrlMap(next);
    return () => {
      revokeUrls(next);
    };
  }, [files]);

  const selectedProject = noiseAlbums.find((album) => album.id === selectedId);
  const tracks = React.useMemo(() => {
    if (!selectedProject) return [];
    const meta = (selectedProject.meta ?? {}) as AlbumMeta;
    if (Array.isArray(meta.tracks) && meta.tracks.length > 0) {
      return meta.tracks.map((track, index) => {
        const instrumental = track.stems?.instrumental
          ? urlMap[track.stems.instrumental]
          : undefined;
        const vocal = track.stems?.vocal ? urlMap[track.stems.vocal] : undefined;
        const fallbackFile =
          track.stems?.instrumental ??
          track.stems?.vocal ??
          files.find((file) => file.name?.toLowerCase().includes(track.name?.toLowerCase() ?? ""))?.id;
        return {
          id: track.id ?? `track-${index}`,
          name: track.name ?? `Track ${index + 1}`,
          instrumental,
          vocal,
          fallbackUrl: fallbackFile ? urlMap[fallbackFile] : undefined,
          tempo: track.tempo,
        };
      });
    }
    return files
      .filter((file) => file.mime.startsWith("audio/"))
      .map((file, index) => ({
        id: file.id,
        name: file.name || `Track ${index + 1}`,
        instrumental: urlMap[file.id],
        vocal: undefined,
        fallbackUrl: urlMap[file.id],
        tempo: undefined,
      }));
  }, [files, selectedProject, urlMap]);

  if (noiseAlbums.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">No noise albums yet.</p>
        <p className="mt-2">
          Create a project with <code className="rounded bg-black/40 px-1 py-0.5">type: noise-album</code> and drop stems
          in Settings → AGI Knowledge to unlock this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Noise Album</p>
          <p className="text-xs text-slate-400">
            Pulls audio directly from local Knowledge Projects. Nothing leaves this device.
          </p>
        </div>
        <select
          className="rounded-lg border border-white/15 bg-black/20 px-3 py-1 text-sm text-white focus:border-sky-500 focus:outline-none"
          value={selectedId ?? ""}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {noiseAlbums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <div className="mt-4 space-y-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Tracks ({tracks.length})
          </p>
          {tracks.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-4 text-sm text-slate-400">
              Drop WAV or MP3 stems into this project to start playback.
            </div>
          )}
          {tracks.map((track, index) => (
            <div key={track.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{track.name}</p>
                  <p className="text-xs text-slate-400">Track {index + 1}</p>
                </div>
                {track.tempo?.bpm && (
                  <p className="text-xs text-slate-400">
                    {track.tempo.bpm} BPM · {track.tempo.timeSig}
                  </p>
                )}
              </div>
              <div className="mt-3">
                {track.instrumental && track.vocal ? (
                  <MiniPlayer
                    instrumental={track.instrumental}
                    vocal={track.vocal}
                    offsetMs={0}
                    tempo={track.tempo}
                  />
                ) : track.fallbackUrl ? (
                  <audio controls src={track.fallbackUrl} className="w-full rounded-lg">
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <p className="text-xs text-slate-400">No stems mapped for this track.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectAlbumPanel;
