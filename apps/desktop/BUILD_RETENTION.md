# Development build retention

Keep the running package, one verified rollback, and at most one candidate
awaiting validation. Once the candidate is launched and verified, recycle the
superseded rollback. Identify running EXE paths before recycling; never infer
that the oldest directory is unused.

`npm run pack:dir` checks completed `release-*` packages before packaging and
stops when three already exist. The check does not delete anything. Keep build
hashes, test results and evidence documents after recycling binaries. The main
`release` installer, source, runtime staging and installed user data are outside
automatic retention. Review temporary installers separately by exact path.

On Windows, recycle through a recoverable operation; do not permanently delete
or empty the Recycle Bin as part of routine build retention. Recycling moves
files out of the workspace but does not itself reclaim their disk space until
the Recycle Bin is emptied through a separately authorized action.
