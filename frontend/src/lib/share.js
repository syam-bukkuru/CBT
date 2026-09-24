// Shares a link to the test's subject/topic page (not directly into the exam) so the
// recipient sees the test card and starts it themselves when ready — the exam's timer
// starts the instant its page mounts, so a direct exam link could burn someone's time
// before they've even opened it.
export async function shareTest(test) {
  const subjectId = test.subject?._id || test.subject
  const topicId = test.topic?._id || test.topic
  const url = `${window.location.origin}/subjects/${subjectId}?topic=${topicId}`
  const text = `Join me for "${test.title}" on CBT Portal`

  if (navigator.share) {
    try {
      await navigator.share({ title: test.title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // fall through to clipboard on any other share failure
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return 'copied'
  }

  return 'unsupported'
}
