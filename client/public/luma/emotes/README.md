# Luma emoticon assets

Drop the seven SVGs for Luma's moods in this folder. Filenames are fixed so the UI can load them without configuration:

- `emoji mad.svg`
- `emoji upset.svg`
- `emoji shock.svg`
- `emoji question.svg`
- `emoji happy.svg`
- `emoji friend.svg`
- `emoji love.svg`

During development the files are served from `/luma/emotes/<name>.svg`. Matching PNGs are still used as fallbacks while migrating. If all sources for a mood are missing, the overlay hides itself.
