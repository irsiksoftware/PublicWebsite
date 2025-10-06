## Summary
Enhanced modal UX with ESC key and outside click close functionality, plus body scroll prevention.

## Changes
- Added ESC key listener to close modal when open
- Implemented overlay click to close modal
- Added `event.stopPropagation()` on modal content to prevent content clicks from closing
- Body scroll is now locked when modal is open (already implemented in open/close methods)

## Implementation Details
- Modal content clicks are explicitly stopped from propagating to prevent accidental closure
- ESC key listener checks `isOpen` state to only trigger when modal is active
- Overlay click handler provides intuitive close behavior
- Body scroll lock uses `overflow: hidden` on document.body

## Testing
- ✓ ESC key closes modal
- ✓ Clicking overlay closes modal
- ✓ Clicking modal content does not close modal
- ✓ Body scroll locked when modal open

Closes #224