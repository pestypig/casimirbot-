# Knowledge vs Published Audio (Noise Gen)

This doc explains why Knowledge files feel "local" while published Noise Gen
tracks are global.

## Quick summary

- Knowledge uploads live on the device that uploaded them (local/IndexedDB).
- Publishing a Noise Gen original copies those files to server storage.
- Only published originals are visible and streamable for everyone.

## Why Knowledge is local

Knowledge projects are designed for fast personal work: tagging, previewing, and
curation without round-tripping to the server. That storage lives in the
browser (IndexedDB), so other devices and other users do not see it.

## How publishing makes it global

When you publish from the Noise Gen Upload Originals flow:

1) The app reads the selected Knowledge project's audio files.
2) The files are uploaded to server-side object storage.
3) The Noise Gen store writes a public record that references those uploaded
   assets.

Once that record exists, everyone can stream the track (and the server can
render from the stems).

## The current workflow

1) Add stems to a Knowledge project (My Knowledge).
2) Open Noise Gen > Upload Originals.
3) Choose that Noise Album project and confirm stem categories.
4) Click Upload to publish.

Result: the track becomes globally streamable.

## Updating a published track

If you change the local Knowledge files later, those changes are not shared
until you publish again. Publishing is the step that syncs a new version to
server storage.

## Future option (not implemented yet)

We can add a "Promote to Noise Gen" button that syncs Knowledge to server-side
storage in one step, so you do not need to re-upload manually.
